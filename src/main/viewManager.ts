import { BrowserWindow, WebContentsView } from 'electron';
import type { TabInfo, RecentlyClosedItem } from '../types/browser';
import { AdBlockService } from './adblocker';
import { MediaSnifferService } from './mediaSniffer';
import { SettingsManager } from './settingsManager';
import type { DownloadManager } from './downloadManager';
import type { LocaleManager } from './localeManager';
import { ContextMenuManager } from './contextMenu';

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
  isPlayingAudio: boolean;
  isMuted: boolean;
  volume: number;
  zoomFactor: number;
}

export const NEW_TAB_URL = 'bocchy://newtab';
export const SETTINGS_URL = 'bocchy://settings';

export function isSettingsUrl(url?: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase().trim();
  return (
    lower === 'bocchy://settings' ||
    lower === 'nexus://settings' ||
    lower === 'about:settings' ||
    lower === 'chrome://settings' ||
    lower === 'edge://settings'
  );
}

export function isNewTabUrl(url?: string): boolean {
  if (!url) return true;
  const lower = url.toLowerCase().trim();
  return lower === 'bocchy://newtab' || lower === 'nexus://newtab' || lower === 'about:blank';
}

export function isInternalPageUrl(url?: string): boolean {
  return isNewTabUrl(url) || isSettingsUrl(url);
}

export class ViewManager {
  private mainWindow: BrowserWindow;
  private tabs: Map<string, ManagedTab> = new Map();
  private activeTabId: string | null = null;
  private adblocker: AdBlockService;
  private mediaSniffer: MediaSnifferService;
  private settingsManager?: SettingsManager;
  private downloadManager?: DownloadManager;
  private topBarHeight = 92; // Height in pixels reserved for React Top Bar & Tabs (44px TabBar + 48px Nav)
  private sidebarWidth = 0; // Dynamic sidebar/drawer width on the right
  private forceDarkMode = false;
  private recentlyClosedTabs: RecentlyClosedItem[] = [];
  private sleepCheckInterval: NodeJS.Timeout | null = null;
  private localeManager?: LocaleManager;
  private currentLanguage: 'th' | 'en' = 'th';
  private contextMenuManager: ContextMenuManager;
  // PERF: Debounce timer for notifyTabsUpdated to prevent IPC flood
  private notifyDebounceTimer: NodeJS.Timeout | null = null;
  // Fullscreen state
  private isHtmlFullScreen: boolean = false;
  private wasWindowFullScreenBeforeHtml: boolean = false;

