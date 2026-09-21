import { session, WebContents, app, dialog, net } from 'electron';
import type { MediaItem } from '../types/browser';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import JSZip from 'jszip';
import type { DownloadManager } from './downloadManager';

export class MediaSnifferService {
  private tabMedia: Map<string, Map<string, MediaItem>> = new Map();
  private onMediaFoundCallback?: (tabId: string, item: MediaItem) => void;
  private activeTabProvider?: () => string | null;
  private downloadManager?: DownloadManager;

  constructor(downloadManager?: DownloadManager) {
    this.downloadManager = downloadManager;
    this.initNetworkSniffer();
  }

  public setDownloadManager(dm: DownloadManager) {
    this.downloadManager = dm;
  }

  public setActiveTabProvider(cb: () => string | null) {
    this.activeTabProvider = cb;
  }

  public setOnMediaFoundCallback(cb: (tabId: string, item: MediaItem) => void) {
    this.onMediaFoundCallback = cb;
  }

  // Fast media-type extension check (no regex, no URL parsing)
  private static readonly MEDIA_EXTENSIONS = new Set([
    '.mp4', '.webm', '.ogv', '.mov', '.mkv',
    '.m3u8', '.mpd',
    '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif'
  ]);

  private isMediaUrl(url: string): boolean {
    // Quick check: find last dot before query string
    const qIdx = url.indexOf('?');
    const pathEnd = qIdx > 0 ? qIdx : url.length;
    const dotIdx = url.lastIndexOf('.', pathEnd);
    if (dotIdx < 0) return false;
    const ext = url.substring(dotIdx, pathEnd).toLowerCase();
    return MediaSnifferService.MEDIA_EXTENSIONS.has(ext);
  }

  private initNetworkSniffer() {
    // Intercept headers received for all requests
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      try {
        const url = details.url;

        // PERF: Skip data URLs and non-HTTP(s) immediately
        if (url.startsWith('data:') || url.startsWith('chrome') || url.startsWith('devtools')) {
          return callback({ cancel: false });
        }

        const headers = details.responseHeaders || {};
        const getHeader = (name: string): string | undefined => {
          const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
          return key ? headers[key][0] : undefined;
        };

        const contentType = getHeader('content-type') || '';

        // PERF: Early-return for non-media content types (HTML, CSS, JS, JSON, fonts, etc.)
        // Only proceed if content-type hints at media OR the URL extension matches known media
        const isMediaContentType =
          contentType.startsWith('video/') ||
          contentType.startsWith('image/') ||
          contentType.includes('mpegurl') ||
          contentType.includes('application/dash+xml');

        if (!isMediaContentType && !this.isMediaUrl(url)) {
          return callback({ cancel: false });
        }

        const contentLength = getHeader('content-length');
        const size = contentLength ? parseInt(contentLength, 10) : undefined;

        let type: 'image' | 'video' | 'stream' | null = null;

        if (contentType.startsWith('video/') || /\.(mp4|webm|ogv|mov|mkv)(\?.*)?$/i.test(url)) {
          type = 'video';
        } else if (
          contentType.includes('mpegurl') ||
          contentType.includes('application/dash+xml') ||
          /\.(m3u8|mpd)(\?.*)?$/i.test(url)
        ) {
          type = 'stream';
        } else if (contentType.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg|avif)(\?.*)?$/i.test(url)) {
          // Ignore tiny tracking gifs (< 1000 bytes)
          if (!size || size > 1000) {
            type = 'image';
          }
        }

        if (type) {
          // PERF: Use simple FNV-1a hash instead of crypto MD5
          let hash = 2166136261;
          for (let i = 0; i < url.length; i++) {
            hash ^= url.charCodeAt(i);
            hash = (hash * 16777619) >>> 0;
          }
          const id = hash.toString(36);

          const item: MediaItem = { id, url, type, mimeType: contentType, size };

          const tabId = details.webContentsId
            ? `tab_${details.webContentsId}`
            : (this.activeTabProvider?.() || 'global');
          this.addMediaItem(tabId, item);
        }
      } catch (e) {
        // Suppress errors during sniffing
      }

