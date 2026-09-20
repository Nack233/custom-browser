import { BrowserWindow, WebContentsView } from 'electron';
import type { TabInfo, RecentlyClosedItem } from '../types/browser';
import { AdBlockService } from './adblocker';
import { MediaSnifferService } from './mediaSniffer';
import { SettingsManager } from './settingsManager';
import type { DownloadManager } from './downloadManager';

interface ManagedTab {
  id: string;
  view: WebContentsView;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  isIncognito?: boolean;
  isSleeping?: boolean;
  lastActiveAt: number;
}

export const NEW_TAB_URL = 'bocchy://newtab';

export function isNewTabUrl(url?: string): boolean {
  return !url || url === 'bocchy://newtab' || url === 'nexus://newtab' || url === 'about:blank';
}

export class ViewManager {
  private mainWindow: BrowserWindow;
  private tabs: Map<string, ManagedTab> = new Map();
  private activeTabId: string | null = null;
  private adblocker: AdBlockService;
  private mediaSniffer: MediaSnifferService;
  private settingsManager?: SettingsManager;
  private downloadManager?: DownloadManager;
  private topBarHeight = 78; // Height in pixels reserved for React Top Bar & Tabs
  private sidebarWidth = 0; // Dynamic sidebar/drawer width on the right
  private forceDarkMode = false;
  private recentlyClosedTabs: RecentlyClosedItem[] = [];
  private sleepCheckInterval: NodeJS.Timeout | null = null;

  constructor(
    mainWindow: BrowserWindow,
    adblocker: AdBlockService,
    mediaSniffer: MediaSnifferService,
    settingsManager?: SettingsManager,
    downloadManager?: DownloadManager
  ) {
    this.mainWindow = mainWindow;
    this.adblocker = adblocker;
    this.mediaSniffer = mediaSniffer;
    this.settingsManager = settingsManager;
    this.downloadManager = downloadManager;

    this.setupWindowEvents();
    this.startSleepMonitor();
  }

  public setSidebarWidth(width: number) {
    this.sidebarWidth = Math.max(0, width);
    this.updateActiveViewBounds();
  }

  public setTopBarHeight(height: number) {
    this.topBarHeight = Math.max(0, height);
    this.updateActiveViewBounds();
  }

  public toggleForceDarkMode(enabled?: boolean): boolean {
    this.forceDarkMode = enabled !== undefined ? enabled : !this.forceDarkMode;
    for (const tab of this.tabs.values()) {
      if (!tab.isSleeping && tab.view) {
        this.applyForceDark(tab.view.webContents, this.forceDarkMode);
      }
    }
    return this.forceDarkMode;
  }

  public isForceDarkMode(): boolean {
    return this.forceDarkMode;
  }

  private applyForceDark(wc: any, enabled: boolean) {
    if (!wc || wc.isDestroyed()) return;
    const script = `
      (function() {
        const existing = document.getElementById('__bocchy_force_dark__') || document.getElementById('__nexus_force_dark__');
        if (${enabled}) {
          if (!existing) {
            const style = document.createElement('style');
            style.id = '__bocchy_force_dark__';
            style.textContent = \`
              html {
                filter: invert(90%) hue-rotate(180deg) !important;
                background: #121214 !important;
              }
              iframe, img, video, canvas, svg, [style*="background-image"] {
                filter: invert(100%) hue-rotate(180deg) !important;
              }
            \`;
            (document.head || document.documentElement).appendChild(style);
          }
        } else {
          if (existing) existing.remove();
        }
      })()
    `;
    wc.executeJavaScript(script).catch(() => {});
  }

  private setupWindowEvents() {
    this.mainWindow.on('resize', () => {
      this.updateActiveViewBounds();
    });
  }

  private startSleepMonitor() {
    this.sleepCheckInterval = setInterval(() => {
      this.checkTabsForSleep();
    }, 30000); // Checks every 30 seconds
  }

  private checkTabsForSleep() {
    if (!this.settingsManager) return;
    const settings = this.settingsManager.getSettings();
    if (settings.tabSleepEnabled === false) return;

    const timeoutMs = (settings.tabSleepMinutes || 15) * 60 * 1000;
    const now = Date.now();

    for (const tab of this.tabs.values()) {
      if (
        tab.id !== this.activeTabId &&
        !tab.isSleeping &&
        tab.url &&
        !isNewTabUrl(tab.url) &&
        now - tab.lastActiveAt > timeoutMs
      ) {
        console.log(`[TabSleep] Inactive tab ${tab.id} ("${tab.title}") hibernating to save RAM`);
        this.sleepTab(tab.id);
      }
    }
  }

