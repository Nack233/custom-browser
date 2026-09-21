import { contextBridge, ipcRenderer } from 'electron';
import type { BrowserApi, TabInfo, MediaItem } from '../types/browser';

const api: BrowserApi = {
  createTab: (url?: string) => ipcRenderer.invoke('tab:create', url),
  createIncognitoTab: (url?: string) => ipcRenderer.invoke('tab:create-incognito', url),
  closeTab: (tabId: string) => ipcRenderer.invoke('tab:close', tabId),
  switchTab: (tabId: string) => ipcRenderer.invoke('tab:switch', tabId),
  openSettingsTab: () => ipcRenderer.invoke('tab:open-settings'),
  navigate: (tabId: string, url: string) => ipcRenderer.invoke('nav:navigate', tabId, url),
  goBack: (tabId: string) => ipcRenderer.invoke('nav:back', tabId),
  goForward: (tabId: string) => ipcRenderer.invoke('nav:forward', tabId),
  reload: (tabId: string) => ipcRenderer.invoke('nav:reload', tabId),

  restoreClosedTab: () => ipcRenderer.invoke('tab:restore-closed'),
  getRecentlyClosed: () => ipcRenderer.invoke('tab:get-recently-closed'),

  setSidebarWidth: (width: number) => ipcRenderer.invoke('sidebar:set-width', width),
  setTopBarHeight: (height: number) => ipcRenderer.invoke('layout:set-top-bar-height', height),

  toggleAdBlocker: (tabId: string) => ipcRenderer.invoke('adblock:toggle', tabId),
  toggleBlockGifAds: () => ipcRenderer.invoke('adblock:toggle-gif'),
  toggleBlockRedirects: () => ipcRenderer.invoke('adblock:toggle-redirects'),

  toggleForceDarkMode: (enabled?: boolean) => ipcRenderer.invoke('dark-mode:toggle', enabled),

  getBookmarks: () => ipcRenderer.invoke('bookmarks:get'),
  addBookmark: (item: any) => ipcRenderer.invoke('bookmarks:add', item),
  removeBookmark: (idOrUrl: string) => ipcRenderer.invoke('bookmarks:remove', idOrUrl),
  getShortcuts: () => ipcRenderer.invoke('shortcuts:get'),
  addShortcut: (item: any) => ipcRenderer.invoke('shortcuts:add', item),
  removeShortcut: (id: string) => ipcRenderer.invoke('shortcuts:remove', id),

  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (partial: any) => ipcRenderer.invoke('settings:update', partial),
  relaunchApp: () => ipcRenderer.invoke('app:relaunch'),

  sleepTab: (tabId: string) => ipcRenderer.invoke('tab:sleep', tabId),
  showItemInFolder: (filePath: string) => ipcRenderer.invoke('shell:show-item', filePath),

  extractDomMedia: (tabId: string) => ipcRenderer.invoke('media:extract-dom', tabId),
  pickSectionMedia: (tabId: string) => ipcRenderer.invoke('media:pick-section', tabId),
  downloadMedia: (url: string, filename?: string) => ipcRenderer.invoke('media:download', url, filename),
  downloadZip: (items: any[], zipName?: string) => ipcRenderer.invoke('media:download-zip', items, zipName),

  // Downloads Management
  getDownloads: () => ipcRenderer.invoke('downloads:get'),
  cancelDownload: (id: string) => ipcRenderer.invoke('downloads:cancel', id),
  clearDownloadsHistory: () => ipcRenderer.invoke('downloads:clear'),
  openDownloadFile: (filePath: string) => ipcRenderer.invoke('downloads:open-file', filePath),
  openDownloadsFolder: () => ipcRenderer.invoke('downloads:open-folder'),
  toggleDownloadsFlyout: (topOffset?: number) => ipcRenderer.invoke('flyout:toggle', 'downloads', topOffset),
  closeDownloadsFlyout: () => ipcRenderer.invoke('flyout:close'),

  // Universal Floating Flyouts
  toggleFlyout: (type: 'downloads' | 'shield' | 'media-extractor' | 'media-control', topOffset?: number) =>
    ipcRenderer.invoke('flyout:toggle', type, topOffset),
  closeFlyout: () => ipcRenderer.invoke('flyout:close'),
  getCurrentTabs: () => ipcRenderer.invoke('tabs:get-current'),
  getMediaForTab: (tabId: string) => ipcRenderer.invoke('media:get-for-tab', tabId),

  // Per-Tab Audio & Volume Control
  setTabVolume: (tabId: string, volume: number) => ipcRenderer.invoke('tab:set-volume', tabId, volume),
  toggleTabMute: (tabId: string) => ipcRenderer.invoke('tab:toggle-mute', tabId),
  toggleMediaPlayback: (tabId: string) => ipcRenderer.invoke('tab:toggle-media-playback', tabId),
  muteAllAudio: () => ipcRenderer.invoke('media:mute-all'),
  unmuteAllAudio: () => ipcRenderer.invoke('media:unmute-all'),
  pauseAllMedia: () => ipcRenderer.invoke('media:pause-all'),

  // Page Zoom Controls
  setTabZoom: (tabId: string, zoomFactor: number) => ipcRenderer.invoke('tab:set-zoom', tabId, zoomFactor),
  zoomIn: (tabId: string) => ipcRenderer.invoke('tab:zoom-in', tabId),
  zoomOut: (tabId: string) => ipcRenderer.invoke('tab:zoom-out', tabId),
  resetZoom: (tabId: string) => ipcRenderer.invoke('tab:reset-zoom', tabId),

  // Developer Mode
  toggleDevTools: (tabId?: string) => ipcRenderer.invoke('dev:toggle-devtools', tabId),
  toggleAppDevTools: () => ipcRenderer.invoke('dev:toggle-app-devtools'),

  // Window State
  resetWindowSize: () => ipcRenderer.invoke('window:reset-size'),

  onTabsUpdated: (callback: (tabs: TabInfo[], activeTabId: string) => void) => {
    const handler = (_event: any, tabs: TabInfo[], activeTabId: string) => callback(tabs, activeTabId);
    ipcRenderer.on('tabs:updated', handler);
    return () => {
      ipcRenderer.removeListener('tabs:updated', handler);
    };
  },

  onMediaFound: (callback: (tabId: string, item: MediaItem) => void) => {
    const handler = (_event: any, tabId: string, item: MediaItem) => callback(tabId, item);
    ipcRenderer.on('media:found', handler);
    return () => {
      ipcRenderer.removeListener('media:found', handler);
    };
  },

  onAdBlocked: (callback: (tabId: string, url: string, totalBlocked: number) => void) => {
    const handler = (_event: any, tabId: string, url: string, totalBlocked: number) =>
      callback(tabId, url, totalBlocked);
    ipcRenderer.on('adblock:blocked', handler);
    return () => {
      ipcRenderer.removeListener('adblock:blocked', handler);
    };
  },

  onZipProgress: (callback: (data: { current: number; total: number; percent: number; status: string }) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('media:zip-progress', handler);
    return () => {
      ipcRenderer.removeListener('media:zip-progress', handler);
    };
  },

  onDownloadProgress: (callback: (item: any) => void) => {
    const handler = (_event: any, item: any) => callback(item);
    ipcRenderer.on('download:progress', handler);
    return () => {
      ipcRenderer.removeListener('download:progress', handler);
    };
  },

  onDownloadComplete: (callback: (item: any) => void) => {
    const handler = (_event: any, item: any) => callback(item);
    ipcRenderer.on('download:complete', handler);
    return () => {
      ipcRenderer.removeListener('download:complete', handler);
    };
  },

  onDownloadsFlyoutStateChanged: (callback: (isOpen: boolean) => void) => {
    const handler = (_event: any, isOpen: boolean) => callback(isOpen);
    ipcRenderer.on('downloads:flyout-state-changed', handler);
    return () => {
      ipcRenderer.removeListener('downloads:flyout-state-changed', handler);
    };
  },

  onFlyoutStateChanged: (callback: (type: string | null, isOpen: boolean) => void) => {
    const handler = (_event: any, type: string | null, isOpen: boolean) => callback(type, isOpen);
    ipcRenderer.on('flyout:state-changed', handler);
    return () => {
      ipcRenderer.removeListener('flyout:state-changed', handler);
    };
  },

  onFlyoutModeChanged: (callback: (type: 'downloads' | 'shield' | 'media-extractor' | 'media-control') => void) => {
    const handler = (_event: any, type: 'downloads' | 'shield' | 'media-extractor' | 'media-control') => callback(type);
    ipcRenderer.on('flyout:set-mode', handler);
    return () => {
      ipcRenderer.removeListener('flyout:set-mode', handler);
    };
  },

  onHtmlFullScreenChange: (callback: (isFullScreen: boolean) => void) => {
    const handler = (_event: any, isFs: boolean) => callback(isFs);
    ipcRenderer.on('html-fullscreen:change', handler);
    return () => {
      ipcRenderer.removeListener('html-fullscreen:change', handler);
    };
  },
};

contextBridge.exposeInMainWorld('browserApi', api);
