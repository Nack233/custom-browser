import React, { useState, useEffect, useRef } from 'react';
import type { TabInfo } from '../../types/browser';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Shield,
  ShieldAlert,
  Film,
  Search,
  Lock,
  Settings,
  Star,
  Moon,
  Sun,
  Bookmark,
  Download,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Code2,
} from 'lucide-react';
import type { Language } from '../i18n';
import { translations } from '../i18n';

interface NavigationBarProps {
  activeTab?: TabInfo;
  mediaCount: number;
  language: Language;
  isBookmarked: boolean;
  forceDarkMode: boolean;
  showBookmarksBar: boolean;
  devModeEnabled: boolean;
  onNavigate: (url: string) => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onToggleShield: () => void;
  onToggleMediaDrawer: () => void;
  onToggleSettings: () => void;
  onToggleBookmark: () => void;
  onToggleForceDarkMode: () => void;
  onToggleBookmarksBar: () => void;
  onToggleUpdateLog: () => void;
  onToggleDevTools: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onSetZoom: (factor: number) => void;
  isMediaDrawerOpen: boolean;
  isShieldOpen: boolean;
  isSettingsOpen: boolean;
  isDownloadsOpen: boolean;
  onToggleDownloads: () => void;
  activeDownloadsCount: number;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  activeTab,
  mediaCount,
  language,
  isBookmarked,
  forceDarkMode,
  showBookmarksBar,
  devModeEnabled,
  onNavigate,
  onBack,
  onForward,
  onReload,
  onToggleShield,
  onToggleMediaDrawer,
  onToggleSettings,
  onToggleBookmark,
  onToggleForceDarkMode,
  onToggleBookmarksBar,
  onToggleUpdateLog,
  onToggleDevTools,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onSetZoom,
  isMediaDrawerOpen,
  isShieldOpen,
  isSettingsOpen,
  isDownloadsOpen,
  onToggleDownloads,
  activeDownloadsCount,
}) => {
  const [inputUrl, setInputUrl] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const t = translations[language] || translations.th;

  const isNewTabUrl = (url?: string) =>
    !url || url === 'bocchy://newtab' || url === 'nexus://newtab' || url === 'about:blank';

  useEffect(() => {
    if (!isFocused && activeTab) {
      if (isNewTabUrl(activeTab.url)) {
        setInputUrl('');
      } else {
        setInputUrl(activeTab.url);
      }
    }
  }, [activeTab?.url, isFocused]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      onNavigate(inputUrl.trim());
      (document.activeElement as HTMLElement)?.blur();
    }
  };

  const isHttps = activeTab?.url?.startsWith('https://');
  const isNewTab = isNewTabUrl(activeTab?.url);
  const adBlockEnabled = activeTab?.adBlockStats?.enabled ?? true;
  const blockedCount = activeTab?.adBlockStats?.blockedCount ?? 0;
  const currentZoomFactor = activeTab?.zoomFactor !== undefined ? activeTab.zoomFactor : 1.0;
  const zoomPercent = Math.round(currentZoomFactor * 100);

  return (
    <div className="flex items-center h-10 px-3 bg-gradient-to-r from-[#170e1e]/95 via-[#140a18]/90 to-[#120816]/95 backdrop-blur-2xl border-b border-pink-500/15 space-x-2 select-none z-30 relative">
      {/* Navigation Controls */}
      <div className="flex items-center space-x-1">
        <button
          onClick={onBack}
          disabled={!activeTab?.canGoBack}
          className="p-1.5 rounded-xl text-pink-200/70 hover:text-white hover:bg-pink-500/20 disabled:opacity-20 disabled:hover:bg-transparent transition-all"
          title={t.back || 'Back'}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          onClick={onForward}
          disabled={!activeTab?.canGoForward}
          className="p-1.5 rounded-xl text-pink-200/70 hover:text-white hover:bg-pink-500/20 disabled:opacity-20 disabled:hover:bg-transparent transition-all"
          title={t.forward || 'Forward'}
        >
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={onReload}
          className="p-1.5 rounded-xl text-pink-200/70 hover:text-white hover:bg-pink-500/20 transition-all"
          title={t.reload || 'Reload'}
        >
          <RotateCw className={`w-3.5 h-3.5 ${activeTab?.isLoading ? 'animate-spin text-pink-400' : ''}`} />
        </button>
      </div>

      {/* Omnibox / Address Bar */}
      <form onSubmit={handleSubmit} className="flex-1">
        <div
          className={`flex items-center h-7.5 px-3.5 rounded-full border transition-all ${
            isFocused
              ? 'bg-[#1f1127]/90 border-pink-400 ring-2 ring-pink-500/30 shadow-[0_0_20px_rgba(244,114,182,0.3)]'
              : 'bg-[#180e20]/75 hover:bg-[#1c1126]/90 border-pink-500/25 hover:border-pink-400/50 shadow-sm'
          }`}
        >
          {isHttps ? (
            <Lock className="w-3.5 h-3.5 text-pink-400 mr-2 flex-shrink-0" />
          ) : (
            <Search className="w-3.5 h-3.5 text-pink-300/40 mr-2 flex-shrink-0" />
          )}

          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onFocus={(e) => {
              setIsFocused(true);
              e.target.select();
            }}
            onBlur={() => setIsFocused(false)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-transparent text-xs text-pink-50 placeholder-pink-300/40 focus:outline-none"
          />

          {/* Bookmark Star Button */}
          {!isNewTab && (
            <button
              type="button"
              onClick={onToggleBookmark}
              className={`p-1 rounded-full hover:bg-pink-500/25 transition-colors ml-1 ${
                isBookmarked ? 'text-amber-400' : 'text-pink-300/40 hover:text-amber-300'
              }`}
              title={isBookmarked ? t.removeBookmark : t.bookmarkThisPage}
            >
              <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400' : ''}`} />
            </button>
          )}
        </div>
      </form>

      {/* Action Buttons */}
      <div className="flex items-center space-x-1.5">
        {/* Page Zoom Inline Stepper (Never clips behind WebContentsView) */}
        <div className="flex items-center bg-[#1a0f24]/80 border border-pink-500/25 rounded-xl p-0.5 space-x-0.5 select-none shadow-sm">
          <button
            onClick={onZoomOut}
            className="w-5 h-5 flex items-center justify-center rounded-lg text-pink-300/70 hover:text-white hover:bg-pink-500/20 transition-all"
            title={t.zoomOut || 'Zoom Out (Ctrl + -)'}
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <button
            onClick={onResetZoom}
            className={`px-1.5 h-5 flex items-center justify-center rounded-lg font-mono text-[10px] font-bold transition-all ${
              zoomPercent !== 100
                ? 'bg-pink-500/30 text-pink-200 border border-pink-400/40'
                : 'text-pink-200/70 hover:text-white hover:bg-pink-500/15'
            }`}
            title={t.resetZoom || 'Reset to 100% (Ctrl + 0)'}
          >
            {zoomPercent}%
          </button>
          <button
            onClick={onZoomIn}
            className="w-5 h-5 flex items-center justify-center rounded-lg text-pink-300/70 hover:text-white hover:bg-pink-500/20 transition-all"
            title={t.zoomIn || 'Zoom In (Ctrl + +)'}
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>

        {/* Developer Mode Quick Button */}
        {devModeEnabled && (
          <button
            onClick={onToggleDevTools}
            className="p-1.5 rounded-xl text-xs font-medium bg-[#1e1128] text-amber-400 hover:bg-[#281635] hover:text-amber-300 transition-colors border border-amber-500/20 shadow-sm"
            title={t.openDevTools || 'Developer Tools (F12)'}
          >
            <Code2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Update Log / What's New Button */}
        <button
          onClick={onToggleUpdateLog}
          className="flex items-center space-x-1 px-2 py-1 rounded-xl text-xs font-medium bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 hover:from-pink-500/30 hover:to-purple-500/30 border border-pink-400/35 shadow-[0_0_12px_rgba(244,114,182,0.2)] transition-all"
          title={t.whatsNew || "What's New in v1.1.1"}
        >
          <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
          <span className="text-[10px] font-bold font-mono">v1.1.1</span>
        </button>

        {/* Force Dark Mode Quick Toggle */}
        <button
          onClick={onToggleForceDarkMode}
          className={`p-1.5 rounded-xl text-xs font-medium transition-colors ${
            forceDarkMode
              ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'bg-[#1b1022] text-pink-200/60 hover:text-amber-300 hover:bg-pink-500/20 border border-pink-500/15'
          }`}
          title={`${t.forceDarkMode}: ${forceDarkMode ? 'ON' : 'OFF'}`}
        >
          {forceDarkMode ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Bookmarks Bar Toggle */}
        <button
          onClick={onToggleBookmarksBar}
          className={`p-1.5 rounded-xl text-xs font-medium transition-colors ${
            showBookmarksBar
              ? 'bg-[#1e1128] text-amber-400 border border-amber-500/30 shadow-sm'
              : 'bg-[#1b1022] text-pink-200/60 hover:text-amber-400 hover:bg-pink-500/20 border border-pink-500/15'
          }`}
          title={showBookmarksBar ? t.hideBookmarksBar : t.showBookmarksBar}
        >
          <Bookmark className="w-3.5 h-3.5" />
        </button>

        {/* AdBlock Shield Button */}
        <button
          onClick={onToggleShield}
          className={`relative flex items-center px-2 py-1 rounded-xl text-xs font-medium transition-colors ${
            isShieldOpen
              ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-[0_0_12px_rgba(244,114,182,0.4)]'
              : adBlockEnabled
              ? 'bg-pink-950/40 text-pink-200 border border-pink-400/30 hover:bg-pink-900/40 shadow-sm'
              : 'bg-[#1b1022] text-pink-200/60 hover:bg-pink-500/20 border border-pink-500/15'
          }`}
          title={t.shieldTitle}
        >
          {adBlockEnabled ? (
            <Shield className="w-3.5 h-3.5 mr-1.5 text-pink-400" />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
          )}
          <span className="text-[11px] font-mono">{blockedCount}</span>
        </button>

        {/* Media Sniffer Button */}
        <button
          onClick={onToggleMediaDrawer}
          className={`relative flex items-center px-2.5 py-1 rounded-xl text-xs font-medium transition-colors ${
            isMediaDrawerOpen
              ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
              : mediaCount > 0
              ? 'bg-emerald-950/40 text-emerald-200 border border-emerald-400/30 hover:bg-emerald-900/40 shadow-sm'
              : 'bg-[#1b1022] text-pink-200/60 hover:bg-pink-500/20 border border-pink-500/15'
          }`}
          title={t.media}
        >
          <Film className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
          <span className="text-[11px]">{t.media}</span>
          {mediaCount > 0 && (
            <span className="ml-1.5 px-1 py-0.2 text-[10px] bg-emerald-500/25 text-emerald-200 rounded-full font-mono">
              {mediaCount}
            </span>
          )}
        </button>

        {/* Downloads Button */}
        <button
          onClick={onToggleDownloads}
          className={`relative flex items-center px-2 py-1 rounded-xl text-xs font-medium transition-colors ${
            isDownloadsOpen
              ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-[0_0_12px_rgba(244,114,182,0.4)]'
              : activeDownloadsCount > 0
              ? 'bg-pink-950/50 text-pink-200 border border-pink-400/40 shadow-sm'
              : 'bg-[#1b1022] text-pink-200/60 hover:text-pink-100 hover:bg-pink-500/20 border border-pink-500/15'
          }`}
          title={t.downloadsFlyoutTitle || 'Downloads'}
        >
          <Download className={`w-3.5 h-3.5 ${activeDownloadsCount > 0 ? 'animate-bounce text-pink-400' : ''}`} />
          {activeDownloadsCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.2 text-[10px] bg-pink-500/35 text-pink-100 rounded-full font-mono font-bold">
              {activeDownloadsCount}
            </span>
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={onToggleSettings}
          className={`p-1.5 rounded-xl text-xs font-medium transition-colors ${
            isSettingsOpen
              ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-[0_0_12px_rgba(244,114,182,0.4)]'
              : 'bg-[#1b1022] text-pink-200/60 hover:text-white hover:bg-pink-500/20 border border-pink-500/15'
          }`}
          title={t.settings}
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
