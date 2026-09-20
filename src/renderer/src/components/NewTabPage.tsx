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
    <div className="flex-1 w-full h-full overflow-y-auto bg-gradient-to-b from-[#121216] via-[#15151a] to-[#0e0e11] text-gray-100 flex flex-col items-center px-6 py-10 select-none">
      {/* Background ambient glow effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Clock & Header */}
      <div className="text-center z-10 mb-8 flex flex-col items-center">
        <div className="relative mb-4 group">
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/40 via-purple-500/30 to-indigo-500/40 rounded-3xl blur-md group-hover:blur-lg transition-all duration-300 opacity-80" />
          <img
            src="./bocchy.png"
            alt="Bocchy"
            className="relative w-20 h-20 rounded-2xl shadow-2xl object-cover border border-white/10 ring-1 ring-white/20 transition-transform duration-300 hover:scale-105"
          />
        </div>
        <h1 className="text-5xl font-light tracking-tight text-white/95 font-mono drop-shadow-md">
          {currentTime || '00:00'}
        </h1>
        <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-wider">
          {currentDate}
        </p>
        <p className="text-base font-medium text-indigo-400/90 mt-2">
          {t.welcomeTitle}
        </p>
      </div>

      {/* Search Omnibar */}
      <div className="w-full max-w-2xl z-10 mb-10">
        <form onSubmit={handleSearch} className="relative flex items-center">
          <div className="absolute left-3.5 flex items-center space-x-1.5 z-10">
            <button
              type="button"
              onClick={() => setSearchEngine(searchEngine === 'duckduckgo' ? 'google' : 'duckduckgo')}
              className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#25252e] hover:bg-[#32323e] text-indigo-300 transition-colors flex items-center"
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
                ? 'Search with DuckDuckGo or enter web address...'
                : 'Search with Google or enter web address...'
            }
            className="w-full h-12 pl-36 pr-12 bg-[#1b1b22]/90 backdrop-blur-md rounded-2xl border border-white/10 hover:border-indigo-500/50 focus:border-indigo-500 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-lg transition-all"
            autoFocus
          />

          <button
            type="submit"
            className="absolute right-3 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-md"
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
            <Globe className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {t.shortcutsTitle}
            </h2>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded-lg"
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
                className="group relative flex flex-col items-center justify-center p-3 rounded-xl bg-[#1a1a22]/80 hover:bg-[#23232e] border border-white/5 hover:border-indigo-500/40 cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-sm"
                title={`${sc.title}\n${sc.url}`}
              >
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveShortcut(sc.id);
                  }}
                  className="absolute top-1.5 right-1.5 p-1 rounded-md opacity-0 group-hover:opacity-100 bg-[#2b2b36] hover:bg-red-500/80 text-gray-400 hover:text-white transition-opacity"
                  title="Remove shortcut"
                >
                  <X className="w-3 h-3" />
                </button>

                {/* Avatar / Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base text-white mb-2 shadow-inner"
                  style={{
                    backgroundColor: sc.color || '#6366f1',
                  }}
                >
                  {letter}
                </div>

                {/* Title */}
                <span className="text-xs font-medium text-gray-200 group-hover:text-white text-center truncate w-full">
                  {sc.title}
                </span>
                <span className="text-[10px] text-gray-500 truncate w-full text-center">
                  {getDomain(sc.url)}
                </span>
              </div>
            );
          })}

          {/* Add Tile */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-[#1a1a24] text-gray-400 hover:text-indigo-300 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#202028] group-hover:bg-indigo-500/20 flex items-center justify-center mb-2 transition-colors">
              <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xs font-medium">{t.addShortcut}</span>
          </button>
        </div>
      </div>

      {/* Dual Section: Bookmarks & Recently Closed */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-5 z-10">
        {/* Bookmarks Card */}
        <div className="bg-[#181820]/70 backdrop-blur-md rounded-2xl border border-white/5 p-4 flex flex-col">
          <div className="flex items-center space-x-2 mb-3">
            <Bookmark className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300">
              {t.bookmarks} ({bookmarks.length})
            </h3>
          </div>

          <div className="flex-1 space-y-1.5 overflow-y-auto max-h-48 pr-1">
            {bookmarks.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-4 text-center">
                ยังไม่มีบุ๊กมาร์ก (กดปุ่ม ⭐ บน Address bar เพื่อเพิ่ม)
              </p>
            ) : (
              bookmarks.map((bm) => (
                <div
                  key={bm.id}
                  onClick={() => onNavigate(bm.url)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-[#22222c] cursor-pointer text-xs transition-colors group"
                >
                  <div className="flex items-center space-x-2.5 truncate flex-1">
                    {bm.favicon ? (
                      <img
                        src={bm.favicon}
                        alt=""
                        className="w-4 h-4 rounded-sm object-contain flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Globe className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    )}
                    <span className="truncate text-gray-200 group-hover:text-white font-medium">
                      {bm.title || bm.url}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 group-hover:text-indigo-400 ml-2">
                    {getDomain(bm.url)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recently Closed Tabs Card (กู้คืนแท็บที่เผลอปิด) */}
        <div className="bg-[#181820]/70 backdrop-blur-md rounded-2xl border border-white/5 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <RotateCcw className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                {t.recentlyClosedTitle} ({recentlyClosed.length})
              </h3>
            </div>
            {recentlyClosed.length > 0 && (
              <button
                onClick={onRestoreClosedTab}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded transition-colors flex items-center space-x-1"
                title="Ctrl+Shift+T"
              >
                <span>{t.restore} ล่าสุด</span>
              </button>
            )}
          </div>

          <div className="flex-1 space-y-1.5 overflow-y-auto max-h-48 pr-1">
            {recentlyClosed.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-4 text-center">
                {t.emptyRecentlyClosed}
              </p>
            ) : (
              recentlyClosed.map((rc) => (
                <div
                  key={rc.id}
                  onClick={() => onNavigate(rc.url)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-[#22222c] cursor-pointer text-xs transition-colors group"
                >
                  <div className="flex items-center space-x-2.5 truncate flex-1">
                    {rc.favicon ? (
                      <img
                        src={rc.favicon}
                        alt=""
                        className="w-4 h-4 rounded-sm object-contain flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    )}
                    <span className="truncate text-gray-200 group-hover:text-white">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1b1b22] rounded-2xl border border-white/10 w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">
                {t.addShortcutTitle}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#2a2a36]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveShortcut} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  {t.shortcutName}
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="เช่น YouTube, MangaDex"
                  className="w-full px-3 py-2 bg-[#121216] rounded-xl border border-white/10 focus:border-indigo-500 text-xs text-white focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  {t.shortcutUrl}
                </label>
                <input
                  type="text"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-[#121216] rounded-xl border border-white/10 focus:border-indigo-500 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  สีของไอคอน
                </label>
                <div className="flex space-x-2">
                  {['#ef4444', '#f97316', '#eab308', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        newColor === c ? 'scale-125 border-white' : 'border-transparent hover:scale-110'
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
                  className="px-3.5 py-1.5 rounded-xl text-xs text-gray-400 hover:bg-[#252530]"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim() || !newUrl.trim()}
                  className="px-4 py-1.5 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-colors"
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
