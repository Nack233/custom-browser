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
      className="flex items-center h-10 px-2 bg-[#121214] select-none border-b border-[#222226]"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      <div className="flex items-center space-x-1 flex-1 overflow-x-auto no-scrollbar pr-36">
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
              style={{ WebkitAppRegion: 'no-drag' } as any}
              className={`group relative flex items-center h-8 px-3 max-w-[220px] min-w-[130px] rounded-lg text-xs cursor-pointer transition-all duration-150 ${
                isSleeping ? 'opacity-60 hover:opacity-100' : ''
              } ${
                isIncognito
                  ? isActive
                    ? 'bg-[#261e38] text-purple-200 border border-purple-500/40 shadow-sm font-medium'
                    : 'text-purple-300/70 hover:bg-[#1f182d] hover:text-purple-200 border border-purple-500/20'
                  : isActive
                  ? 'bg-[#222228] text-white font-medium shadow-sm'
                  : 'text-gray-400 hover:bg-[#1a1a20] hover:text-gray-200'
              }`}
              title={
                isSleeping
                  ? `[💤 จำศีลประหยัด RAM] ${tab.title}\nคลิกเพื่อปลุกการทำงาน`
                  : tab.title
              }
            >
              {/* Favicon / Incognito / Loading / Sleep */}
              <div className="mr-2 flex-shrink-0 flex items-center justify-center w-4 h-4">
                {tab.isLoading ? (
                  <Loader2
                    className={`w-3.5 h-3.5 animate-spin ${
                      isIncognito ? 'text-purple-400' : 'text-indigo-400'
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
                    className="w-3.5 h-3.5 rounded-sm object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Globe className="w-3.5 h-3.5 opacity-60" />
                )}
              </div>

              {/* Title */}
              <span className={`truncate flex-1 ${isSleeping ? 'italic text-gray-400' : ''}`}>
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
                  className={`ml-1 px-1.5 py-0.5 rounded-md transition-all flex items-center justify-center space-x-1 flex-shrink-0 ${
                    isMuted
                      ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 ring-1 ring-rose-500/40'
                      : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'
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
                className={`ml-1 p-0.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-[#32323c] transition-opacity ${
                  isActive ? 'opacity-70' : ''
                }`}
                title="Close Tab"
              >
                <X className="w-3 h-3 text-gray-400 hover:text-white" />
              </button>
            </div>
          );
        })}

        {/* Action Controls: New Tab, Incognito Tab, Restore Closed Tab */}
        <div className="flex items-center space-x-0.5 ml-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
          {/* New Normal Tab */}
          <button
            onClick={onNewTab}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1f1f26] transition-colors"
            title="Open New Tab (Ctrl+T)"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* New Incognito Tab */}
          <button
            onClick={onNewIncognitoTab}
            className="p-1.5 rounded-lg text-purple-400/80 hover:text-purple-200 hover:bg-[#281b3d] transition-colors"
            title="New Incognito Tab (Ctrl+Shift+N)"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>

          {/* Reopen Closed Tab */}
          <button
            onClick={onRestoreClosedTab}
            disabled={!canRestoreClosed}
            className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-300 hover:bg-[#1f2622] disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
            title={canRestoreClosed ? 'Reopen Closed Tab (Ctrl+Shift+T)' : 'No recently closed tabs'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