  constructor(
    mainWindow: BrowserWindow,
    adblocker: AdBlockService,
    mediaSniffer: MediaSnifferService,
    settingsManager?: SettingsManager,
    downloadManager?: DownloadManager,
    localeManager?: LocaleManager
  ) {
    this.mainWindow = mainWindow;
    this.adblocker = adblocker;
    this.mediaSniffer = mediaSniffer;
    this.settingsManager = settingsManager;
    this.downloadManager = downloadManager;
    this.localeManager = localeManager;
    this.currentLanguage = settingsManager?.getSettings().language || 'th';

    this.contextMenuManager = new ContextMenuManager(
      this.mainWindow,
      {
        createTab: (url, incognito) => this.createTab(url, incognito),
        goBack: (tabId) => this.goBack(tabId),
        goForward: (tabId) => this.goForward(tabId),
        reload: (tabId) => this.reload(tabId),
        canGoBack: (tabId) => {
          const tab = this.tabs.get(tabId);
          return tab ? tab.canGoBack : false;
        },
        canGoForward: (tabId) => {
          const tab = this.tabs.get(tabId);
          return tab ? tab.canGoForward : false;
        },
        getTabUrl: (tabId) => {
          const tab = this.tabs.get(tabId);
          return tab ? tab.url : '';
        },
      },
      this.currentLanguage
    );

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

    this.mainWindow.on('enter-full-screen', () => {
      this.updateActiveViewBounds();
    });

    this.mainWindow.on('leave-full-screen', () => {
      if (this.isHtmlFullScreen) {
        const tab = this.activeTabId ? this.tabs.get(this.activeTabId) : null;
        if (tab?.view && !tab.view.webContents.isDestroyed()) {
          tab.view.webContents.executeJavaScript('document.exitFullscreen().catch(function() {})');
        }
      }
      this.updateActiveViewBounds();
    });

    this.mainWindow.on('app-command', (event, cmd) => {
      if (cmd === 'browser-backward' && this.activeTabId) {
        event.preventDefault();
        this.goBack(this.activeTabId);
      } else if (cmd === 'browser-forward' && this.activeTabId) {
        event.preventDefault();
        this.goForward(this.activeTabId);
      }
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
      if (this.localeManager) {
        this.localeManager.applyToSession(view.webContents.session, this.currentLanguage);
      }
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

    // When on an internal page (New Tab, Settings), tuck away the native view
    if (isInternalPageUrl(tab.url)) {
      tab.view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
      return;
    }

    const [width, height] = this.mainWindow.getContentSize();

    // If currently in HTML fullscreen, expand to fill 100% of window (0, 0, width, height)
    if (this.isHtmlFullScreen) {
      tab.view.setBounds({
        x: 0,
        y: 0,
        width,
        height,
      });
      return;
    }

    const effectiveWidth = Math.max(200, width - this.sidebarWidth);
    tab.view.setBounds({
      x: 0,
      y: this.topBarHeight,
      width: effectiveWidth,
      height: Math.max(0, height - this.topBarHeight),
    });
  }

  public createTab(initialUrl = NEW_TAB_URL, isIncognito = false, switchImmediately = true): string {
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
      if (this.localeManager) {
        this.localeManager.applyToSession(view.webContents.session, this.currentLanguage);
      }
    } else {
      view = new WebContentsView();
    }

    const id = `tab_${view.webContents.id}`;
    const isSettings = isSettingsUrl(initialUrl);
    const isNewTab = isNewTabUrl(initialUrl);

    const tab: ManagedTab = {
      id,
      view,
      url: isSettings ? SETTINGS_URL : isNewTab ? NEW_TAB_URL : initialUrl,
      title: isSettings
        ? (this.currentLanguage === 'th' ? 'การตั้งค่า' : 'Settings')
        : isNewTab
        ? (isIncognito ? 'Incognito Tab' : 'New Tab')
        : 'Loading...',
      isLoading: !isNewTab && !isSettings,
      canGoBack: false,
      canGoForward: false,
      isIncognito,
      isSleeping: false,
      lastActiveAt: Date.now(),
      isPlayingAudio: false,
      isMuted: false,
      volume: 100,
      zoomFactor: 1.0,
    };

    this.tabs.set(id, tab);
    this.attachViewEvents(tab);

    if (!isNewTab && !isSettings) {
      this.navigate(id, initialUrl);
    }

    // Switch to this new tab or notify
    if (switchImmediately) {
      this.switchTab(id);
    } else {
      this.notifyTabsUpdatedImmediate();
    }

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

    wc.on('media-started-playing', () => {
      tab.isPlayingAudio = true;
      this.notifyTabsUpdated();
    });

    wc.on('media-paused', () => {
      tab.isPlayingAudio = false;
      this.notifyTabsUpdated();
    });

    wc.on('enter-html-full-screen', () => {
      this.handleEnterHtmlFullScreen(tab);
    });

    wc.on('leave-html-full-screen', () => {
      this.handleLeaveHtmlFullScreen(tab);
    });

    wc.on('before-input-event', (event, input) => {
      if (input.type === 'keyDown') {
        if (input.key === 'F11') {
          event.preventDefault();
          this.toggleFullScreen();
        } else if (input.key === 'Escape' && this.isHtmlFullScreen) {
          event.preventDefault();
          wc.executeJavaScript('document.exitFullscreen().catch(function() {})');
        } else if (input.key === 'F12' || (input.control && input.shift && (input.key === 'I' || input.key === 'i'))) {
          event.preventDefault();
          this.toggleDevTools(tab.id);
        } else if (input.control && (input.key === '=' || input.key === '+')) {
          event.preventDefault();
          this.zoomIn(tab.id);
        } else if (input.control && input.key === '-') {
          event.preventDefault();
          this.zoomOut(tab.id);
        } else if (input.control && input.key === '0') {
          event.preventDefault();
          this.resetZoom(tab.id);
        }
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

      // PERF: DOM media extraction is now on-demand only (when user opens Media Drawer)
      // This avoids heavy DOM scanning on every page load

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

    // 1. Handle window.open, middle-click links, and target="_blank"
    wc.setWindowOpenHandler((details) => {
      // Check if this URL is a redirect/pop-under ad
      if (this.adblocker.isRedirectAd(details.url, tab.url)) {
        console.log(`[Popup Blocked] [${tab.id}] ${details.url}`);
        this.adblocker.recordBlocked(tab.id, details.url);
        this.notifyTabsUpdated();
        return { action: 'deny' };
      }

      // If legitimate link, open as a Bocchy tab!
      if (details.url && details.url !== 'about:blank') {
        const isBackground = details.disposition === 'background-tab';
        console.log(`[Open New Tab from Link] [${tab.id}] disposition=${details.disposition} url=${details.url}`);
        this.createTab(details.url, tab.isIncognito, !isBackground);
      }
      return { action: 'deny' };
    });

    // 2. Attach Rich Context Menu (Right Click)
    this.contextMenuManager.attachToWebContents(wc, tab.id, tab.isIncognito);

    // 3. Side mouse buttons (Mouse 4 = Back, Mouse 5 = Forward)
    (wc as any).on('app-command', (event: any, cmd: any) => {
      if (cmd === 'browser-backward') {
        event.preventDefault();
        this.goBack(tab.id);
      } else if (cmd === 'browser-forward') {
        event.preventDefault();
        this.goForward(tab.id);
      }
    });

    // 4. Block unwanted redirects / page changes to gambling or ad domains
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

    // 5. Inject cosmetic styles to hide banner ads and gambling buttons directly on page
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

      // Re-apply zoom factor
      if (tab.zoomFactor && tab.zoomFactor !== 1.0) {
        try {
          wc.setZoomFactor(tab.zoomFactor);
        } catch (e) {}
      }

      // Re-apply volume and mute
      this.applyVolumeToWebContents(wc, tab.volume, tab.isMuted);

      // Re-apply web localization injection (navigator.language)
      if (this.localeManager) {
        wc.executeJavaScript(this.localeManager.getInjectionScript()).catch(() => {});
      }

      // Inject middle-click handler for all <a> tags to reliably open links in new tab
      wc.executeJavaScript(`
        (function() {
          if (window.__bocchy_auxclick_registered__) return;
          window.__bocchy_auxclick_registered__ = true;
          window.addEventListener('auxclick', function(e) {
            if (e.button === 1) {
              var target = e.target;
              var anchor = target && target.closest ? target.closest('a') : null;
              if (anchor && anchor.href && !anchor.href.startsWith('javascript:')) {
                e.preventDefault();
                e.stopPropagation();
                window.open(anchor.href, '_blank');
              }
            }
          }, true);
        })();
      `).catch(() => {});
    });
  }

  public switchTab(tabId: string) {
    if (!this.tabs.has(tabId)) return;

    if (this.isHtmlFullScreen) {
      this.isHtmlFullScreen = false;
      if (!this.wasWindowFullScreenBeforeHtml && this.mainWindow.isFullScreen()) {
        this.mainWindow.setFullScreen(false);
      }
      if (!this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('html-fullscreen:change', false);
      }
    }

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

    this.notifyTabsUpdatedImmediate();
  }

  public closeTab(tabId: string) {
    const tab = this.tabs.get(tabId);
    if (!tab) return;

    if (this.isHtmlFullScreen && this.activeTabId === tabId) {
      this.isHtmlFullScreen = false;
      if (!this.wasWindowFullScreenBeforeHtml && this.mainWindow.isFullScreen()) {
        this.mainWindow.setFullScreen(false);
      }
      if (!this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('html-fullscreen:change', false);
      }
    }

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
      this.notifyTabsUpdatedImmediate();
    }
  }

  public navigate(tabId: string, inputUrl: string) {
    const tab = this.tabs.get(tabId);
    if (!tab) return;

    if (tab.isSleeping) {
      this.wakeTab(tab);
    }

    let targetUrl = inputUrl.trim();
    if (isSettingsUrl(targetUrl)) {
      tab.url = SETTINGS_URL;
      tab.title = this.currentLanguage === 'th' ? 'การตั้งค่า' : 'Settings';
      tab.isLoading = false;
      this.updateActiveViewBounds();
      this.notifyTabsUpdated();
      return;
    }

    if (isNewTabUrl(targetUrl)) {
      tab.url = NEW_TAB_URL;
      tab.title = tab.isIncognito ? 'Incognito Tab' : 'New Tab';
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

  public openSettingsTab(): string {
    for (const tab of this.tabs.values()) {
      if (isSettingsUrl(tab.url)) {
        this.switchTab(tab.id);
        return tab.id;
      }
    }
    return this.createTab(SETTINGS_URL, false, true);
  }

  private applyVolumeToWebContents(wc: any, volume: number, isMuted: boolean) {
    if (!wc || wc.isDestroyed()) return;
    try {
      wc.setAudioMuted(Boolean(isMuted || volume === 0));
      const volRatio = isMuted ? 0 : Math.max(0, Math.min(1, volume / 100));
      const script = `
        (function(v) {
          window.__bocchy_volume_level__ = v;
          try {
            const media = document.querySelectorAll('video, audio');
            media.forEach(function(m) { m.volume = v; });
          } catch (e) {}
          if (!window.__bocchy_volume_hooked__) {
            window.__bocchy_volume_hooked__ = true;
            document.addEventListener('play', function(e) {
              if (e.target && (e.target.tagName === 'VIDEO' || e.target.tagName === 'AUDIO')) {
                if (typeof window.__bocchy_volume_level__ === 'number') {
                  e.target.volume = window.__bocchy_volume_level__;
                }
              }
            }, true);
          }
        })(${volRatio});
      `;
      wc.executeJavaScript(script).catch(() => {});
    } catch (e) {}
  }

  public setTabVolume(tabId: string, volume: number) {
    const tab = this.tabs.get(tabId);
    if (!tab) return;
    tab.volume = Math.max(0, Math.min(100, Math.round(volume)));
    if (tab.volume > 0 && tab.isMuted) {
      tab.isMuted = false;
    }
    if (tab.view && !tab.isSleeping) {
      this.applyVolumeToWebContents(tab.view.webContents, tab.volume, tab.isMuted);
    }
    this.notifyTabsUpdated();
  }

  public toggleTabMute(tabId: string): boolean {
    const tab = this.tabs.get(tabId);
    if (!tab) return false;
    tab.isMuted = !tab.isMuted;
    if (tab.view && !tab.isSleeping) {
      this.applyVolumeToWebContents(tab.view.webContents, tab.volume, tab.isMuted);
    }
    this.notifyTabsUpdated();
    return tab.isMuted;
  }

  public async toggleMediaPlayback(tabId: string): Promise<boolean> {
    const tab = this.tabs.get(tabId);
    if (!tab || !tab.view || tab.isSleeping) return false;
    const wc = tab.view.webContents;
    if (wc.isDestroyed()) return false;

    const script = `
      (function() {
        try {
          // 1. YouTube HTML5 Video Player API
          const ytPlayer = document.getElementById('movie_player') || window.movie_player;
          if (ytPlayer && typeof ytPlayer.getPlayerState === 'function') {
            const state = ytPlayer.getPlayerState();
            // 1 = playing, 2 = paused, 3 = buffering, -1 = unstarted
            if (state === 1) {
              ytPlayer.pauseVideo();
              return { success: true, action: 'paused' };
            } else {
              ytPlayer.playVideo();
              return { success: true, action: 'played' };
            }
          }

          // 2. Generic HTML5 <video> and <audio> elements
          const mediaElements = Array.from(document.querySelectorAll('video, audio'));
          if (mediaElements.length > 0) {
            const playing = mediaElements.find(function(m) { return !m.paused && !m.ended && m.currentTime > 0; });
            if (playing) {
              playing.pause();
              return { success: true, action: 'paused' };
            } else {
              const toPlay = mediaElements.find(function(m) { return m.currentTime > 0; }) || mediaElements[0];
              if (toPlay) {
                toPlay.play().catch(function() {});
                return { success: true, action: 'played' };
              }
            }
          }

          // 3. Spotify Web Player
          const spotifyPlayBtn = document.querySelector('[data-testid=\"control-button-playpause\"]');
          if (spotifyPlayBtn) {
            spotifyPlayBtn.click();
            return { success: true, action: 'toggled' };
          }

          // 4. SoundCloud
          const scPlayBtn = document.querySelector('.playControl');
          if (scPlayBtn) {
            scPlayBtn.click();
            return { success: true, action: 'toggled' };
          }

          // 5. Twitch
          const twitchPlayBtn = document.querySelector('[data-a-target=\"player-play-pause-button\"]');
          if (twitchPlayBtn) {
            twitchPlayBtn.click();
            return { success: true, action: 'toggled' };
          }
        } catch (e) {}
        return { success: false };
      })();
    `;

    try {
      await wc.executeJavaScript(script);
      return true;
    } catch (e) {
      return false;
    }
  }

  public muteAllAudio(): void {
    for (const tab of this.tabs.values()) {
      tab.isMuted = true;
      if (tab.view && !tab.isSleeping) {
        this.applyVolumeToWebContents(tab.view.webContents, tab.volume, true);
      }
    }
    this.notifyTabsUpdatedImmediate();
  }

  public unmuteAllAudio(): void {
    for (const tab of this.tabs.values()) {
      tab.isMuted = false;
      if (tab.view && !tab.isSleeping) {
        this.applyVolumeToWebContents(tab.view.webContents, tab.volume, false);
      }
    }
    this.notifyTabsUpdatedImmediate();
  }

  public async pauseAllMedia(): Promise<void> {
    for (const tab of this.tabs.values()) {
      if (tab.isPlayingAudio && tab.view && !tab.isSleeping) {
        await this.toggleMediaPlayback(tab.id);
      }
    }
    this.notifyTabsUpdatedImmediate();
  }

  public setTabZoom(tabId: string, zoomFactor: number): number {
    const tab = this.tabs.get(tabId);
    if (!tab) return 1.0;
    const clamped = Math.max(0.25, Math.min(5.0, Number(zoomFactor.toFixed(2))));
    tab.zoomFactor = clamped;
    if (tab.view && !tab.isSleeping) {
      try {
        tab.view.webContents.setZoomFactor(clamped);
      } catch (e) {}
    }
    this.notifyTabsUpdated();
    return clamped;
  }

  public zoomIn(tabId: string): number {
    const tab = this.tabs.get(tabId);
    if (!tab) return 1.0;
    const current = tab.zoomFactor || 1.0;
    const next = Math.min(5.0, current + 0.1);
    return this.setTabZoom(tabId, next);
  }

  public zoomOut(tabId: string): number {
    const tab = this.tabs.get(tabId);
    if (!tab) return 1.0;
    const current = tab.zoomFactor || 1.0;
    const next = Math.max(0.25, current - 0.1);
    return this.setTabZoom(tabId, next);
  }

  public resetZoom(tabId: string): number {
    return this.setTabZoom(tabId, 1.0);
  }

  public toggleDevTools(tabId?: string) {
    const targetId = tabId || this.activeTabId;
    if (!targetId) return;
    const tab = this.tabs.get(targetId);
    if (tab && tab.view && !tab.isSleeping) {
      const wc = tab.view.webContents;
      if (wc.isDevToolsOpened()) {
        wc.closeDevTools();
      } else {
        wc.openDevTools({ mode: 'right' });
      }
    }
  }

  public async applyLanguage(lang: 'th' | 'en') {
    this.currentLanguage = lang;
    this.contextMenuManager.setLanguage(lang);
    if (this.localeManager) {
      await this.localeManager.setLanguage(lang);
    }

    // Apply to all open tabs
    for (const tab of this.tabs.values()) {
      if (tab.view && !tab.isSleeping && this.localeManager) {
        tab.view.webContents.executeJavaScript(this.localeManager.getInjectionScript()).catch(() => {});
      }
    }

    // If active tab is on a website (e.g. YouTube), reload it so the website updates its UI language immediately
    const activeTab = this.getActiveTab();
    if (activeTab && activeTab.view && !activeTab.isSleeping && activeTab.url && !isNewTabUrl(activeTab.url)) {
      let targetUrl = activeTab.url;
      if (targetUrl.includes('hl=')) {
        targetUrl = targetUrl.replace(/hl=[^&]*/g, `hl=${lang === 'th' ? 'th' : 'en'}`);
        activeTab.view.webContents.loadURL(targetUrl);
      } else {
        activeTab.view.webContents.reloadIgnoringCache();
      }
    }
  }

  public notifyTabsUpdated() {
    // PERF: Debounce notifications to max ~7 per second (150ms window)
    // Multiple rapid events (did-start-loading, did-navigate, page-title-updated, etc.)
    // will be batched into a single IPC send
    if (this.notifyDebounceTimer) return;
    this.notifyDebounceTimer = setTimeout(() => {
      this.notifyDebounceTimer = null;
      this._sendTabsUpdate();
    }, 150);
  }

  // Force-send immediately (used for critical updates like tab close/create)
  public notifyTabsUpdatedImmediate() {
    if (this.notifyDebounceTimer) {
      clearTimeout(this.notifyDebounceTimer);
      this.notifyDebounceTimer = null;
    }
    this._sendTabsUpdate();
  }

  private _sendTabsUpdate() {
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
      isPlayingAudio: t.isPlayingAudio,
      isMuted: t.isMuted,
      volume: t.volume,
      zoomFactor: t.zoomFactor,
      adBlockStats: this.adblocker.getStats(t.id),
    }));

    this.mainWindow.webContents.send('tabs:updated', tabList, this.activeTabId || '');
  }

