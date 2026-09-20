export interface BlockedItem {
  url: string;
  domain: string;
  timestamp: number;
}

export interface TabInfo {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  isIncognito?: boolean;
  isSleeping?: boolean;
  lastActiveAt?: number;
  adBlockStats: {
    blockedCount: number;
    enabled: boolean;
    blockGifAds: boolean;
    blockRedirects: boolean;
    recentBlocked?: BlockedItem[];
  };
}

export interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  createdAt: number;
}

export interface ShortcutItem {
  id: string;
  title: string;
  url: string;
  icon?: string;
  color?: string;
}

export interface RecentlyClosedItem {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  closedAt: number;
}

export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video' | 'stream';
  mimeType?: string;
  size?: number; // in bytes if known
  width?: number;
  height?: number;
  alt?: string;
}

export interface DownloadItemInfo {
  id: string;
  filename: string;
  url: string;
  state: 'progressing' | 'completed' | 'cancelled' | 'interrupted';
  receivedBytes: number;
  totalBytes: number;
  speed?: number; // bytes per second
  savePath?: string;
  startTime: number;
  mimeType?: string;
  isZip?: boolean;
}

export interface AppSettings {
  language: 'th' | 'en';
  dnsProvider: 'cloudflare' | 'google' | 'adguard' | 'quad9' | 'system' | 'custom';
  customDnsUrl?: string;
  forceDarkMode?: boolean;
  showBookmarksBar?: boolean;
  hardwareAcceleration?: boolean;
  tabSleepEnabled?: boolean;
  tabSleepMinutes?: number;
  bookmarks?: BookmarkItem[];
  shortcuts?: ShortcutItem[];
}

export interface BrowserApi {
  // Navigation & Tabs
  createTab: (url?: string) => Promise<string>;
  createIncognitoTab: (url?: string) => Promise<string>;
  closeTab: (tabId: string) => Promise<void>;
  switchTab: (tabId: string) => Promise<void>;
  sleepTab: (tabId: string) => Promise<void>;
  navigate: (tabId: string, url: string) => Promise<void>;
  goBack: (tabId: string) => Promise<void>;
  goForward: (tabId: string) => Promise<void>;
  reload: (tabId: string) => Promise<void>;

  // Restore Closed Tabs
  restoreClosedTab: () => Promise<string | null>;
  getRecentlyClosed: () => Promise<RecentlyClosedItem[]>;

  // Layout Bounds
  setSidebarWidth: (width: number) => Promise<void>;
  setTopBarHeight: (height: number) => Promise<void>;

  // Adblocker
  toggleAdBlocker: (tabId: string) => Promise<boolean>;
  toggleBlockGifAds: () => Promise<boolean>;
  toggleBlockRedirects: () => Promise<boolean>;

  // Force Dark Mode
  toggleForceDarkMode: (enabled?: boolean) => Promise<boolean>;

  // App Lifecycle & Shell
  relaunchApp: () => Promise<void>;
  showItemInFolder: (filePath: string) => Promise<void>;

  // Bookmarks & Shortcuts
  getBookmarks: () => Promise<BookmarkItem[]>;
  addBookmark: (item: { title: string; url: string; favicon?: string }) => Promise<BookmarkItem>;
  removeBookmark: (idOrUrl: string) => Promise<boolean>;
  getShortcuts: () => Promise<ShortcutItem[]>;
  addShortcut: (item: { title: string; url: string; icon?: string; color?: string }) => Promise<ShortcutItem>;
  removeShortcut: (id: string) => Promise<boolean>;

  // Settings & DNS
  getSettings: () => Promise<AppSettings>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<AppSettings>;

  // Media Extraction & ZIP Packager
  extractDomMedia: (tabId: string) => Promise<MediaItem[]>;
  pickSectionMedia: (tabId: string) => Promise<MediaItem[]>;
  downloadMedia: (url: string, filename?: string) => Promise<{ success: boolean; path?: string }>;
  downloadZip: (items: MediaItem[], zipName?: string) => Promise<{ success: boolean; path?: string; sizeBytes?: number; error?: string }>;

  // Downloads Management
  getDownloads: () => Promise<DownloadItemInfo[]>;
  cancelDownload: (id: string) => Promise<boolean>;
  clearDownloadsHistory: () => Promise<void>;
  openDownloadFile: (filePath: string) => Promise<boolean>;
  openDownloadsFolder: () => Promise<void>;

  // Event Listeners
  onTabsUpdated: (callback: (tabs: TabInfo[], activeTabId: string) => void) => () => void;
  onMediaFound: (callback: (tabId: string, item: MediaItem) => void) => () => void;
  onAdBlocked: (callback: (tabId: string, url: string, totalBlocked: number) => void) => () => void;
  onZipProgress: (callback: (data: { current: number; total: number; percent: number; status: string }) => void) => () => void;
  onDownloadProgress: (callback: (item: DownloadItemInfo) => void) => () => void;
  onDownloadComplete: (callback: (item: DownloadItemInfo) => void) => () => void;
}

declare global {
  interface Window {
    browserApi: BrowserApi;
  }
}
