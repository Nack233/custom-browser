import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import { AdBlockService } from './adblocker';
import { MediaSnifferService } from './mediaSniffer';
import { ViewManager } from './viewManager';
import { SettingsManager } from './settingsManager';
import { DownloadManager } from './downloadManager';
import { LocaleManager } from './localeManager';
import { session } from 'electron';

let mainWindow: BrowserWindow | null = null;
let viewManager: ViewManager | null = null;
let adblocker: AdBlockService | null = null;
let mediaSniffer: MediaSnifferService | null = null;
let settingsManager: SettingsManager | null = null;
let downloadManager: DownloadManager | null = null;
let localeManager: LocaleManager | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Ignore certificate errors so local dev, corporate proxies, or antivirus SSL inspection don't cause blank white pages
app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('allow-insecure-localhost', 'true');
async function createWindow() {
  const iconPath = path.join(app.getAppPath(), 'bocchy.ico');
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 800,
    minHeight: 600,
    title: 'Bocchy',
    icon: iconPath,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#150d1b',
      symbolColor: '#f472b6',
      height: 38,
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#0f0914',
  });

  // Services
  downloadManager = new DownloadManager();
  downloadManager.setMainWindow(mainWindow);
  downloadManager.attachSession(session.defaultSession);

  adblocker = new AdBlockService();
  mediaSniffer = new MediaSnifferService(downloadManager);
  viewManager = new ViewManager(
    mainWindow,
    adblocker,
    mediaSniffer,
    settingsManager || undefined,
    downloadManager,
    localeManager || undefined
  );
  mediaSniffer.setActiveTabProvider(() => viewManager?.getActiveTabId() || null);

  // Wire up listeners to notify React UI
  adblocker.setOnBlockedCallback((tabId, url, total) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('adblock:blocked', tabId, url, total);
      viewManager?.notifyTabsUpdated();
    }
  });

  mediaSniffer.setOnMediaFoundCallback((tabId, item) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('media:found', tabId, item);
    }
  });

  // Load React Frontend
  if (isDev) {
    await mainWindow.loadURL('http://localhost:5173');
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../dist-renderer/index.html'));
  }

  // Restore saved dark mode if enabled
  if (settingsManager?.getSettings().forceDarkMode) {
    viewManager.toggleForceDarkMode(true);
  }

  // Create initial tab (Bocchy New Tab)
  viewManager.createTab('bocchy://newtab');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