  public sleepTab(tabId: string) {
    const tab = this.tabs.get(tabId);
    if (!tab || tab.isSleeping || tab.id === this.activeTabId) return;

    try {
      if (tab.view) {
        this.mainWindow.contentView.removeChildView(tab.view);
        (tab.view.webContents as any).close?.();
      }
    } catch (e) {}

    tab.view = null as any;
    tab.isSleeping = true;
    this.notifyTabsUpdated();
  }

  private wakeTab(tab: ManagedTab) {
    if (!tab.isSleeping) return;

    let view: WebContentsView;
    if (tab.isIncognito) {
      const partition = `incognito_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      view = new WebContentsView({
        webPreferences: { partition },
      });
      this.adblocker.attachSession(view.webContents.session);
      this.downloadManager?.attachSession(view.webContents.session);
    } else {
      view = new WebContentsView();
    }

    tab.view = view;
    tab.isSleeping = false;
    tab.lastActiveAt = Date.now();
    tab.isLoading = true;
    this.attachViewEvents(tab);

    if (tab.url && !isNewTabUrl(tab.url)) {
      tab.view.webContents.loadURL(tab.url);
    }
  }

  public updateActiveViewBounds() {
    if (!this.activeTabId) return;
    const tab = this.tabs.get(this.activeTabId);
    if (!tab || !tab.view || tab.isSleeping) return;

    // When on the New Tab Speed Dial page, tuck away the native view
    if (isNewTabUrl(tab.url)) {
      tab.view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
      return;
    }

    const [width, height] = this.mainWindow.getContentSize();
    const effectiveWidth = Math.max(200, width - this.sidebarWidth);
    tab.view.setBounds({
      x: 0,
      y: this.topBarHeight,
      width: effectiveWidth,
      height: Math.max(0, height - this.topBarHeight),
    });
  }

  public createTab(initialUrl = NEW_TAB_URL, isIncognito = false): string {
    let view: WebContentsView;
    if (isIncognito) {
      const partition = `incognito_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      view = new WebContentsView({
        webPreferences: {
          partition,
        },
      });
      this.adblocker.attachSession(view.webContents.session);
      this.downloadManager?.attachSession(view.webContents.session);
    } else {
      view = new WebContentsView();
    }

    const id = `tab_${view.webContents.id}`;
    const isNewTab = isNewTabUrl(initialUrl);

    const tab: ManagedTab = {
      id,
      view,
      url: isNewTab ? NEW_TAB_URL : initialUrl,
      title: isNewTab ? (isIncognito ? 'Incognito Tab' : 'New Tab') : 'Loading...',
      isLoading: !isNewTab,
      canGoBack: false,
      canGoForward: false,
      isIncognito,
      isSleeping: false,
      lastActiveAt: Date.now(),
    };

    this.tabs.set(id, tab);
    this.attachViewEvents(tab);

    if (!isNewTab) {
      this.navigate(id, initialUrl);
    }

    // Switch to this new tab
    this.switchTab(id);

    return id;
  }

  public restoreClosedTab(): string | null {
    if (this.recentlyClosedTabs.length === 0) return null;
    const item = this.recentlyClosedTabs.shift()!;
    return this.createTab(item.url, false);
  }

  public getRecentlyClosed(): RecentlyClosedItem[] {
    return [...this.recentlyClosedTabs];
  }

  private canGoBack(wc: any): boolean {
    return Boolean(wc.navigationHistory?.canGoBack ? wc.navigationHistory.canGoBack() : wc.canGoBack?.());
  }

  private canGoForward(wc: any): boolean {
    return Boolean(wc.navigationHistory?.canGoForward ? wc.navigationHistory.canGoForward() : wc.canGoForward?.());
  }

