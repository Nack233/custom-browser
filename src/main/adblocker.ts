import { session } from 'electron';

export interface BlockedItem {
  url: string;
  domain: string;
  timestamp: number;
}

export class AdBlockService {
  private tabBlockedCounts: Map<string, number> = new Map();
  private tabBlockedItems: Map<string, BlockedItem[]> = new Map();
  private tabEnabled: Map<string, boolean> = new Map();
  private blockGifAds: boolean = true;
  private blockRedirects: boolean = true;
  private onBlockedCallback?: (tabId: string, url: string, total: number) => void;

  // Curated list of high-traffic ad networks, tracking telemetry, and popunder engines
  private blockedDomains = new Set([
    'doubleclick.net',
    'googlesyndication.com',
    'googleadservices.com',
    'adservice.google.com',
    'pagead2.googlesyndication.com',
    'adnxs.com',
    'advertising.com',
    'moatads.com',
    'facebook.com/tr',
    'scorecardresearch.com',
    'taboola.com',
    'outbrain.com',
    'criteo.com',
    'hotjar.com',
    'mouseflow.com',
    'clarity.ms',
    'amazon-adsystem.com',
    'rubiconproject.com',
    'pubmatic.com',
    'openx.net',
    'casalemedia.com',
    'popads.net',
    'propellerads.com',
    'adcash.com',
    'adsterra.com',
    'bidvertiser.com',
    'media.net',
    'inmobi.com',
    'vungle.com',
    'applovin.com',
    'unityads.unity3d.com',
    'exoclick.com',
    'trafficjunky.com',
    'zergnet.com',
    'revcontent.com',
    'mgid.com',
    'chartbeat.com',
    'quantserve.com',
    'gemini.yahoo.com',
    'googletagmanager.com',
    'google-analytics.com',
  ]);

  private blockedUrlPatterns: RegExp[] = [
    /\/ads?[\.\/\?]/i,
    /\/advert(ising|isement)?[\.\/\?]/i,
    /\/adserver[\.\/\?]/i,
    /\/prebid[\.\-_]/i,
    /\/popunder[\.\-_]/i,
    /\/pagead\//i,
    /\/analytics\.js/i,
    /\/gtag\/js\?id=/i,
    /\/fbevents\.js/i,
  ];

  constructor() {
    this.init();
  }

  public setOnBlockedCallback(cb: (tabId: string, url: string, total: number) => void) {
    this.onBlockedCallback = cb;
  }

  public init() {
    console.log('[AdBlock] Initializing high-performance network request blocker...');
    this.attachSession(session.defaultSession);
    console.log('[AdBlock] High-performance adblocker active.');
  }

  public attachSession(targetSession: Electron.Session) {
    if (!targetSession || !targetSession.webRequest) return;

    targetSession.webRequest.onBeforeRequest(
      { urls: ['*://*/*'] },
      (details, callback) => {
        const tabId = details.webContentsId ? `tab_${details.webContentsId}` : 'global';
        const isEnabled = this.tabEnabled.get(tabId) ?? true;

        if (!isEnabled) {
          return callback({ cancel: false });
        }

        const url = details.url;

        // Don't block localhost, chrome devtools, or data URLs
        if (
          url.startsWith('http://localhost') ||
          url.startsWith('chrome-extension://') ||
          url.startsWith('devtools://')
        ) {
          return callback({ cancel: false });
        }

        if (this.isAdOrTracker(url)) {
          console.log(`[AdBlock Blocked] [${tabId}] ${url.substring(0, 80)}`);
          this.recordBlocked(tabId, url);
          return callback({ cancel: true });
        }

        callback({ cancel: false });
      }
    );
  }

