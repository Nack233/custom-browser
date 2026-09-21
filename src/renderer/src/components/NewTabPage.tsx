import React, { useState, useEffect } from 'react';
import type { ShortcutItem, BookmarkItem, RecentlyClosedItem } from '../../../types/browser';
import { Search, Plus, X, Globe, RotateCcw, Bookmark, Clock, Trash2, ExternalLink } from 'lucide-react';
import type { Language } from '../i18n';
import { translations } from '../i18n';

interface NewTabPageProps {
  language: Language;
  shortcuts: ShortcutItem[];
  bookmarks: BookmarkItem[];
  recentlyClosed: RecentlyClosedItem[];
  onNavigate: (url: string) => void;
  onOpenInNewTab: (url: string) => void;
  onAddShortcut: (item: { title: string; url: string; color?: string }) => void;
  onRemoveShortcut: (id: string) => void;
  onRestoreClosedTab: () => void;
}

export const NewTabPage: React.FC<NewTabPageProps> = ({
  language,
  shortcuts,
  bookmarks,
  recentlyClosed,
  onNavigate,
  onOpenInNewTab,
  onAddShortcut,
  onRemoveShortcut,
  onRestoreClosedTab,
}) => {
  const [query, setQuery] = useState('');
  const [searchEngine, setSearchEngine] = useState<'duckduckgo' | 'google'>('duckduckgo');
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');

  const t = translations[language] || translations.th;

  // Live Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString(language === 'th' ? 'th-TH' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
      setCurrentDate(
        now.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [language]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const trimmed = query.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || (trimmed.includes('.') && !trimmed.includes(' '))) {
      onNavigate(trimmed);
      return;
    }

    if (searchEngine === 'google') {
      onNavigate(`https://www.google.com/search?q=${encodeURIComponent(trimmed)}`);
    } else {
      onNavigate(`https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleSaveShortcut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    let finalUrl = newUrl.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    onAddShortcut({
      title: newTitle.trim(),
      url: finalUrl,
      color: newColor,
    });

    setNewTitle('');
    setNewUrl('');
    setIsAddModalOpen(false);
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-gradient-to-b from-[#140a1b] via-[#100615] to-[#0a030d] text-pink-50 flex flex-col items-center px-6 py-10 select-none relative">
      {/* Background ambient glow effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-br from-pink-500/20 via-rose-500/15 to-purple-600/15 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[350px] bg-pink-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[300px] bg-purple-600/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Clock & Header */}
      <div className="text-center z-10 mb-8 flex flex-col items-center">
        <div className="relative mb-4 group">
          <div className="absolute -inset-1.5 bg-gradient-to-r from-pink-500/60 via-rose-400/40 to-purple-500/50 rounded-3xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-90 animate-pulse" />
          <div className="relative p-1 rounded-2xl bg-white/10 backdrop-blur-md border border-pink-300/40 shadow-[0_0_30px_rgba(244,114,182,0.4)]">
            <img
              src="./bocchy.png"
              alt="Bocchy"
              className="w-20 h-20 rounded-xl object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </div>
        <h1 className="text-6xl font-light tracking-tight bg-gradient-to-r from-pink-100 via-rose-200 to-pink-300 bg-clip-text text-transparent font-mono drop-shadow-[0_0_25px_rgba(244,114,182,0.35)]">
          {currentTime || '00:00'}
        </h1>
        <p className="text-xs text-pink-200/70 font-medium mt-1.5 uppercase tracking-widest">
          {currentDate}
        </p>
        <p className="text-sm font-semibold bg-gradient-to-r from-pink-300 via-rose-200 to-purple-300 bg-clip-text text-transparent mt-2 flex items-center space-x-1.5">
          <span>✨ {t.welcomeTitle} 🌸</span>
        </p>
      </div>

      {/* Search Omnibar */}
      <div className="w-full max-w-2xl z-10 mb-10">
        <form onSubmit={handleSearch} className="relative flex items-center">
          <div className="absolute left-3.5 flex items-center space-x-1.5 z-10">
            <button
              type="button"
              onClick={() => setSearchEngine(searchEngine === 'duckduckgo' ? 'google' : 'duckduckgo')}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-pink-500/20 hover:bg-pink-500/30 text-pink-200 border border-pink-400/30 transition-all flex items-center shadow-sm"
              title="Click to switch search engine"
            >
              {searchEngine === 'duckduckgo' ? '🦆 DuckDuckGo' : '🔍 Google'}
            </button>
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              searchEngine === 'duckduckgo'
                ? (language === 'th' ? 'ค้นหาด้วย DuckDuckGo หรือพิมพ์ที่อยู่เว็บ...' : 'Search with DuckDuckGo or enter web address...')
                : (language === 'th' ? 'ค้นหาด้วย Google หรือพิมพ์ที่อยู่เว็บ...' : 'Search with Google or enter web address...')
            }
            className="w-full h-12 pl-36 pr-14 bg-white/[0.04] hover:bg-white/[0.07] backdrop-blur-2xl rounded-2xl border border-pink-400/30 hover:border-pink-400/60 focus:border-pink-400 text-sm text-pink-50 placeholder-pink-300/40 focus:outline-none focus:ring-4 focus:ring-pink-500/20 shadow-[0_10px_35px_rgba(244,114,182,0.18),inset_0_1px_1px_rgba(255,255,255,0.12)] transition-all"
            autoFocus
          />

          <button
            type="submit"
            className="absolute right-2.5 p-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white transition-all shadow-[0_0_15px_rgba(244,114,182,0.45)]"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Speed Dial Shortcuts Grid */}
      <div className="w-full max-w-4xl z-10 mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-pink-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-pink-300/70">
              {t.shortcutsTitle}
            </h2>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-1 text-xs text-pink-300 hover:text-pink-100 bg-pink-500/15 hover:bg-pink-500/25 border border-pink-400/30 px-3 py-1 rounded-xl transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.addShortcut}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {shortcuts.map((sc) => {
            const letter = (sc.title || sc.url).charAt(0).toUpperCase();
            return (
              <div
                key={sc.id}
                onClick={() => onNavigate(sc.url)}
                onAuxClick={(e) => {
                  if (e.button === 1) {
                    e.preventDefault();
                    onOpenInNewTab(sc.url);
                  }
                }}
                className="group relative flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white/[0.035] hover:bg-white/[0.08] backdrop-blur-xl border border-pink-500/20 hover:border-pink-400/60 cursor-pointer transition-all duration-200 hover:-translate-y-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_28px_rgba(244,114,182,0.25)]"
                title={`${sc.title}\n${sc.url}`}
              >
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveShortcut(sc.id);
                  }}
                  className="absolute top-1.5 right-1.5 p-1 rounded-md opacity-0 group-hover:opacity-100 bg-[#2b1735] hover:bg-rose-500 text-pink-300 hover:text-white transition-opacity"
                  title="Remove shortcut"
                >
                  <X className="w-3 h-3" />
                </button>

                {/* Avatar / Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base text-white mb-2 shadow-inner"
                  style={{
                    backgroundColor: sc.color || '#ec4899',
                  }}
                >
                  {letter}
                </div>

                {/* Title */}
                <span className="text-xs font-medium text-pink-100 group-hover:text-white text-center truncate w-full">
                  {sc.title}
                </span>
                <span className="text-[10px] text-pink-300/50 truncate w-full text-center">
                  {getDomain(sc.url)}
                </span>
              </div>
            );
          })}

          {/* Add Tile */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-dashed border-pink-400/30 hover:border-pink-400/70 hover:bg-pink-500/10 text-pink-300/70 hover:text-pink-100 transition-all group backdrop-blur-md"
          >
            <div className="w-10 h-10 rounded-xl bg-pink-950/40 group-hover:bg-pink-500/25 border border-pink-500/20 flex items-center justify-center mb-2 transition-colors">
              <Plus className="w-5 h-5 group-hover:scale-110 text-pink-400 group-hover:text-pink-200 transition-transform" />
            </div>
            <span className="text-xs font-medium">{t.addShortcut}</span>
          </button>
        </div>
      </div>

      {/* Dual Section: Bookmarks & Recently Closed */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-5 z-10">
        {/* Bookmarks Card */}
        <div className="bg-[#160c1d]/60 backdrop-blur-2xl rounded-3xl border border-pink-500/20 p-5 flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-pink-400/35 transition-colors">
          <div className="flex items-center space-x-2 mb-3">
            <Bookmark className="w-4 h-4 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-pink-200">
              {t.bookmarks} ({bookmarks.length})
            </h3>
          </div>

          <div className="flex-1 space-y-1.5 overflow-y-auto max-h-48 pr-1">
            {bookmarks.length === 0 ? (
              <p className="text-xs text-pink-300/40 italic py-4 text-center">
                {language === 'th' ? 'ยังไม่มีบุ๊กมาร์ก (กดปุ่ม ⭐ บน Address bar เพื่อเพิ่ม)' : 'No bookmarks yet (click ⭐ on the address bar to add)'}
              </p>
            ) : (
              bookmarks.map((bm) => (
                <div
                  key={bm.id}
                  onClick={() => onNavigate(bm.url)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-pink-500/15 cursor-pointer text-xs transition-colors group"
                >
                  <div className="flex items-center space-x-2.5 truncate flex-1">
                    {bm.favicon ? (
                      <img
                        src={bm.favicon}
                        alt=""
                        className="w-4 h-4 rounded-md object-contain flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Globe className="w-3.5 h-3.5 text-pink-400/50 flex-shrink-0" />
                    )}
                    <span className="truncate text-pink-100 group-hover:text-white font-medium">
                      {bm.title || bm.url}
                    </span>
                  </div>
                  <span className="text-[10px] text-pink-300/50 group-hover:text-pink-300 ml-2">
                    {getDomain(bm.url)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recently Closed Tabs Card (กู้คืนแท็บที่เผลอปิด) */}
        <div className="bg-[#160c1d]/60 backdrop-blur-2xl rounded-3xl border border-pink-500/20 p-5 flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-pink-400/35 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <RotateCcw className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-pink-200">
                {t.recentlyClosedTitle} ({recentlyClosed.length})
              </h3>
            </div>
            {recentlyClosed.length > 0 && (
              <button
                onClick={onRestoreClosedTab}
                className="text-[11px] text-emerald-300 hover:text-emerald-100 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg transition-all flex items-center space-x-1"
                title="Ctrl+Shift+T"
              >
                <span>{t.restore} ล่าสุด</span>
              </button>
            )}
          </div>

          <div className="flex-1 space-y-1.5 overflow-y-auto max-h-48 pr-1">
            {recentlyClosed.length === 0 ? (
              <p className="text-xs text-pink-300/40 italic py-4 text-center">
                {t.emptyRecentlyClosed}
              </p>
            ) : (
              recentlyClosed.map((rc) => (
                <div
                  key={rc.id}
                  onClick={() => onNavigate(rc.url)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-pink-500/15 cursor-pointer text-xs transition-colors group"
                >
                  <div className="flex items-center space-x-2.5 truncate flex-1">
                    {rc.favicon ? (
                      <img
                        src={rc.favicon}
                        alt=""
                        className="w-4 h-4 rounded-md object-contain flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-pink-400/50 flex-shrink-0" />
                    )}
                    <span className="truncate text-pink-100 group-hover:text-white">
                      {rc.title || rc.url}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400/80 ml-2 group-hover:underline">
                    คลิกเพื่อเปิดใหม่
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Shortcut Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a0f24]/95 backdrop-blur-2xl rounded-3xl border border-pink-400/35 w-full max-w-md p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-pink-100">
                {t.addShortcutTitle}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-pink-300/60 hover:text-white hover:bg-pink-500/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveShortcut} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-pink-200/80 mb-1.5">
                  {t.shortcutName}
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="เช่น YouTube, MangaDex"
                  className="w-full px-3.5 py-2 bg-[#120818]/90 rounded-xl border border-pink-500/30 focus:border-pink-400 text-xs text-pink-50 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-pink-200/80 mb-1.5">
                  {t.shortcutUrl}
                </label>
                <input
                  type="text"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 bg-[#120818]/90 rounded-xl border border-pink-500/30 focus:border-pink-400 text-xs text-pink-50 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-pink-200/80 mb-1.5">
                  สีของไอคอน
                </label>
                <div className="flex space-x-2">
                  {['#ec4899', '#f43f5e', '#a855f7', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#f97316'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        newColor === c ? 'scale-125 border-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-transparent hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs text-pink-300/60 hover:text-pink-100 hover:bg-pink-500/20 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim() || !newUrl.trim()}
                  className="px-4 py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white disabled:opacity-40 transition-all shadow-[0_0_15px_rgba(244,114,182,0.35)]"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