  private attachViewEvents(tab: ManagedTab) {
    const wc = tab.view.webContents;

    wc.on('did-start-loading', () => {
      if (!isNewTabUrl(tab.url)) {
        tab.isLoading = true;
        this.notifyTabsUpdated();
      }
    });

    wc.on('did-stop-loading', () => {
      tab.isLoading = false;
      tab.canGoBack = this.canGoBack(wc);
      tab.canGoForward = this.canGoForward(wc);
      const curUrl = wc.getURL();
      if (curUrl && curUrl !== 'about:blank') {
        tab.url = curUrl;
      }
      this.notifyTabsUpdated();

      // Trigger DOM media scan automatically on page load finish
      if (tab.url && !isNewTabUrl(tab.url)) {
        this.mediaSniffer.extractFromDOM(wc);
      }

      // Apply dark mode if enabled
      if (this.forceDarkMode) {
        this.applyForceDark(wc, true);
      }
    });

    wc.on('page-title-updated', (_event, title) => {
      if (!isNewTabUrl(tab.url)) {
        tab.title = title || 'Untitled';
        this.notifyTabsUpdated();
      }
    });

    wc.on('page-favicon-updated', (_event, favicons) => {
      if (favicons.length > 0 && !isNewTabUrl(tab.url)) {
        tab.favicon = favicons[0];
        this.notifyTabsUpdated();
      }
    });

    wc.on('did-navigate', (_event, url) => {
      if (url && url !== 'about:blank') {
        tab.url = url;
        tab.canGoBack = this.canGoBack(wc);
        tab.canGoForward = this.canGoForward(wc);
        this.updateActiveViewBounds();
        this.notifyTabsUpdated();

        if (this.forceDarkMode) {
          this.applyForceDark(wc, true);
        }
      }
    });

    wc.on('did-navigate-in-page', (_event, url) => {
      if (url && url !== 'about:blank') {
        tab.url = url;
        tab.canGoBack = this.canGoBack(wc);
        tab.canGoForward = this.canGoForward(wc);
        this.notifyTabsUpdated();
      }
    });

    // 1. Block unwanted popup windows/tabs from sites (window.open clickjacking)
    wc.setWindowOpenHandler((details) => {
      console.log(`[Popup Blocked] [${tab.id}] ${details.url}`);
      this.adblocker.recordBlocked(tab.id, details.url);
      this.notifyTabsUpdated();
      return { action: 'deny' };
    });

    // 2. Block unwanted redirects / page changes to gambling or ad domains
    wc.on('will-navigate', (event, targetUrl) => {
      if (this.adblocker.isRedirectAd(targetUrl, tab.url)) {
        console.log(`[Redirect Blocked] [${tab.id}] prevented navigation to: ${targetUrl}`);
        event.preventDefault();
        this.adblocker.recordBlocked(tab.id, targetUrl);
        this.notifyTabsUpdated();
      }
    });

    wc.on('will-redirect', (event, targetUrl) => {
      if (this.adblocker.isRedirectAd(targetUrl, tab.url)) {
        console.log(`[Redirect Blocked] [${tab.id}] prevented redirect to: ${targetUrl}`);
        event.preventDefault();
        this.adblocker.recordBlocked(tab.id, targetUrl);
        this.notifyTabsUpdated();
      }
    });

    // 3. Inject cosmetic styles to hide banner ads and gambling buttons directly on page
    wc.on('did-finish-load', () => {
      if (this.adblocker.isBlockGifAds()) {
        wc.insertCSS(`
          img[src*=".gif"],
          img[src*="728x"],
          img[src*="300x"],
          img[src*="140x"],
          img[src*="160x"],
          [style*=".gif"],
          a[href*="ufa"],
          a[href*="bet"],
          a[href*="slot"],
          a[href*="casino"],
          a[href*="line.me"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            height: 0 !important;
            pointer-events: none !important;
          }
        `).catch(() => {});
      }

      if (this.forceDarkMode) {
        this.applyForceDark(wc, true);
      }
    });
  }

  public switchTab(tabId: string) {
    if (!this.tabs.has(tabId)) return;

    // Remove previous view
    if (this.activeTabId && this.tabs.has(this.activeTabId)) {
      const prevTab = this.tabs.get(this.activeTabId)!;
      try {
        if (prevTab.view) {
          this.mainWindow.contentView.removeChildView(prevTab.view);
        }
      } catch (e) {}
    }

    this.activeTabId = tabId;
    const currentTab = this.tabs.get(tabId)!;

    // Wake up tab if it was sleeping
    if (currentTab.isSleeping) {
      this.wakeTab(currentTab);
    }
    currentTab.lastActiveAt = Date.now();

    // Add active view
    try {
      if (currentTab.view) {
        this.mainWindow.contentView.addChildView(currentTab.view);
        this.updateActiveViewBounds();
      }
    } catch (e) {
      console.error('Failed to attach active view:', e);
    }

    this.notifyTabsUpdated();
  }

