import React, { useState, useRef, useEffect } from 'react';
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
  Volume1,
  Sliders,
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
  const [volumePopoverTabId, setVolumePopoverTabId] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Close volume popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setVolumePopoverTabId(null);
      }
    };
    if (volumePopoverTabId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [volumePopoverTabId]);

  const handleToggleMute = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    window.browserApi.toggleTabMute(tabId);
  };

  const handleOpenVolumePopover = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    e.preventDefault();
    setVolumePopoverTabId(volumePopoverTabId === tabId ? null : tabId);
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
          const isPopoverOpen = volumePopoverTabId === tab.id;

          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              onContextMenu={(e) => handleOpenVolumePopover(e, tab.id)}
              style={{ WebkitAppRegion: 'no-drag' } as any}
              className={`group relative flex items-center h-8 px-3 max-w-[210px] min-w-[125px] rounded-lg text-xs cursor-pointer transition-all duration-150 ${
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

              {/* Per-Tab Audio Indicator & Mute Button */}
              {hasAudioActivity && (
                <button
                  type="button"
                  onClick={(e) => handleToggleMute(e, tab.id)}
                  onContextMenu={(e) => handleOpenVolumePopover(e, tab.id)}
                  className={`ml-1 p-1 rounded-md transition-all flex items-center justify-center flex-shrink-0 ${
                    isMuted
                      ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 ring-1 ring-rose-500/40'
                      : 'text-emerald-400 hover:bg-[#32323e]'
                  }`}
                  title={
                    isMuted
                      ? 'แท็บนี้ถูกปิดเสียง (คลิกเพื่อเปิดเสียง / คลิกขวาเพื่อปรับระดับเสียง)'
                      : `กำลังเล่นเสียง [${volume}%] (คลิกเพื่อปิดเสียง / คลิกขวาเพื่อปรับระดับเสียง)`
                  }
                >
                  {isMuted ? (
                    <VolumeX className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                  )}
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

              {/* Tab Volume Slider Popover */}
              {isPopoverOpen && (
                <div
                  ref={popoverRef}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-10 left-0 z-50 w-56 p-3 bg-[#191920] border border-[#2f2f3d] rounded-xl shadow-2xl shadow-black/80 animate-in fade-in duration-150"
                  style={{ WebkitAppRegion: 'no-drag' } as any}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#282834]">
                    <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-gray-200">
                      <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                      <span>ระดับเสียงแท็บ</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-indigo-300">
                      {isMuted ? 'Muted' : `${volume}%`}
                    </span>
                  </div>

                  {/* Slider Control */}
                  <div className="py-3 space-y-2">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={(e) => handleToggleMute(e, tab.id)}
                        className={`p-1 rounded-md transition-colors ${
                          isMuted ? 'text-rose-400 bg-rose-500/20' : 'text-gray-400 hover:text-white'
                        }`}
                        title={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume1 className="w-4 h-4" />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => handleVolumeChange(tab.id, Number(e.target.value))}
                        className="w-full accent-indigo-500 h-1.5 bg-[#2a2a38] rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex items-center justify-between pt-1 text-[10px] text-gray-400 font-medium">
                      <button
                        type="button"
                        onClick={() => {
                          if (!isMuted) window.browserApi.toggleTabMute(tab.id);
                        }}
                        className="px-2 py-0.5 rounded bg-[#242430] hover:bg-[#323242] hover:text-white transition-colors"
                      >
                        Mute
                      </button>
                      <button
                        type="button"
                        onClick={() => handleVolumeChange(tab.id, 50)}
                        className="px-2 py-0.5 rounded bg-[#242430] hover:bg-[#323242] hover:text-white transition-colors"
                      >
                        50%
                      </button>
                      <button
                        type="button"
                        onClick={() => handleVolumeChange(tab.id, 100)}
                        className="px-2 py-0.5 rounded bg-[#242430] hover:bg-[#323242] hover:text-white transition-colors"
                      >
                        100%
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