  public isAdOrTracker(urlStr: string): boolean {
    try {
      const parsed = new URL(urlStr);
      const host = parsed.hostname.toLowerCase();
      const pathWithQuery = (parsed.pathname + parsed.search).toLowerCase();

      // 1. Block ad GIF banners (gambling, pop, dimensional banner gifs)
      if (this.blockGifAds && (pathWithQuery.includes('.gif') || parsed.pathname.endsWith('.gif'))) {
        const isBannerDim = /\b(728x\d+|300x\d+|140x\d+|160x\d+|468x\d+|970x\d+|320x\d+)\b/i.test(pathWithQuery);
        const hasAdKeyword = /(banner|pop|ufa|slot|bet|casino|baccara|zeed|888|999|168|btt|lttt|popunder|vip|game)/i.test(pathWithQuery);
        if (isBannerDim || hasAdKeyword || pathWithQuery.includes('banner')) {
          return true;
        }
      }

      // 2. Check exact hostname or suffix match against known ad domains
      for (const domain of this.blockedDomains) {
        if (host === domain || host.endsWith('.' + domain) || urlStr.includes(domain)) {
          return true;
        }
      }

      // 3. Check path patterns
      for (const pattern of this.blockedUrlPatterns) {
        if (pattern.test(pathWithQuery)) {
          return true;
        }
      }

      // 4. Check Thai gambling / betting ad domains or paths
      if (/(ufa|slot|pgslot|casino|baccara|bet|sbobet|zeed|888|999|168)[\.\-_/]/i.test(urlStr)) {
        return true;
      }
    } catch {
      // Ignore invalid URLs
    }
    return false;
  }

  /**
   * Check if a requested navigation/redirect is an unwanted popup or advertising redirect
   */
  public isRedirectAd(targetUrl: string, currentUrl?: string): boolean {
    if (!this.blockRedirects) return false;
    try {
      if (!targetUrl || targetUrl === 'about:blank') return true;

      const parsed = new URL(targetUrl);
      const host = parsed.hostname.toLowerCase();

      // Allow same-origin navigation unless known ad
      if (currentUrl) {
        try {
          const currentHost = new URL(currentUrl).hostname.toLowerCase();
          if (host === currentHost && !this.isAdOrTracker(targetUrl)) {
            return false;
          }
        } catch {}
      }

      // Check against ad rules
      if (this.isAdOrTracker(targetUrl)) return true;

      // Common redirection networks used in pirate / manga sites
      if (
        host.includes('line.me') ||
        host.includes('direct.me') ||
        host.includes('linkvertise') ||
        host.includes('ouo.io') ||
        /(ufa|bet|slot|casino|pgslot|baccara|lotto|zeed|888|999|168)/i.test(host)
      ) {
        return true;
      }
    } catch {}
    return false;
  }

  public getStats(tabId: string) {
    const tabCount = this.tabBlockedCounts.get(tabId) || 0;
    const globalCount = this.tabBlockedCounts.get('global') || 0;
    const items = this.tabBlockedItems.get(tabId) || this.tabBlockedItems.get('global') || [];

    return {
      blockedCount: tabCount + (tabId === 'global' ? 0 : globalCount),
      enabled: this.tabEnabled.get(tabId) ?? true,
      blockGifAds: this.blockGifAds,
      blockRedirects: this.blockRedirects,
      recentBlocked: items,
    };
  }

  public toggleTab(tabId: string): boolean {
    const current = this.tabEnabled.get(tabId) ?? true;
    const next = !current;
    this.tabEnabled.set(tabId, next);
    return next;
  }

  public toggleBlockGifAds(): boolean {
    this.blockGifAds = !this.blockGifAds;
    return this.blockGifAds;
  }

  public toggleBlockRedirects(): boolean {
    this.blockRedirects = !this.blockRedirects;
    return this.blockRedirects;
  }

  public isBlockGifAds(): boolean {
    return this.blockGifAds;
  }

  public isBlockRedirects(): boolean {
    return this.blockRedirects;
  }

  public recordBlocked(tabId: string, url: string): number {
    const current = this.tabBlockedCounts.get(tabId) || 0;
    const next = current + 1;
    this.tabBlockedCounts.set(tabId, next);

    let domain = url;
    try {
      domain = new URL(url).hostname;
    } catch {}

    const items = this.tabBlockedItems.get(tabId) || [];
    items.unshift({ url, domain, timestamp: Date.now() });
    if (items.length > 50) items.pop();
    this.tabBlockedItems.set(tabId, items);

    if (this.onBlockedCallback) {
      this.onBlockedCallback(tabId, url, next);
    }
    return next;
  }

  public resetTab(tabId: string) {
    this.tabBlockedCounts.set(tabId, 0);
    this.tabBlockedItems.delete(tabId);
  }
}
