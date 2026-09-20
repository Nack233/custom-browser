import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import type { AppSettings, BookmarkItem, ShortcutItem } from '../types/browser';

const DEFAULT_SHORTCUTS: ShortcutItem[] = [
  { id: 'sc_1', title: 'YouTube', url: 'https://www.youtube.com', color: '#ef4444' },
  { id: 'sc_2', title: 'MangaDex', url: 'https://mangadex.org', color: '#f97316' },
  { id: 'sc_3', title: 'MangaPlus', url: 'https://mangaplus.shueisha.co.jp', color: '#eab308' },
  { id: 'sc_4', title: 'Google', url: 'https://www.google.com', color: '#3b82f6' },
  { id: 'sc_5', title: 'Reddit', url: 'https://www.reddit.com', color: '#ea580c' },
  { id: 'sc_6', title: 'DuckDuckGo', url: 'https://duckduckgo.com', color: '#eab308' },
  { id: 'sc_7', title: 'Wikipedia', url: 'https://www.wikipedia.org', color: '#6b7280' },
];

const DEFAULT_BOOKMARKS: BookmarkItem[] = [
  { id: 'bm_1', title: 'DuckDuckGo', url: 'https://duckduckgo.com', createdAt: Date.now() },
  { id: 'bm_2', title: 'MangaDex', url: 'https://mangadex.org', createdAt: Date.now() },
  { id: 'bm_3', title: 'YouTube', url: 'https://www.youtube.com', createdAt: Date.now() },
];

const DEFAULT_SETTINGS: AppSettings = {
  language: 'th',
  dnsProvider: 'cloudflare',
  customDnsUrl: '',
  forceDarkMode: false,
  showBookmarksBar: true,
  hardwareAcceleration: true,
  tabSleepEnabled: true,
  tabSleepMinutes: 15,
  bookmarks: DEFAULT_BOOKMARKS,
  shortcuts: DEFAULT_SHORTCUTS,
};

export class SettingsManager {
  private settings: AppSettings = DEFAULT_SETTINGS;
  private filePath: string;

  constructor() {
    this.filePath = path.join(app.getPath('userData'), 'nexus-settings.json');
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.settings = {
          ...DEFAULT_SETTINGS,
          ...parsed,
          bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : DEFAULT_BOOKMARKS,
          shortcuts: Array.isArray(parsed.shortcuts) ? parsed.shortcuts : DEFAULT_SHORTCUTS,
        };
      }
    } catch (e) {
      console.error('[Settings] Load error:', e);
    }
  }

  private save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.settings, null, 2), 'utf-8');
    } catch (e) {
      console.error('[Settings] Save error:', e);
    }
  }

  public getSettings(): AppSettings {
    return this.settings;
  }

  public updateSettings(partial: Partial<AppSettings>): AppSettings {
    this.settings = { ...this.settings, ...partial };
    this.save();
    if (partial.dnsProvider !== undefined || partial.customDnsUrl !== undefined) {
      this.applyDns();
    }
    return this.settings;
  }

  // Bookmarks API
  public getBookmarks(): BookmarkItem[] {
    return this.settings.bookmarks || [];
  }

  public addBookmark(item: { title: string; url: string; favicon?: string }): BookmarkItem {
    const list = [...(this.settings.bookmarks || [])];
    const existingIndex = list.findIndex((b) => b.url.toLowerCase() === item.url.toLowerCase());
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], title: item.title, favicon: item.favicon };
      this.updateSettings({ bookmarks: list });
      return list[existingIndex];
    }
    const newBookmark: BookmarkItem = {
      id: `bm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: item.title || item.url,
      url: item.url,
      favicon: item.favicon,
      createdAt: Date.now(),
    };
    list.unshift(newBookmark);
    this.updateSettings({ bookmarks: list });
    return newBookmark;
  }

  public removeBookmark(idOrUrl: string): boolean {
    const list = this.settings.bookmarks || [];
    const filtered = list.filter((b) => b.id !== idOrUrl && b.url.toLowerCase() !== idOrUrl.toLowerCase());
    if (filtered.length !== list.length) {
      this.updateSettings({ bookmarks: filtered });
      return true;
    }
    return false;
  }

  // Shortcuts API
  public getShortcuts(): ShortcutItem[] {
    return this.settings.shortcuts || [];
  }

  public addShortcut(item: { title: string; url: string; icon?: string; color?: string }): ShortcutItem {
    const list = [...(this.settings.shortcuts || [])];
    const newShortcut: ShortcutItem = {
      id: `sc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: item.title,
      url: item.url,
      icon: item.icon,
      color: item.color || '#6366f1',
    };
    list.push(newShortcut);
    this.updateSettings({ shortcuts: list });
    return newShortcut;
  }

  public removeShortcut(id: string): boolean {
    const list = this.settings.shortcuts || [];
    const filtered = list.filter((s) => s.id !== id);
    if (filtered.length !== list.length) {
      this.updateSettings({ shortcuts: filtered });
      return true;
    }
    return false;
  }

  public applyDns() {
    try {
      const { dnsProvider, customDnsUrl } = this.settings;
      console.log(`[DNS] Applying resolver: ${dnsProvider}`);

      if (dnsProvider === 'system') {
        if (typeof (app as any).configureHostResolver === 'function') {
          (app as any).configureHostResolver({
            enableBuiltInResolver: false,
            secureDnsMode: 'off',
            secureDnsServers: [],
          });
          console.log('[DNS] Reverted to system resolver');
        }
        return;
      }

      let servers: string[] = [];
      if (dnsProvider === 'cloudflare') {
        servers = ['https://cloudflare-dns.com/dns-query', 'https://1.1.1.1/dns-query'];
      } else if (dnsProvider === 'google') {
        servers = ['https://dns.google/dns-query', 'https://8.8.8.8/dns-query'];
      } else if (dnsProvider === 'adguard') {
        servers = ['https://dns.adguard-dns.com/dns-query'];
      } else if (dnsProvider === 'quad9') {
        servers = ['https://dns.quad9.net/dns-query'];
      } else if (dnsProvider === 'custom' && customDnsUrl) {
        servers = [customDnsUrl.trim()];
      }

      if (servers.length > 0 && typeof (app as any).configureHostResolver === 'function') {
        (app as any).configureHostResolver({
          enableBuiltInResolver: true,
          secureDnsMode: 'secure',
          secureDnsServers: servers,
        });
        console.log('[DNS] Secure DNS (DoH) successfully enabled:', servers);
      }
    } catch (err) {
      console.error('[DNS] Failed to configure host resolver:', err);
    }
  }
}
