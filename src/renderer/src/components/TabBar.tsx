import React from 'react';
import type { TabInfo } from '../../types/browser';
import {
  Plus,
  X,
  Globe,
  Loader2,
  EyeOff,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface TabBarProps {
  tabs: TabInfo[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTab: () => void;
  onNewIncognitoTab: () => void;
  onRestoreClosedTab: () => void;
  canRestoreClosed: boolean;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onNewIncognitoTab,
  onRestoreClosedTab,
  canRestoreClosed,
}) => {
  const handleToggleMute = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    window.browserApi.toggleTabMute(tabId);
  };

  const handleVolumeChange = (tabId: string, value: number) => {
    window.browserApi.setTabVolume(tabId, value);
  };

  return (
    <div
      className="flex items-center h-10 px-2.5 bg-gradient-to-r from-[#170e1e]/95 via-[#140a18]/90 to-[#120816]/95 backdrop-blur-2xl select-none border-b border-pink-500/15"
      style={{ WebkitAppRegion: 'drag' } as any}
      onMouseDown={(e) => {
        if (e.button === 1 && e.target === e.currentTarget) {
          e.preventDefault();
          onNewTab();
        }
      }}
      onDoubleClick={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
          onNewTab();
        }
      }}
    >
      <div
        className="flex items-center space-x-1.5 flex-1 overflow-x-auto no-scrollbar pr-36"
        onMouseDown={(e) => {
          if (e.button === 1 && e.target === e.currentTarget) {
            e.preventDefault();
            onNewTab();
          }
        }}
        onDoubleClick={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            onNewTab();
          }
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const isIncognito = tab.isIncognito;
          const isSleeping = tab.isSleeping;
          const isPlayingAudio = Boolean(tab.isPlayingAudio);
          const isMuted = Boolean(tab.isMuted);
          const volume = tab.volume !== undefined ? tab.volume : 100;
          const hasAudioActivity = isPlayingAudio || isMuted;

          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              onMouseDown={(e) => {
                if (e.button === 1) {
                  // Middle-click closes the tab
                  e.preventDefault();
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }
              }}
              style={{ WebkitAppRegion: 'no-drag' } as any}
              className={`group relative flex items-center h-8 px-3 max-w-[220px] min-w-[130px] rounded-xl text-xs cursor-pointer transition-all duration-200 ${
                isSleeping ? 'opacity-60 hover:opacity-100' : ''
              } ${
                isIncognito
                  ? isActive
                    ? 'bg-gradient-to-r from-purple-900/40 to-pink-900/30 text-purple-200 border border-purple-400/40 shadow-[0_0_15px_rgba(168,85,247,0.25)] font-medium'
                    : 'text-purple-300/70 hover:bg-purple-950/30 hover:text-purple-100 border border-purple-500/20'
                  : isActive
                  ? 'bg-gradient-to-r from-pink-500/25 via-rose-500/20 to-pink-500/25 text-pink-50 border border-pink-400/45 shadow-[0_0_16px_rgba(244,114,182,0.25)] font-semibold'
                  : 'text-pink-200/60 hover:bg-pink-500/10 hover:text-pink-100 border border-transparent hover:border-pink-500/25'
              }`}
              title={
                isSleeping
                  ? `[💤 จำศีลประหยัด RAM] ${tab.title}\nคลิกเพื่อปลุกการทำงาน | คลิกเมาส์กลางเพื่อปิด`
                  : `${tab.title}\n(คลิกเมาส์กลางที่แท็บเพื่อปิด)`
              }
            >
              {/* Cute Active Sparkle Indicator */}
              {isActive && !isIncognito && (
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 shadow-[0_0_8px_#f472b6] mr-1.5 flex-shrink-0 animate-pulse" />
              )}

              {/* Favicon / Incognito / Loading / Sleep */}
              <div className="mr-2 flex-shrink-0 flex items-center justify-center w-4 h-4">
                {tab.isLoading ? (
                  <Loader2
                    className={`w-3.5 h-3.5 animate-spin ${
                      isIncognito ? 'text-purple-400' : 'text-pink-400'
                    }`}
                  />
                ) : isSleeping ? (
                  <span className="text-xs select-none">💤</span>
                ) : isIncognito ? (
                  <EyeOff className="w-3.5 h-3.5 text-purple-400" />
                ) : tab.favicon ? (
                  <img
                    src={tab.favicon}
                    alt=""
                    className="w-3.5 h-3.5 rounded-md object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Globe className="w-3.5 h-3.5 text-pink-400/60" />
                )}
              </div>

              {/* Title */}
              <span className={`truncate flex-1 font-medium ${isSleeping ? 'italic text-pink-300/40' : ''}`}>
                {tab.title || (tab.isLoading ? 'Loading...' : isIncognito ? 'Incognito' : 'New Tab')}
              </span>

              {/* Per-Tab Audio Indicator with Scroll Wheel Volume & Click Mute */}
              {hasAudioActivity && (
                <button
                  type="button"
                  onClick={(e) => handleToggleMute(e, tab.id)}
                  onWheel={(e) => {
                    e.stopPropagation();
                    const delta = e.deltaY < 0 ? 5 : -5;
                    handleVolumeChange(tab.id, Math.max(0, Math.min(100, volume + delta)));
                  }}
                  className={`ml-1 px-1.5 py-0.5 rounded-lg transition-all flex items-center justify-center space-x-1 flex-shrink-0 ${
                    isMuted
                      ? 'bg-rose-500/25 text-rose-300 hover:bg-rose-500/35 border border-rose-500/40 shadow-sm'
                      : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/35'
                  }`}
                  title={
                    isMuted
                      ? 'แท็บนี้ถูกปิดเสียง (คลิกเพื่อเปิดเสียง / เลื่อนล้อเมาส์เพื่อปรับระดับเสียง)'
                      : `กำลังเล่นเสียง [${volume}%] (คลิกเพื่อ Mute / หมุนล้อเมาส์เพื่อปรับเสียง 0-100%)`
                  }
                >
                  {isMuted ? (
                    <VolumeX className="w-3 h-3 text-rose-400" />
                  ) : (
                    <Volume2 className="w-3 h-3 animate-pulse text-emerald-400" />
                  )}
                  <span className="text-[10px] font-mono font-bold leading-none">
                    {isMuted ? 'Mute' : `${volume}%`}
                  </span>
                </button>
              )}

              {/* Close Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className={`ml-1.5 p-0.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-pink-500/30 hover:text-white text-pink-300/60 transition-all ${
                  isActive ? 'opacity-80' : ''
                }`}
                title="Close Tab (หรือคลิกเมาส์กลางที่แท็บ)"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* Action Controls: New Tab, Incognito Tab, Restore Closed Tab */}
        <div className="flex items-center space-x-1 ml-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
          {/* New Normal Tab */}
          <button
            onClick={onNewTab}
            className="p-1.5 rounded-xl text-pink-300 hover:text-pink-50 hover:bg-pink-500/20 hover:border-pink-400/30 border border-transparent transition-all shadow-sm"
            title="Open New Tab (Ctrl+T)"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* New Incognito Tab */}
          <button
            onClick={onNewIncognitoTab}
            className="p-1.5 rounded-xl text-purple-300/80 hover:text-purple-100 hover:bg-purple-500/20 hover:border-purple-400/30 border border-transparent transition-all shadow-sm"
            title="New Incognito Tab (Ctrl+Shift+N)"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>

          {/* Reopen Closed Tab */}
          <button
            onClick={onRestoreClosedTab}
            disabled={!canRestoreClosed}
            className="p-1.5 rounded-xl text-emerald-300/80 hover:text-emerald-100 hover:bg-emerald-500/20 hover:border-emerald-400/30 border border-transparent disabled:opacity-20 disabled:hover:bg-transparent transition-all"
            title={canRestoreClosed ? 'Reopen Closed Tab (Ctrl+Shift+T)' : 'No recently closed tabs'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