      callback({ cancel: false });
    });
  }

  public addMediaItem(tabId: string, item: MediaItem) {
    if (!this.tabMedia.has(tabId)) {
      this.tabMedia.set(tabId, new Map());
    }
    const map = this.tabMedia.get(tabId)!;
    if (!map.has(item.url)) {
      map.set(item.url, item);
      if (this.onMediaFoundCallback) {
        this.onMediaFoundCallback(tabId, item);
      }
    }
  }

  public getMediaForTab(tabId: string): MediaItem[] {
    const map = this.tabMedia.get(tabId);
    if (!map) return [];
    return Array.from(map.values());
  }

  public clearTab(tabId: string) {
    this.tabMedia.delete(tabId);
  }

  /**
   * Scrapes DOM in the given WebContents for high-resolution images & videos
   */
  public async extractFromDOM(webContents: WebContents): Promise<MediaItem[]> {
    const script = `
      (() => {
        const items = [];
        const seenUrls = new Set();

        // 1. Extract Images
        const imgs = Array.from(document.querySelectorAll('img, picture source, [style*="background-image"]'));
        imgs.forEach(el => {
          let src = '';
          if (el.tagName === 'IMG') {
            src = el.currentSrc || el.src || el.getAttribute('data-src') || el.getAttribute('data-lazy-src') || '';
          } else if (el.tagName === 'SOURCE') {
            src = el.srcset || el.src || '';
          } else {
            const bg = window.getComputedStyle(el).backgroundImage;
            const match = bg.match(/url\\(["']?([^"')]+)["']?\\)/);
            if (match) src = match[1];
          }

          if (src && !src.startsWith('data:') && !seenUrls.has(src)) {
            try {
              const absUrl = new URL(src, document.baseURI).href;
              seenUrls.add(absUrl);
              items.push({
                id: Math.random().toString(36).substr(2, 9),
                url: absUrl,
                type: 'image',
                alt: el.alt || el.getAttribute('title') || '',
                width: el.naturalWidth || el.clientWidth || undefined,
                height: el.naturalHeight || el.clientHeight || undefined
              });
            } catch(e) {}
          }
        });

        // 2. Extract Videos
        const videos = Array.from(document.querySelectorAll('video, video source'));
        videos.forEach(el => {
          const src = el.src || el.currentSrc || el.getAttribute('data-src') || '';
          if (src && !src.startsWith('data:') && !seenUrls.has(src)) {
            try {
              const absUrl = new URL(src, document.baseURI).href;
              seenUrls.add(absUrl);
              items.push({
                id: Math.random().toString(36).substr(2, 9),
                url: absUrl,
                type: 'video',
                width: el.videoWidth || undefined,
                height: el.videoHeight || undefined
              });
            } catch(e) {}
          }
        });

        return items;
      })();
    `;

    try {
      const results: MediaItem[] = await webContents.executeJavaScript(script);
      const tabId = `tab_${webContents.id}`;
      results.forEach((item) => {
        // PERF: Use FNV-1a hash instead of MD5
        let hash = 2166136261;
        for (let i = 0; i < item.url.length; i++) {
          hash ^= item.url.charCodeAt(i);
          hash = (hash * 16777619) >>> 0;
        }
        item.id = hash.toString(36);
        this.addMediaItem(tabId, item);
      });
      return results;
    } catch (err) {
      console.error('[MediaSniffer] DOM extraction error:', err);
      return [];
    }
  }

  /**
   * Starts an interactive element picker on the web page to extract images from a specific section
   */
  public async pickSectionFromDOM(webContents: WebContents): Promise<MediaItem[]> {
    const script = `
      (() => {
        return new Promise((resolve) => {
          // 1. Overlay highlighter
          const overlay = document.createElement('div');
          overlay.id = '__nexus_picker_overlay';
          Object.assign(overlay.style, {
            position: 'fixed',
            pointerEvents: 'none',
            border: '2px solid #10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
            zIndex: '2147483647',
            transition: 'all 0.08s ease-out',
            display: 'none',
            borderRadius: '4px',
          });
          document.body.appendChild(overlay);

          // 2. Banner notification
          const banner = document.createElement('div');
          banner.id = '__nexus_picker_banner';
          banner.innerHTML = '🎯 <b>คลิกเลือกภาพหรือส่วนที่ต้องการ</b> เพื่อดูดภาพทั้งหมดในกลุ่มเดียวกัน (กด <b>Esc</b> เพื่อยกเลิก)';
          Object.assign(banner.style, {
            position: 'fixed',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#111827',
            color: '#f3f4f6',
            padding: '10px 22px',
            borderRadius: '9999px',
            fontSize: '13px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
            zIndex: '2147483647',
            border: '1.5px solid #10b981',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            pointerEvents: 'none',
          });
          document.body.appendChild(banner);

          let currentTarget = null;

          const cleanup = () => {
            window.removeEventListener('mousemove', onMouseMove, true);
            window.removeEventListener('click', onClick, true);
            window.removeEventListener('keydown', onKeyDown, true);
            overlay.remove();
            banner.remove();
          };

          const onMouseMove = (e) => {
            const el = document.elementFromPoint(e.clientX, e.clientY);
            if (!el || el === overlay || el === banner) return;
            currentTarget = el;
            const rect = el.getBoundingClientRect();
            Object.assign(overlay.style, {
              display: 'block',
              top: rect.top + 'px',
              left: rect.left + 'px',
              width: rect.width + 'px',
              height: rect.height + 'px',
            });
          };

          const onKeyDown = (e) => {
            if (e.key === 'Escape') {
              cleanup();
              resolve([]);
            }
          };

          const onClick = (e) => {
            e.preventDefault();
            e.stopPropagation();

            const el = currentTarget || e.target;
            cleanup();

            if (!el) return resolve([]);

            // Find target image or container
            let targetImg = el.tagName === 'IMG' ? el : el.querySelector('img');
            let container = el;

            // Find repeating parent container if clicked on an item
            if (targetImg) {
              let parent = targetImg.parentElement;
              for (let i = 0; i < 5 && parent && parent !== document.body; i++) {
                const siblingImgs = parent.parentElement ? parent.parentElement.querySelectorAll('img') : [];
                if (siblingImgs.length >= 2) {
                  container = parent.parentElement;
                  break;
                }
                parent = parent.parentElement;
              }
            }

            // Extract all media inside that container
            const foundImgs = Array.from(container.querySelectorAll('img, picture source, [style*="background-image"]'));
            const results = [];
            const seenUrls = new Set();

            foundImgs.forEach((imgEl) => {
              let src = '';
              if (imgEl.tagName === 'IMG') {
                src = imgEl.currentSrc || imgEl.src || imgEl.getAttribute('data-src') || imgEl.getAttribute('data-lazy-src') || '';
              } else if (imgEl.tagName === 'SOURCE') {
                src = imgEl.srcset || imgEl.src || '';
              } else {
                const bg = window.getComputedStyle(imgEl).backgroundImage;
                const match = bg.match(/url\\(["']?([^"')]+)["']?\\)/);
                if (match) src = match[1];
              }

              if (!src || src.startsWith('data:') || seenUrls.has(src)) return;

              try {
                const absUrl = new URL(src, document.baseURI).href;
                if (seenUrls.has(absUrl)) return;
                seenUrls.add(absUrl);

                const w = imgEl.naturalWidth || imgEl.clientWidth || undefined;
                const h = imgEl.naturalHeight || imgEl.clientHeight || undefined;

                // Ignore tiny UI icons
                if (w && w < 32 && h && h < 32) return;

                results.push({
                  id: Math.random().toString(36).substr(2, 9),
                  url: absUrl,
                  type: 'image',
                  alt: imgEl.alt || imgEl.getAttribute('title') || '',
                  width: w,
                  height: h,
                });
              } catch {}
            });

            // Also check for videos in that container
            const foundVideos = Array.from(container.querySelectorAll('video, video source'));
            foundVideos.forEach((vidEl) => {
              const src = vidEl.src || vidEl.currentSrc || vidEl.getAttribute('data-src') || '';
              if (src && !src.startsWith('data:') && !seenUrls.has(src)) {
                try {
                  const absUrl = new URL(src, document.baseURI).href;
                  seenUrls.add(absUrl);
                  results.push({
                    id: Math.random().toString(36).substr(2, 9),
                    url: absUrl,
                    type: 'video',
                    width: vidEl.videoWidth || undefined,
                    height: vidEl.videoHeight || undefined,
                  });
                } catch {}
              }
            });

            resolve(results);
          };

          window.addEventListener('mousemove', onMouseMove, true);
          window.addEventListener('click', onClick, true);
          window.addEventListener('keydown', onKeyDown, true);
        });
      })();
    `;

    try {
      const results: MediaItem[] = await webContents.executeJavaScript(script);
      const tabId = `tab_${webContents.id}`;
      results.forEach((item) => {
        item.id = crypto.createHash('md5').update(item.url).digest('hex');
        this.addMediaItem(tabId, item);
      });
      return results;
    } catch (err) {
      console.error('[MediaSniffer] Pick section error:', err);
      return [];
    }
  }

  /**
   * Downloads a media file directly to the system Downloads folder
   */
  public async downloadFile(mediaUrl: string, suggestedName?: string): Promise<{ success: boolean; path?: string; error?: string }> {
    const dlId = 'dl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    try {
      const downloadsDir = app.getPath('downloads');
      let filename = suggestedName;

      if (!filename) {
        try {
          const parsed = new URL(mediaUrl);
          filename = path.basename(parsed.pathname);
        } catch {
          filename = `download_${Date.now()}`;
        }
      }

      if (!filename || filename.length < 3 || !filename.includes('.')) {
        filename = `media_${Date.now()}.png`;
      }

      // Ensure clean filename
      filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const targetPath = path.join(downloadsDir, filename);

      this.downloadManager?.registerManualDownload({
        id: dlId,
        filename,
        url: mediaUrl,
        state: 'progressing',
        receivedBytes: 0,
        totalBytes: 0,
        savePath: targetPath,
        startTime: Date.now(),
        isZip: false,
      });

      const res = await net.fetch(mediaUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.promises.writeFile(targetPath, buffer);

      this.downloadManager?.updateManualDownload(dlId, {
        state: 'completed',
        receivedBytes: buffer.length,
        totalBytes: buffer.length,
        savePath: targetPath,
      });

      console.log(`[Media Downloaded] Saved to ${targetPath}`);
      return { success: true, path: targetPath };
    } catch (err: any) {
      console.error('[Media Download Failed]', err);
      this.downloadManager?.updateManualDownload(dlId, {
        state: 'interrupted',
      });
      return { success: false, error: err.message };
    }
  }

  /**
   * Downloads multiple media files, compresses them into a single .zip file,
   * and saves it to the system Downloads folder.
   */
  public async downloadZip(
    items: MediaItem[],
    suggestedZipName?: string,
    onProgress?: (current: number, total: number, percent: number, status: string) => void
  ): Promise<{ success: boolean; path?: string; sizeBytes?: number; error?: string }> {
    if (!items || items.length === 0) {
      return { success: false, error: 'No items to zip' };
    }

    const zipDlId = 'zip_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    let rawName = suggestedZipName || `Manga_Chapter_${Date.now()}`;
    rawName = rawName.replace(/[/\\?%*:|"<>]/g, '_').trim();
    if (!rawName.toLowerCase().endsWith('.zip')) {
      rawName += '.zip';
    }
    const targetPath = path.join(app.getPath('downloads'), rawName);

    this.downloadManager?.registerManualDownload({
      id: zipDlId,
      filename: rawName,
      url: 'nexus://zip',
      state: 'progressing',
      receivedBytes: 0,
      totalBytes: 100,
      savePath: targetPath,
      startTime: Date.now(),
      isZip: true,
    });

    try {
      const zip = new JSZip();
      const total = items.length;
      let completed = 0;

      onProgress?.(0, total, 0, `กำลังเริ่มดาวน์โหลด 0/${total} ภาพ...`);

      const getExt = (urlStr: string, mime?: string): string => {
        if (mime?.includes('png')) return '.png';
        if (mime?.includes('jpeg') || mime?.includes('jpg')) return '.jpg';
        if (mime?.includes('webp')) return '.webp';
        if (mime?.includes('gif')) return '.gif';
        if (mime?.includes('mp4')) return '.mp4';
        try {
          const p = new URL(urlStr).pathname;
          const ext = path.extname(p);
          if (ext && ext.length <= 5) return ext;
        } catch {}
        return '.jpg';
      };

      // Batch download in parallel chunks of 5
      const concurrency = 5;
      for (let i = 0; i < items.length; i += concurrency) {
        const chunk = items.slice(i, i + concurrency);
        await Promise.all(
          chunk.map(async (item, chunkIdx) => {
            const index = i + chunkIdx;
            try {
              const res = await net.fetch(item.url);
              if (res.ok) {
                const arrayBuffer = await res.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const ext = getExt(item.url, item.mimeType);
                const padIndex = String(index + 1).padStart(3, '0');
                const filename = `page_${padIndex}${ext}`;
                zip.file(filename, buffer);
              }
            } catch (fetchErr) {
              console.warn(`[ZIP Fetch Failed] index ${index} (${item.url}):`, fetchErr);
            } finally {
              completed++;
              const percent = Math.round((completed / total) * 80);
              onProgress?.(completed, total, percent, `ดาวน์โหลดแล้ว ${completed}/${total} ภาพ...`);
              this.downloadManager?.updateManualDownload(zipDlId, {
                receivedBytes: percent,
                totalBytes: 100,
              });
            }
          })
        );
      }

      onProgress?.(total, total, 85, 'กำลังบีบอัดไฟล์ ZIP...');
      this.downloadManager?.updateManualDownload(zipDlId, {
        receivedBytes: 85,
        totalBytes: 100,
      });

      // Generate zip buffer
      const zipBuffer = await zip.generateAsync(
        {
          type: 'nodebuffer',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 },
        },
        (metadata) => {
          const compPercent = 85 + Math.round((metadata.percent / 100) * 15);
          const currentPct = Math.min(99, compPercent);
          onProgress?.(total, total, currentPct, `กำลังสร้างไฟล์ .ZIP (${Math.round(metadata.percent)}%)...`);
          this.downloadManager?.updateManualDownload(zipDlId, {
            receivedBytes: currentPct,
            totalBytes: 100,
          });
        }
      );

      await fs.promises.writeFile(targetPath, zipBuffer);

      onProgress?.(total, total, 100, `บันทึกไฟล์ ZIP สำเร็จ! (${(zipBuffer.length / (1024 * 1024)).toFixed(1)} MB)`);
      this.downloadManager?.updateManualDownload(zipDlId, {
        state: 'completed',
        receivedBytes: zipBuffer.length,
        totalBytes: zipBuffer.length,
        savePath: targetPath,
      });

      console.log(`[ZIP Created] Saved ${total} files to ${targetPath} (${zipBuffer.length} bytes)`);

      return {
        success: true,
        path: targetPath,
        sizeBytes: zipBuffer.length,
      };
    } catch (err: any) {
      console.error('[ZIP Creation Failed]', err);
      this.downloadManager?.updateManualDownload(zipDlId, {
        state: 'interrupted',
      });
      return { success: false, error: err.message };
    }
  }
}