  private handleEnterHtmlFullScreen(tab: ManagedTab) {
    this.isHtmlFullScreen = true;
    this.wasWindowFullScreenBeforeHtml = this.mainWindow.isFullScreen();

    // 1. Enter OS-level full screen if not already
    if (!this.wasWindowFullScreenBeforeHtml) {
      this.mainWindow.setFullScreen(true);
    }

    // 2. Expand view bounds to cover 100% of window (0, 0, width, height)
    const [width, height] = this.mainWindow.getContentSize();
    if (tab.view && !tab.isSleeping) {
      tab.view.setBounds({
        x: 0,
        y: 0,
        width,
        height,
      });
    }

    // 3. Notify renderer
    if (!this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('html-fullscreen:change', true);
    }
  }

  private handleLeaveHtmlFullScreen(tab: ManagedTab) {
    this.isHtmlFullScreen = false;

    // 1. Exit OS-level full screen if it was entered for this video
    if (!this.wasWindowFullScreenBeforeHtml && this.mainWindow.isFullScreen()) {
      this.mainWindow.setFullScreen(false);
    }

    // 2. Restore normal tab view bounds
    this.updateActiveViewBounds();

    // 3. Notify renderer
    if (!this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('html-fullscreen:change', false);
    }
  }

  public toggleFullScreen(): boolean {
    const isFs = !this.mainWindow.isFullScreen();
    this.mainWindow.setFullScreen(isFs);
    return isFs;
  }
}