function setupIpc() {
  ipcMain.handle('tab:create', (_event, url) => {
    return viewManager?.createTab(url || 'bocchy://newtab', false);
  });

  ipcMain.handle('tab:create-incognito', (_event, url) => {
    return viewManager?.createTab(url || 'bocchy://newtab', true);
  });

  ipcMain.handle('tab:close', (_event, tabId) => {
    viewManager?.closeTab(tabId);
  });

  ipcMain.handle('tab:switch', (_event, tabId) => {
    viewManager?.switchTab(tabId);
  });

  ipcMain.handle('tab:restore-closed', () => {
    return viewManager?.restoreClosedTab();
  });

  ipcMain.handle('tab:get-recently-closed', () => {
    return viewManager?.getRecentlyClosed() || [];
  });

  ipcMain.handle('nav:navigate', (_event, tabId, url) => {
    viewManager?.navigate(tabId, url);
  });

  ipcMain.handle('nav:back', (_event, tabId) => {
    viewManager?.goBack(tabId);
  });

  ipcMain.handle('nav:forward', (_event, tabId) => {
    viewManager?.goForward(tabId);
  });

  ipcMain.handle('nav:reload', (_event, tabId) => {
    viewManager?.reload(tabId);
  });

  ipcMain.handle('adblock:toggle', (_event, tabId) => {
    const res = adblocker?.toggleTab(tabId) ?? true;
    viewManager?.notifyTabsUpdated();
    return res;
  });

  ipcMain.handle('adblock:toggle-gif', () => {
    const res = adblocker?.toggleBlockGifAds() ?? true;
    viewManager?.notifyTabsUpdated();
    return res;
  });

  ipcMain.handle('adblock:toggle-redirects', () => {
    const res = adblocker?.toggleBlockRedirects() ?? true;
    viewManager?.notifyTabsUpdated();
    return res;
  });

  ipcMain.handle('media:extract-dom', async (_event, tabId) => {
    const tab = viewManager?.getTab(tabId);
    if (!tab) return [];
    return mediaSniffer?.extractFromDOM(tab.view.webContents) || [];
  });

  ipcMain.handle('media:pick-section', async (_event, tabId) => {
    const tab = viewManager?.getTab(tabId);
    if (!tab) return [];
    return mediaSniffer?.pickSectionFromDOM(tab.view.webContents) || [];
  });

  ipcMain.handle('media:download', async (_event, url, filename) => {
    return mediaSniffer?.downloadFile(url, filename) || { success: false };
  });

  ipcMain.handle('sidebar:set-width', (_event, width: number) => {
    viewManager?.setSidebarWidth(width);
  });

  ipcMain.handle('layout:set-top-bar-height', (_event, height: number) => {
    viewManager?.setTopBarHeight(height);
  });

  ipcMain.handle('dark-mode:toggle', (_event, enabled?: boolean) => {
    const res = viewManager?.toggleForceDarkMode(enabled) ?? false;
    settingsManager?.updateSettings({ forceDarkMode: res });
    return res;
  });

  ipcMain.handle('bookmarks:get', () => {
    return settingsManager?.getBookmarks() || [];
  });

  ipcMain.handle('bookmarks:add', (_event, item) => {
    return settingsManager?.addBookmark(item);
  });

  ipcMain.handle('bookmarks:remove', (_event, idOrUrl) => {
    return settingsManager?.removeBookmark(idOrUrl) ?? false;
  });

  ipcMain.handle('shortcuts:get', () => {
    return settingsManager?.getShortcuts() || [];
  });

  ipcMain.handle('shortcuts:add', (_event, item) => {
    return settingsManager?.addShortcut(item);
  });

  ipcMain.handle('shortcuts:remove', (_event, id) => {
    return settingsManager?.removeShortcut(id) ?? false;
  });

  ipcMain.handle('settings:get', () => {
    return settingsManager?.getSettings();
  });

  ipcMain.handle('settings:update', async (_event, partial) => {
    const res = settingsManager?.updateSettings(partial);
    if (partial.language && localeManager) {
      await localeManager.setLanguage(partial.language);
      await viewManager?.applyLanguage(partial.language);
    }
    return res;
  });

  ipcMain.handle('app:relaunch', () => {
    app.relaunch();
    app.exit(0);
  });

  ipcMain.handle('tab:sleep', (_event, tabId) => {
    viewManager?.sleepTab(tabId);
  });

  ipcMain.handle('media:download-zip', async (_event, items, zipName) => {
    return (
      (await mediaSniffer?.downloadZip(items, zipName, (current, total, percent, status) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('media:zip-progress', { current, total, percent, status });
        }
      })) || { success: false, error: 'Service unavailable' }
    );
  });

  ipcMain.handle('shell:show-item', (_event, fullPath) => {
    if (fullPath) {
      shell.showItemInFolder(fullPath);
    }
  });

  // Download Manager IPC Handlers
  ipcMain.handle('downloads:get', () => {
    return downloadManager?.getDownloads() || [];
  });

  ipcMain.handle('downloads:cancel', (_event, id: string) => {
    return downloadManager?.cancelDownload(id) ?? false;
  });

  ipcMain.handle('downloads:clear', () => {
    downloadManager?.clearHistory();
  });

  ipcMain.handle('downloads:open-file', async (_event, filePath: string) => {
    return (await downloadManager?.openFile(filePath)) ?? false;
  });

  ipcMain.handle('downloads:open-folder', async () => {
    await downloadManager?.openDownloadsFolder();
  });

  // Per-Tab Audio & Volume Control
  ipcMain.handle('tab:set-volume', (_event, tabId: string, volume: number) => {
    viewManager?.setTabVolume(tabId, volume);
  });

  ipcMain.handle('tab:toggle-mute', (_event, tabId: string) => {
    return viewManager?.toggleTabMute(tabId) ?? false;
  });

  // Page Zoom Controls
  ipcMain.handle('tab:set-zoom', (_event, tabId: string, zoomFactor: number) => {
    return viewManager?.setTabZoom(tabId, zoomFactor) ?? 1.0;
  });

  ipcMain.handle('tab:zoom-in', (_event, tabId: string) => {
    return viewManager?.zoomIn(tabId) ?? 1.0;
  });

  ipcMain.handle('tab:zoom-out', (_event, tabId: string) => {
    return viewManager?.zoomOut(tabId) ?? 1.0;
  });

  ipcMain.handle('tab:reset-zoom', (_event, tabId: string) => {
    return viewManager?.resetZoom(tabId) ?? 1.0;
  });

  // Developer Mode & DevTools
  ipcMain.handle('dev:toggle-devtools', (_event, tabId?: string) => {
    viewManager?.toggleDevTools(tabId);
  });

  ipcMain.handle('dev:toggle-app-devtools', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
      } else {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
      }
    }
  });
}

app.on('certificate-error', (event, _webContents, _url, _error, _certificate, callback) => {
  event.preventDefault();
  callback(true);
});

// Early configuration: Hardware Acceleration MUST be disabled before app is ready
settingsManager = new SettingsManager();
const savedLang = settingsManager.getSettings().language || 'th';
app.commandLine.appendSwitch('lang', savedLang === 'th' ? 'th-TH' : 'en-US');
localeManager = new LocaleManager(savedLang);

if (settingsManager.getSettings().hardwareAcceleration === false) {
  app.disableHardwareAcceleration();
  console.log('[GPU] Hardware Acceleration is disabled (Discord Netflix stream capture mode)');
} else {
  console.log('[GPU] Hardware Acceleration is enabled (GPU rendering)');
}

app.whenReady().then(async () => {
  settingsManager.applyDns();
  if (localeManager) {
    await localeManager.applyToSession(session.defaultSession);
  }

  setupIpc();
  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