  public closeTab(tabId: string) {
    const tab = this.tabs.get(tabId);
    if (!tab) return;

    // Save to recently closed if not incognito and not newtab
    if (!tab.isIncognito && tab.url && !isNewTabUrl(tab.url)) {
      this.recentlyClosedTabs.unshift({
        id: `closed_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: tab.title || tab.url,
        url: tab.url,
        favicon: tab.favicon,
        closedAt: Date.now(),
      });
      if (this.recentlyClosedTabs.length > 25) {
        this.recentlyClosedTabs.pop();
      }
    }

    // Remove view from window
    try {
      if (tab.view) {
        this.mainWindow.contentView.removeChildView(tab.view);
        (tab.view.webContents as any).close?.();
      }
    } catch (e) {}

    this.tabs.delete(tabId);
    this.mediaSniffer.clearTab(tabId);

    // If closing active tab, switch to adjacent tab
    if (this.activeTabId === tabId) {
      const remainingIds = Array.from(this.tabs.keys());
      if (remainingIds.length > 0) {
        this.switchTab(remainingIds[remainingIds.length - 1]);
      } else {
        this.createTab(NEW_TAB_URL);
      }
    } else {
      this.notifyTabsUpdated();
    }
  }

  public navigate(tabId: string, inputUrl: string) {
    const tab = this.tabs.get(tabId);
    if (!tab) return;

    if (tab.isSleeping) {
      this.wakeTab(tab);
    }

    let targetUrl = inputUrl.trim();
    if (isNewTabUrl(targetUrl)) {
      tab.url = NEW_TAB_URL;
      if (isNewTabUrl(tab.url)) {
        tab.title = tab.isIncognito ? 'Incognito Tab' : 'New Tab';
      }
      tab.isLoading = false;
      this.updateActiveViewBounds();
      this.notifyTabsUpdated();
      return;
    }

    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      if (targetUrl.includes('.') && !targetUrl.includes(' ')) {
        targetUrl = 'https://' + targetUrl;
      } else {
        // Search query
        targetUrl = `https://duckduckgo.com/?q=${encodeURIComponent(targetUrl)}`;
      }
    }

    tab.url = targetUrl;
    tab.isLoading = true;
    tab.lastActiveAt = Date.now();
    this.updateActiveViewBounds();
    this.notifyTabsUpdated();
    if (tab.view) {
      tab.view.webContents.loadURL(targetUrl);
    }
  }

  public goBack(tabId: string) {
    const tab = this.tabs.get(tabId);
    if (tab && !tab.isSleeping && tab.view && this.canGoBack(tab.view.webContents)) {
      const wc: any = tab.view.webContents;
      if (wc.navigationHistory?.goBack) wc.navigationHistory.goBack();
      else if (wc.goBack) wc.goBack();
    }
  }

  public goForward(tabId: string) {
    const tab = this.tabs.get(tabId);
    if (tab && !tab.isSleeping && tab.view && this.canGoForward(tab.view.webContents)) {
      const wc: any = tab.view.webContents;
      if (wc.navigationHistory?.goForward) wc.navigationHistory.goForward();
      else if (wc.goForward) wc.goForward();
    }
  }

  public reload(tabId: string) {
    const tab = this.tabs.get(tabId);
    if (tab) {
      if (tab.isSleeping) {
        this.wakeTab(tab);
        return;
      }
      if (isNewTabUrl(tab.url)) {
        this.notifyTabsUpdated();
      } else if (tab.view) {
        tab.view.webContents.reload();
      }
    }
  }

  public getActiveTabId(): string | null {
    return this.activeTabId;
  }

  public getActiveTab(): ManagedTab | undefined {
    return this.activeTabId ? this.tabs.get(this.activeTabId) : undefined;
  }

  public getTab(tabId: string): ManagedTab | undefined {
    return this.tabs.get(tabId);
  }

  public notifyTabsUpdated() {
    if (this.mainWindow.isDestroyed()) return;

    const tabList: TabInfo[] = Array.from(this.tabs.values()).map((t) => ({
      id: t.id,
      title: t.title,
      url: t.url,
      favicon: t.favicon,
      isLoading: t.isLoading,
      canGoBack: t.canGoBack,
      canGoForward: t.canGoForward,
      isIncognito: t.isIncognito,
      isSleeping: t.isSleeping,
      lastActiveAt: t.lastActiveAt,
      adBlockStats: this.adblocker.getStats(t.id),
    }));

    this.mainWindow.webContents.send('tabs:updated', tabList, this.activeTabId || '');
  }
}
