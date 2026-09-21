import React, { useState, useEffect } from 'react';
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
  onSetZoom: _onSetZoom,
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
    <div className="flex items-center h-12 px-3 bg-[#fff0f6] border-b border-[#fbcfe8] space-x-2 select-none z-30 relative shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {/* Navigation Controls */}
      <div className="flex items-center space-x-1">
        <button
          onClick={onBack}
          disabled={!activeTab?.canGoBack}
          className="w-8 h-8 rounded-full text-gray-700 hover:text-black hover:bg-pink-200/60 disabled:opacity-25 disabled:hover:bg-transparent flex items-center justify-center transition-colors"
          title={t.back || 'Back'}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          onClick={onForward}
          disabled={!activeTab?.canGoForward}
          className="w-8 h-8 rounded-full text-gray-700 hover:text-black hover:bg-pink-200/60 disabled:opacity-25 disabled:hover:bg-transparent flex items-center justify-center transition-colors"
          title={t.forward || 'Forward'}
        >
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={onReload}
          className="w-8 h-8 rounded-full text-gray-700 hover:text-black hover:bg-pink-200/60 flex items-center justify-center transition-colors"
          title={t.reload || 'Reload'}
        >
          <RotateCw className={`w-3.5 h-3.5 ${activeTab?.isLoading ? 'animate-spin text-pink-600' : ''}`} />
        </button>
      </div>

      {/* Omnibox / Address Bar */}
      <form onSubmit={handleSubmit} className="flex-1">
        <div
          className={`flex items-center h-9 px-3.5 rounded-full border bg-white shadow-xs transition-all ${
            isFocused
              ? 'border-pink-400 ring-2 ring-pink-200 shadow-sm'
              : 'border-[#fbcfe8] hover:border-pink-300'
          }`}
        >
          {isHttps ? (
            <Lock className="w-3.5 h-3.5 text-gray-500 mr-2 flex-shrink-0" />
          ) : (
            <Search className="w-3.5 h-3.5 text-gray-400 mr-2 flex-shrink-0" />
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
            className="w-full bg-transparent text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none font-normal"
          />

          {/* Bookmark Star Button */}
          {!isNewTab && (
            <button
              type="button"
              onClick={onToggleBookmark}
              className={`p-1 rounded-full hover:bg-pink-50 transition-colors ml-1 ${
                isBookmarked ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'
              }`}
              title={isBookmarked ? t.removeBookmark : t.bookmarkThisPage}
            >
              <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-500' : ''}`} />
            </button>
          )}
        </div>
      </form>

      {/* Action Buttons */}
      <div className="flex items-center space-x-1.5">
        {/* Page Zoom Inline Stepper */}
        <div className="flex items-center bg-white border border-pink-200 rounded-full px-1.5 py-0.5 space-x-0.5 select-none shadow-xs">
          <button
            onClick={onZoomOut}
            className="w-5 h-5 flex items-center justify-center rounded-full text-gray-650 hover:text-pink-600 hover:bg-pink-100 transition-colors"
            title={t.zoomOut || 'Zoom Out (Ctrl + -)'}
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <button
            onClick={onResetZoom}
            className={`px-1.5 h-5 flex items-center justify-center rounded font-mono text-[10px] font-bold transition-colors ${
              zoomPercent !== 100
                ? 'bg-pink-100 text-pink-700'
                : 'text-gray-700 hover:text-pink-600'
            }`}
            title={t.resetZoom || 'Reset to 100% (Ctrl + 0)'}
          >
            {zoomPercent}%
          </button>
          <button
            onClick={onZoomIn}
            className="w-5 h-5 flex items-center justify-center rounded-full text-gray-650 hover:text-pink-600 hover:bg-pink-100 transition-colors"
            title={t.zoomIn || 'Zoom In (Ctrl + +)'}
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>

        {/* Developer Mode Quick Button */}
        {devModeEnabled && (
          <button
            onClick={onToggleDevTools}
            className="w-8 h-8 rounded-full bg-white border border-amber-200 text-amber-600 hover:bg-amber-50 flex items-center justify-center shadow-xs transition-colors"
            title={t.openDevTools || 'Developer Tools (F12)'}
          >
            <Code2 className="w-4 h-4" />
          </button>
        )}

        {/* Update Log / What's New Button */}
        <button
          onClick={onToggleUpdateLog}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#fa5c8d] hover:bg-[#f4477c] text-white shadow-xs transition-all"
          title={t.whatsNew || "What's New in v1.1.1"}
        >
          <Sparkles className="w-3.5 h-3.5 text-pink-100 animate-pulse" />
          <span className="text-[10px] font-mono">v1.1.1</span>
        </button>

        {/* Force Dark Mode Quick Toggle */}
        <button
          onClick={onToggleForceDarkMode}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            forceDarkMode
              ? 'bg-amber-100 text-amber-700 border border-amber-300 shadow-xs'
              : 'text-gray-650 hover:text-gray-950 hover:bg-pink-200/60'
          }`}
          title={`${t.forceDarkMode}: ${forceDarkMode ? 'ON' : 'OFF'}`}
        >
          {forceDarkMode ? (
            <Sun className="w-4 h-4 text-amber-600" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>

        {/* Bookmarks Bar Toggle */}
        <button
          onClick={onToggleBookmarksBar}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            showBookmarksBar
              ? 'bg-pink-200 text-pink-800'
              : 'text-gray-650 hover:text-gray-950 hover:bg-pink-200/60'
          }`}
          title={showBookmarksBar ? t.hideBookmarksBar : t.showBookmarksBar}
        >
          <Bookmark className="w-4 h-4" />
        </button>

        {/* AdBlock Shield Button */}
        <button
          onClick={onToggleShield}
          className={`relative flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors shadow-xs ${
            isShieldOpen
              ? 'bg-[#fa5c8d] text-white'
              : adBlockEnabled
              ? 'bg-white border border-pink-200 hover:bg-pink-50 text-pink-700'
              : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
          }`}
          title={t.shieldTitle}
        >
          {adBlockEnabled ? (
            <Shield className="w-3.5 h-3.5 mr-1 text-pink-600" />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5 mr-1 text-amber-500" />
          )}
          <span className="text-[11px] font-mono font-semibold">{blockedCount}</span>
        </button>

        {/* Media Sniffer Button */}
        <button
          onClick={onToggleMediaDrawer}
          className={`relative flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors shadow-xs ${
            isMediaDrawerOpen
              ? 'bg-emerald-600 text-white'
              : mediaCount > 0
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100'
              : 'bg-white border border-pink-200 text-gray-650 hover:bg-pink-50'
          }`}
          title={t.media}
        >
          <Film className="w-3.5 h-3.5 mr-1 text-emerald-600" />
          <span className="text-[11px] font-medium">{t.media}</span>
          {mediaCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.2 text-[10px] bg-emerald-600 text-white rounded-full font-mono font-bold">
              {mediaCount}
            </span>
          )}
        </button>

        {/* Downloads Button */}
        <button
          onClick={onToggleDownloads}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors relative ${
            isDownloadsOpen
              ? 'bg-[#fa5c8d] text-white shadow-xs'
              : activeDownloadsCount > 0
              ? 'bg-pink-100 text-pink-700 border border-pink-300'
              : 'text-gray-650 hover:text-gray-950 hover:bg-pink-200/60'
          }`}
          title={t.downloadsFlyoutTitle || 'Downloads'}
        >
          <Download className={`w-4 h-4 ${activeDownloadsCount > 0 ? 'animate-bounce text-pink-600' : ''}`} />
          {activeDownloadsCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[9px] bg-pink-600 text-white rounded-full font-mono font-bold">
              {activeDownloadsCount}
            </span>
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={onToggleSettings}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            isSettingsOpen
              ? 'bg-[#fa5c8d] text-white shadow-xs'
              : 'text-gray-650 hover:text-gray-950 hover:bg-pink-200/60'
          }`}
          title={t.settings}
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
