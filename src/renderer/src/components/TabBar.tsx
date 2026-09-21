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
  Settings,
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
      className="flex items-end h-11 px-2 bg-[#ff6599] select-none border-b border-pink-400/30"
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
        className="flex items-end space-x-1 flex-1 overflow-x-auto no-scrollbar pr-36 h-full"
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
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTabId;
          const isIncognito = tab.isIncognito;
          const isSleeping = tab.isSleeping;
          const isPlayingAudio = Boolean(tab.isPlayingAudio);
          const isMuted = Boolean(tab.isMuted);
          const volume = tab.volume !== undefined ? tab.volume : 100;
          const hasAudioActivity = isPlayingAudio || isMuted;

          const nextTab = tabs[index + 1];
          const isNextActive = nextTab && nextTab.id === activeTabId;
          const showDivider = !isActive && !isNextActive && index < tabs.length - 1;

          return (
            <React.Fragment key={tab.id}>
              <div
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
                className={`group relative flex items-center px-3 max-w-[240px] min-w-[130px] text-xs cursor-pointer transition-all duration-150 ${
                  isSleeping ? 'opacity-70 hover:opacity-100' : ''
                } ${
                  isActive
                    ? 'h-[36px] bg-white text-slate-800 font-semibold rounded-t-lg shadow-[0_-1px_3px_rgba(0,0,0,0.08)] z-10'
                    : 'h-[32px] mb-1 bg-transparent hover:bg-white/20 text-white font-medium rounded-md'
                }`}
                title={
                  isSleeping
                    ? `[💤 จำศีลประหยัด RAM] ${tab.title}\nคลิกเพื่อปลุกการทำงาน | คลิกเมาส์กลางเพื่อปิด`
                    : `${tab.title}\n(คลิกเมาส์กลางที่แท็บเพื่อปิด)`
                }
              >
                {/* Favicon / Incognito / Loading / Sleep */}
                <div className="mr-2 flex-shrink-0 flex items-center justify-center w-4 h-4">
                  {tab.isLoading ? (
                    <Loader2
                      className={`w-3.5 h-3.5 animate-spin ${
                        isActive ? 'text-pink-500' : 'text-white'
                      }`}
                    />
                  ) : isSleeping ? (
                    <span className="text-xs select-none">💤</span>
                  ) : isIncognito ? (
                    <EyeOff className={`w-3.5 h-3.5 ${isActive ? 'text-purple-600' : 'text-white/90'}`} />
                  ) : tab.url?.includes('settings') ? (
                    <Settings className={`w-3.5 h-3.5 ${isActive ? 'text-pink-600' : 'text-white/90'}`} />
                  ) : tab.favicon ? (
                    <img
                      src={tab.favicon}
                      alt=""
                      className="w-3.5 h-3.5 rounded-sm object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Globe className={`w-3.5 h-3.5 ${isActive ? 'text-pink-500/70' : 'text-white/80'}`} />
                  )}
                </div>

                {/* Title */}
                <span className={`truncate flex-1 ${isSleeping ? 'italic opacity-60' : ''}`}>
                  {tab.title || (tab.isLoading ? 'Loading...' : isIncognito ? 'Incognito' : 'New Tab')}
                </span>

                {/* Per-Tab Audio Indicator */}
                {hasAudioActivity && (
                  <button
                    type="button"
                    onClick={(e) => handleToggleMute(e, tab.id)}
                    onWheel={(e) => {
                      e.stopPropagation();
                      const delta = e.deltaY < 0 ? 5 : -5;
                      handleVolumeChange(tab.id, Math.max(0, Math.min(100, volume + delta)));
                    }}
                    className={`ml-1 px-1.5 py-0.5 rounded transition-all flex items-center justify-center space-x-1 flex-shrink-0 ${
                      isActive
                        ? isMuted
                          ? 'bg-rose-100 text-rose-600 border border-rose-200'
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : isMuted
                        ? 'bg-black/30 text-rose-200'
                        : 'bg-black/20 text-emerald-200'
                    }`}
                    title={
                      isMuted
                        ? 'แท็บนี้ถูกปิดเสียง (คลิกเพื่อเปิดเสียง / เลื่อนล้อเมาส์เพื่อปรับระดับเสียง)'
                        : `กำลังเล่นเสียง [${volume}%] (คลิกเพื่อ Mute / หมุนล้อเมาส์เพื่อปรับเสียง 0-100%)`
                    }
                  >
                    {isMuted ? (
                      <VolumeX className="w-3 h-3" />
                    ) : (
                      <Volume2 className="w-3 h-3 animate-pulse" />
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
                  className={`ml-1.5 p-1 rounded transition-colors ${
                    isActive
                      ? 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                      : 'text-white/60 hover:text-white hover:bg-white/20'
                  }`}
                  title="Close Tab (หรือคลิกเมาส์กลางที่แท็บ)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Vertical subtle divider between inactive tabs */}
              {showDivider && (
                <div className="w-[1px] h-3.5 bg-white/25 self-center mb-1 flex-shrink-0" />
              )}
            </React.Fragment>
          );
        })}

        {/* Action Controls: New Tab (+), Incognito Tab, Restore Closed Tab */}
        <div className="flex items-center space-x-0.5 ml-1 mb-1.5" style={{ WebkitAppRegion: 'no-drag' } as any}>
          {/* New Normal Tab */}
          <button
            onClick={onNewTab}
            className="w-7 h-7 rounded-md text-white hover:bg-white/20 flex items-center justify-center transition-colors"
            title="Open New Tab (Ctrl+T)"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* New Incognito Tab */}
          <button
            onClick={onNewIncognitoTab}
            className="w-7 h-7 rounded-md text-white/80 hover:text-white hover:bg-white/20 flex items-center justify-center transition-colors"
            title="New Incognito Tab (Ctrl+Shift+N)"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>

          {/* Reopen Closed Tab */}
          <button
            onClick={onRestoreClosedTab}
            disabled={!canRestoreClosed}
            className="w-7 h-7 rounded-md text-white/80 hover:text-white hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center transition-colors"
            title={canRestoreClosed ? 'Reopen Closed Tab (Ctrl+Shift+T)' : 'No recently closed tabs'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
