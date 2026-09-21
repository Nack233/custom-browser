import { session, app, shell, BrowserWindow, DownloadItem } from 'electron';
import * as path from 'path';
import type { DownloadItemInfo } from '../types/browser';

export class DownloadManager {
  private downloads: Map<string, DownloadItemInfo> = new Map();
  private activeElectronItems: Map<string, DownloadItem> = new Map();
  private mainWindow?: BrowserWindow;
  private attachedSessions: Set<Electron.Session> = new Set();
  private lastBytesTime: Map<string, { bytes: number; time: number }> = new Map();

  constructor() {}

  public setMainWindow(win: BrowserWindow) {
    this.mainWindow = win;
  }

  public attachSession(ses: Electron.Session) {
    if (this.attachedSessions.has(ses)) return;
    this.attachedSessions.add(ses);

    ses.on('will-download', (_event, item) => {
      const id = 'dl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const filename = item.getFilename();
      const downloadsDir = app.getPath('downloads');
      const savePath = path.join(downloadsDir, filename);

      // Set default save path
      item.setSavePath(savePath);

      const info: DownloadItemInfo = {
        id,
        filename,
        url: item.getURL(),
        state: 'progressing',
        receivedBytes: item.getReceivedBytes(),
        totalBytes: item.getTotalBytes(),
        speed: 0,
        savePath,
        startTime: Date.now(),
        mimeType: item.getMimeType(),
        isZip: filename.toLowerCase().endsWith('.zip'),
      };

      this.downloads.set(id, info);
      this.activeElectronItems.set(id, item);
      this.lastBytesTime.set(id, { bytes: item.getReceivedBytes(), time: Date.now() });

      this.notifyDownloadProgress(info);

      item.on('updated', (_evt, state) => {
        if (state === 'interrupted') {
          info.state = 'interrupted';
        } else if (state === 'progressing') {
          info.state = 'progressing';
        }

        info.receivedBytes = item.getReceivedBytes();
        info.totalBytes = item.getTotalBytes();
        info.savePath = item.getSavePath();

        // Calculate speed (bytes per second)
        const now = Date.now();
        const last = this.lastBytesTime.get(id);
        if (last && now - last.time >= 400) {
          const timeDiff = (now - last.time) / 1000;
          const bytesDiff = info.receivedBytes - last.bytes;
          info.speed = Math.max(0, Math.round(bytesDiff / timeDiff));
          this.lastBytesTime.set(id, { bytes: info.receivedBytes, time: now });
        }

        this.downloads.set(id, { ...info });
        this.notifyDownloadProgress(info);
      });

      item.once('done', (_evt, state) => {
        this.activeElectronItems.delete(id);
        this.lastBytesTime.delete(id);

        if (state === 'completed') {
          info.state = 'completed';
          info.receivedBytes = info.totalBytes > 0 ? info.totalBytes : item.getReceivedBytes();
          info.savePath = item.getSavePath();
        } else if (state === 'cancelled') {
          info.state = 'cancelled';
        } else {
          info.state = 'interrupted';
        }

        this.downloads.set(id, { ...info });
        this.notifyDownloadComplete(info);
      });
    });
  }

  // Manual download tracking for media extractor & ZIP downloads
  public registerManualDownload(info: DownloadItemInfo): string {
    this.downloads.set(info.id, { ...info });
    this.notifyDownloadProgress(info);
    return info.id;
  }

  public updateManualDownload(id: string, partial: Partial<DownloadItemInfo>) {
    const existing = this.downloads.get(id);
    if (!existing) return;
    const updated = { ...existing, ...partial };
    this.downloads.set(id, updated);
    if (updated.state === 'completed' || updated.state === 'cancelled' || updated.state === 'interrupted') {
      this.notifyDownloadComplete(updated);
    } else {
      this.notifyDownloadProgress(updated);
    }
  }

  public getDownloads(): DownloadItemInfo[] {
    return Array.from(this.downloads.values()).sort((a, b) => b.startTime - a.startTime);
  }

  public cancelDownload(id: string): boolean {
    const item = this.activeElectronItems.get(id);
    if (item) {
      item.cancel();
      this.activeElectronItems.delete(id);
      const info = this.downloads.get(id);
      if (info) {
        info.state = 'cancelled';
        this.notifyDownloadComplete(info);
      }
      return true;
    }
    const info = this.downloads.get(id);
    if (info && info.state === 'progressing') {
      info.state = 'cancelled';
      this.notifyDownloadComplete(info);
      return true;
    }
    return false;
  }

  public clearHistory() {
    for (const [id, item] of this.downloads.entries()) {
      if (item.state !== 'progressing') {
        this.downloads.delete(id);
      }
    }
  }

  public async openFile(filePath: string): Promise<boolean> {
    if (!filePath) return false;
    const res = await shell.openPath(filePath);
    return res === ''; // empty string means success
  }

  public showInFolder(filePath: string) {
    if (filePath) {
      shell.showItemInFolder(filePath);
    }
  }

  public async openDownloadsFolder() {
    await shell.openPath(app.getPath('downloads'));
  }

  private notifyDownloadProgress(item: DownloadItemInfo) {
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send('download:progress', item);
      }
    });
  }

  private notifyDownloadComplete(item: DownloadItemInfo) {
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send('download:complete', item);
      }
    });
  }
}
