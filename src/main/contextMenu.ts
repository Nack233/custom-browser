import { Menu, MenuItem, clipboard, WebContents, BrowserWindow } from 'electron';

export interface ContextMenuActions {
  createTab: (url: string, isIncognito?: boolean) => string;
  goBack: (tabId: string) => void;
  goForward: (tabId: string) => void;
  reload: (tabId: string) => void;
  canGoBack: (tabId: string) => boolean;
  canGoForward: (tabId: string) => boolean;
  getTabUrl: (tabId: string) => string;
}

export class ContextMenuManager {
  private mainWindow: BrowserWindow;
  private actions: ContextMenuActions;
  private currentLanguage: 'th' | 'en' = 'th';

  constructor(mainWindow: BrowserWindow, actions: ContextMenuActions, language: 'th' | 'en' = 'th') {
    this.mainWindow = mainWindow;
    this.actions = actions;
    this.currentLanguage = language;
  }

  public setLanguage(lang: 'th' | 'en') {
    this.currentLanguage = lang;
  }

  public attachToWebContents(wc: WebContents, tabId: string, isIncognito = false) {
    wc.on('context-menu', (_event, params) => {
      if (wc.isDestroyed()) return;
      const isTh = this.currentLanguage === 'th';
      const menu = new Menu();

      // 1. LINK ACTIONS
      if (params.linkURL && params.linkURL.trim().length > 0) {
        menu.append(
          new MenuItem({
            label: isTh ? '🔗 เปิดลิงก์ในแท็บใหม่' : '🔗 Open Link in New Tab',
            click: () => {
              this.actions.createTab(params.linkURL, isIncognito);
            },
          })
        );

        menu.append(
          new MenuItem({
            label: isTh ? '🕵️ เปิดลิงก์ในแท็บไม่ระบุตัวตน' : '🕵️ Open Link in Incognito Tab',
            click: () => {
              this.actions.createTab(params.linkURL, true);
            },
          })
        );

        menu.append(
          new MenuItem({
            label: isTh ? '📋 คัดลอกที่อยู่ลิงก์' : '📋 Copy Link Address',
            click: () => {
              clipboard.writeText(params.linkURL);
            },
          })
        );

        menu.append(new MenuItem({ type: 'separator' }));
      }

      // 2. IMAGE / MEDIA ACTIONS
      if (params.hasImageContents || params.mediaType === 'image' || (params.srcURL && params.srcURL.startsWith('http'))) {
        menu.append(
          new MenuItem({
            label: isTh ? '🖼️ เปิดรูปภาพในแท็บใหม่' : '🖼️ Open Image in New Tab',
            click: () => {
              this.actions.createTab(params.srcURL, isIncognito);
            },
          })
        );

        menu.append(
          new MenuItem({
            label: isTh ? '💾 บันทึกรูปภาพเป็น...' : '💾 Save Image As...',
            click: () => {
              try {
                wc.downloadURL(params.srcURL);
              } catch (e) {
                console.error('[ContextMenu] Failed downloading image:', e);
              }
            },
          })
        );

        menu.append(
          new MenuItem({
            label: isTh ? '📋 คัดลอกรูปภาพ' : '📋 Copy Image',
            click: () => {
              try {
                wc.copyImageAt(params.x, params.y);
              } catch (e) {
                console.error('[ContextMenu] Failed copying image:', e);
              }
            },
          })
        );

        menu.append(
          new MenuItem({
            label: isTh ? '📋 คัดลอกที่อยู่รูปภาพ' : '📋 Copy Image Address',
            click: () => {
              clipboard.writeText(params.srcURL);
            },
          })
        );

        menu.append(new MenuItem({ type: 'separator' }));
      }

      // 3. SELECTION TEXT ACTIONS
      const trimmedSelection = params.selectionText ? params.selectionText.trim() : '';
      if (trimmedSelection.length > 0) {
        menu.append(
          new MenuItem({
            label: isTh ? '📋 คัดลอก' : '📋 Copy',
            accelerator: 'CmdOrCtrl+C',
            role: 'copy',
          })
        );

        const previewQuery = trimmedSelection.length > 25 ? `${trimmedSelection.slice(0, 25)}...` : trimmedSelection;
        menu.append(
          new MenuItem({
            label: isTh ? `🔍 ค้นหา Google สำหรับ "${previewQuery}"` : `🔍 Search Google for "${previewQuery}"`,
            click: () => {
              const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(trimmedSelection)}`;
              this.actions.createTab(searchUrl, isIncognito);
            },
          })
        );

        menu.append(new MenuItem({ type: 'separator' }));
      }

      // 4. EDITABLE FIELDS (Input / Textarea)
      if (params.isEditable) {
        menu.append(
          new MenuItem({
            label: isTh ? '✂️ ตัด' : '✂️ Cut',
            accelerator: 'CmdOrCtrl+X',
            role: 'cut',
          })
        );
        menu.append(
          new MenuItem({
            label: isTh ? '📋 คัดลอก' : '📋 Copy',
            accelerator: 'CmdOrCtrl+C',
            role: 'copy',
          })
        );
        menu.append(
          new MenuItem({
            label: isTh ? '📋 วาง' : '📋 Paste',
            accelerator: 'CmdOrCtrl+V',
            role: 'paste',
          })
        );
        menu.append(
          new MenuItem({
            label: isTh ? '🔤 เลือกทั้งหมด' : '🔤 Select All',
            accelerator: 'CmdOrCtrl+A',
            role: 'selectAll',
          })
        );
        menu.append(new MenuItem({ type: 'separator' }));
      }

      // 5. STANDARD NAVIGATION & PAGE ACTIONS
      const canBack = this.actions.canGoBack(tabId);
      const canFwd = this.actions.canGoForward(tabId);

      menu.append(
        new MenuItem({
          label: isTh ? 'ย้อนกลับ' : 'Back',
          accelerator: 'Alt+Left',
          enabled: canBack,
          click: () => this.actions.goBack(tabId),
        })
      );

      menu.append(
        new MenuItem({
          label: isTh ? 'ไปข้างหน้า' : 'Forward',
          accelerator: 'Alt+Right',
          enabled: canFwd,
          click: () => this.actions.goForward(tabId),
        })
      );

      menu.append(
        new MenuItem({
          label: isTh ? 'โหลดใหม่' : 'Refresh',
          accelerator: 'CmdOrCtrl+R',
          click: () => this.actions.reload(tabId),
        })
      );

      menu.append(new MenuItem({ type: 'separator' }));

      menu.append(
        new MenuItem({
          label: isTh ? 'บันทึกหน้าเป็น...' : 'Save as...',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            try {
              wc.downloadURL(wc.getURL());
            } catch (e) {}
          },
        })
      );

      menu.append(
        new MenuItem({
          label: isTh ? 'พิมพ์...' : 'Print...',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            try {
              wc.print();
            } catch (e) {}
          },
        })
      );

      const curUrl = this.actions.getTabUrl(tabId) || wc.getURL();
      if (curUrl && curUrl.startsWith('http')) {
        menu.append(
          new MenuItem({
            label: isTh ? 'ดูรหัสต้นฉบับของหน้า' : 'View page source',
            accelerator: 'CmdOrCtrl+U',
            click: () => {
              this.actions.createTab(`view-source:${curUrl}`, isIncognito);
            },
          })
        );
      }

      menu.append(new MenuItem({ type: 'separator' }));

      menu.append(
        new MenuItem({
          label: isTh ? '🛠️ ตรวจดูองค์ประกอบ' : '🛠️ Inspect',
          click: () => {
            if (!wc.isDevToolsOpened()) {
              wc.openDevTools({ mode: 'right' });
            }
            wc.inspectElement(params.x, params.y);
          },
        })
      );

      // Popup the context menu
      menu.popup({ window: this.mainWindow });
    });
  }
}
