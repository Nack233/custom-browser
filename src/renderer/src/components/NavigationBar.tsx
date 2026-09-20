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
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const zoomRef = useRef<HTMLDivElement | null>(null);

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

  // Close zoom popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (zoomRef.current && !zoomRef.current.contains(e.target as Node)) {
        setIsZoomOpen(false);
      }
    };
    if (isZoomOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isZoomOpen]);

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
    <div className="flex items-center h-10 px-3 bg-[#18181c] border-b border-[#25252b] space-x-2 select-none z-30 relative">
      {/* Navigation Controls */}
      <div className="flex items-center space-x-1">
        <button
          onClick={onBack}
          disabled={!activeTab?.canGoBack}
          className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#25252d] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title={t.back || 'Back'}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          onClick={onForward}
          disabled={!activeTab?.canGoForward}
          className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#25252d] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title={t.forward || 'Forward'}
        >
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={onReload}
          className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#25252d] transition-colors"
          title={t.reload || 'Reload'}
        >
          <RotateCw className={`w-3.5 h-3.5 ${activeTab?.isLoading ? 'animate-spin text-indigo-400' : ''}`} />
        </button>
      </div>

      {/* Omnibox / Address Bar */}
      <form onSubmit={handleSubmit} className="flex-1">
        <div
          className={`flex items-center h-7 px-3 bg-[#111114] rounded-md border transition-all ${
            isFocused
              ? 'border-indigo-500 ring-1 ring-indigo-500/20'
              : 'border-[#2a2a32] hover:border-[#383844]'
          }`}
        >
          {isHttps ? (
            <Lock className="w-3 h-3 text-emerald-400 mr-2 flex-shrink-0" />
          ) : (
            <Search className="w-3 h-3 text-gray-500 mr-2 flex-shrink-0" />
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
            className="w-full bg-transparent text-xs text-gray-100 placeholder-gray-500 focus:outline-none"
          />

          {/* Bookmark Star Button */}
          {!isNewTab && (
            <button
              type="button"
              onClick={onToggleBookmark}
              className={`p-1 rounded hover:bg-[#252530] transition-colors ml-1 ${
                isBookmarked ? 'text-amber-400' : 'text-gray-500 hover:text-amber-300'
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
        {/* Page Zoom Control Button */}
        <div className="relative" ref={zoomRef}>
          <button
            onClick={() => setIsZoomOpen(!isZoomOpen)}
            className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-mono font-medium transition-all ${
              zoomPercent !== 100
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                : 'bg-[#22222a] text-gray-400 hover:text-gray-200 hover:bg-[#2c2c36]'
            }`}
            title={`${t.zoom || 'Zoom'}: ${zoomPercent}%`}
          >
            <ZoomIn className="w-3 h-3 text-blue-400" />
            <span className="text-[11px]">{zoomPercent}%</span>
          </button>

          {/* Zoom Popover */}
          {isZoomOpen && (
            <div className="absolute right-0 top-9 z-50 w-56 p-3 bg-[#191920] border border-[#2e2e3d] rounded-xl shadow-2xl shadow-black/80 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-[#292938]">
                <span className="text-xs font-semibold text-gray-200">{t.zoom || 'Page Zoom'}</span>
                <span className="font-mono text-xs font-bold text-blue-400">{zoomPercent}%</span>
              </div>

              <div className="flex items-center justify-center space-x-3 py-3">
                <button
                  onClick={onZoomOut}
                  className="p-1.5 rounded-lg bg-[#242432] hover:bg-[#323244] text-gray-300 hover:text-white transition-colors"
                  title={t.zoomOut || 'Zoom Out'}
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <button
                  onClick={onResetZoom}
                  className="px-3 py-1 rounded-lg bg-[#262638] hover:bg-[#34344d] text-xs font-mono font-bold text-gray-200 transition-colors"
                  title={t.resetZoom || 'Reset 100%'}
                >
                  100%
                </button>

                <button
                  onClick={onZoomIn}
                  className="p-1.5 rounded-lg bg-[#242432] hover:bg-[#323244] text-gray-300 hover:text-white transition-colors"
                  title={t.zoomIn || 'Zoom In'}
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              {/* Preset Buttons */}
              <div className="grid grid-cols-4 gap-1 pt-1 border-t border-[#262635] text-[10px] font-mono">
                {[50, 75, 125, 150].map((level) => (
                  <button
                    key={level}
                    onClick={() => onSetZoom(level / 100)}
                    className={`py-1 rounded text-center transition-colors ${
                      zoomPercent === level
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-[#22222d] text-gray-400 hover:bg-[#2d2d3d] hover:text-gray-200'
                    }`}
                  >
                    {level}%
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Developer Mode Quick Button */}
        {devModeEnabled && (
          <button
            onClick={onToggleDevTools}
            className="p-1.5 rounded-md text-xs font-medium bg-[#22222a] text-amber-400 hover:bg-[#2d2d38] hover:text-amber-300 transition-colors border border-amber-500/20"
            title={t.openDevTools || 'Developer Tools (F12)'}
          >
            <Code2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Update Log / What's New Button */}
        <button
          onClick={onToggleUpdateLog}
          className="flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 hover:from-pink-500/30 hover:to-purple-500/30 border border-pink-500/30 shadow-sm transition-all"
          title={t.whatsNew || "What's New in v1.1.0"}
        >
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span className="text-[10px] font-bold font-mono">v1.1.0</span>
        </button>

        {/* Force Dark Mode Quick Toggle */}
        <button
          onClick={onToggleForceDarkMode}
          className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
            forceDarkMode
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'bg-[#22222a] text-gray-400 hover:text-amber-300 hover:bg-[#2c2c36]'
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
          className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
            showBookmarksBar
              ? 'bg-[#252532] text-amber-400 border border-amber-500/30'
              : 'bg-[#22222a] text-gray-400 hover:text-amber-400 hover:bg-[#2c2c36]'
          }`}
          title={showBookmarksBar ? t.hideBookmarksBar : t.showBookmarksBar}
        >
          <Bookmark className="w-3.5 h-3.5" />
        </button>

        {/* AdBlock Shield Button */}
        <button
          onClick={onToggleShield}
          className={`relative flex items-center px-2 py-1 rounded-md text-xs font-medium transition-colors ${
            isShieldOpen
              ? 'bg-indigo-600 text-white'
              : adBlockEnabled
              ? 'bg-[#22222a] text-indigo-300 hover:bg-[#2c2c36]'
              : 'bg-[#22222a] text-gray-400 hover:bg-[#2c2c36]'
          }`}
          title={t.shieldTitle}
        >
          {adBlockEnabled ? (
            <Shield className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
          )}
          <span className="text-[11px] font-mono">{blockedCount}</span>
        </button>

        {/* Media Sniffer Button */}
        <button
          onClick={onToggleMediaDrawer}
          className={`relative flex items-center px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            isMediaDrawerOpen
              ? 'bg-emerald-600 text-white'
              : mediaCount > 0
              ? 'bg-[#1b2620] text-emerald-300 border border-emerald-500/30 hover:bg-[#23332a]'
              : 'bg-[#22222a] text-gray-400 hover:bg-[#2c2c36]'
          }`}
          title={t.media}
        >
          <Film className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
          <span className="text-[11px]">{t.media}</span>
          {mediaCount > 0 && (
            <span className="ml-1.5 px-1 py-0.2 text-[10px] bg-emerald-500/20 text-emerald-300 rounded font-mono">
              {mediaCount}
            </span>
          )}
        </button>

        {/* Downloads Button */}
        <button
          onClick={onToggleDownloads}
          className={`relative flex items-center px-2 py-1 rounded-md text-xs font-medium transition-colors ${
            isDownloadsOpen
              ? 'bg-blue-600 text-white shadow-sm'
              : activeDownloadsCount > 0
              ? 'bg-[#1a2332] text-blue-300 border border-blue-500/40 shadow-sm'
              : 'bg-[#22222a] text-gray-400 hover:text-blue-300 hover:bg-[#2c2c36]'
          }`}
          title={t.downloadsFlyoutTitle || 'Downloads'}
        >
          <Download className={`w-3.5 h-3.5 ${activeDownloadsCount > 0 ? 'animate-bounce text-blue-400' : ''}`} />
          {activeDownloadsCount > 0 && (
            <span className="ml-1.5 px-1 py-0.2 text-[10px] bg-blue-500/30 text-blue-200 rounded-full font-mono font-bold">
              {activeDownloadsCount}
            </span>
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={onToggleSettings}
          className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
            isSettingsOpen
              ? 'bg-blue-600 text-white'
              : 'bg-[#22222a] text-gray-400 hover:text-white hover:bg-[#2c2c36]'
          }`}
          title={t.settings}
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
