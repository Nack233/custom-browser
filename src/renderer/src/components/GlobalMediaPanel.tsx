import React, { useState, useEffect } from 'react';
import type { TabInfo } from '../../types/browser';
import type { Language } from '../i18n';
import { translations } from '../i18n';
import {
  Music,
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  ExternalLink,
  Sliders,
  Sparkles,
  Radio,
  Tv,
} from 'lucide-react';

interface GlobalMediaPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tabs: TabInfo[];
  activeTabId: string;
  onSwitchTab: (tabId: string) => void;
  onCloseTab?: (tabId: string) => void;
  language: Language;
  topOffset?: number;
}

export const GlobalMediaPanel: React.FC<GlobalMediaPanelProps> = ({
  isOpen,
  onClose,
  tabs,
  activeTabId,
  onSwitchTab,
  language,
  topOffset = 92,
}) => {
  const [localVolumes, setLocalVolumes] = useState<Record<string, number>>({});
  const isTh = language === 'th';
  const t = translations[language];

  // Sync tab volumes to local state for responsive slider dragging
  useEffect(() => {
    const volMap: Record<string, number> = {};
    tabs.forEach((tab) => {
      volMap[tab.id] = tab.volume !== undefined ? tab.volume : 100;
    });
    setLocalVolumes((prev) => ({ ...volMap, ...prev }));
  }, [tabs]);

  if (!isOpen) return null;

  // Filter tabs: tabs playing audio or having active audio activity
  const playingTabs = tabs.filter((t) => t.isPlayingAudio);

  // Eligible tabs for mixer: all tabs with real URLs, or active tabs
  const isNewTabUrl = (url?: string) => !url || url === 'bocchy://newtab' || url === 'about:blank';
  const mixerTabs = tabs.filter((t) => !isNewTabUrl(t.url) || t.isPlayingAudio || t.isMuted);
  const displayMixerTabs = mixerTabs.length > 0 ? mixerTabs : tabs;

  const anyPlaying = playingTabs.length > 0;
  const allMuted = tabs.length > 0 && tabs.every((t) => t.isMuted);

  const handleTogglePlay = async (tabId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    await window.browserApi.toggleMediaPlayback(tabId);
  };

  const handleToggleMute = async (tabId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    await window.browserApi.toggleTabMute(tabId);
  };

  const handleVolumeChange = (tabId: string, value: number) => {
    setLocalVolumes((prev) => ({ ...prev, [tabId]: value }));
    window.browserApi.setTabVolume(tabId, value);
  };

  const handleToggleMuteAll = async () => {
    if (allMuted) {
      await window.browserApi.unmuteAllAudio();
    } else {
      await window.browserApi.muteAllAudio();
    }
  };

  const handlePauseAll = async () => {
    await window.browserApi.pauseAllMedia();
  };

  // Helper to extract clean domain/site name
  const getSiteName = (tab: TabInfo) => {
    if (tab.title) {
      if (tab.title.toLowerCase().includes('youtube')) return 'YouTube';
      if (tab.title.toLowerCase().includes('spotify')) return 'Spotify';
      if (tab.title.toLowerCase().includes('discord')) return 'Discord';
      if (tab.title.toLowerCase().includes('twitch')) return 'Twitch';
      if (tab.title.toLowerCase().includes('soundcloud')) return 'SoundCloud';
      if (tab.title.toLowerCase().includes('netflix')) return 'Netflix';
    }
    try {
      if (tab.url && !isNewTabUrl(tab.url)) {
        const parsed = new URL(tab.url);
        const host = parsed.hostname.replace(/^www\./, '');
        return host.charAt(0).toUpperCase() + host.slice(1);
      }
    } catch (e) {}
    return tab.title || 'Web Tab';
  };

  // Helper for ASCII-style volume visual bar
  const renderAsciiVolumeBar = (volume: number) => {
    const totalBlocks = 10;
    const filledBlocks = Math.min(totalBlocks, Math.max(0, Math.round((volume / 100) * totalBlocks)));
    const emptyBlocks = totalBlocks - filledBlocks;
    const filledStr = '█'.repeat(filledBlocks);
    const emptyStr = '░'.repeat(emptyBlocks);
    return `${filledStr}${emptyStr}`;
  };

  return (
    <div
      className="fixed right-0 bottom-0 w-[440px] bg-[#14141d] border-l border-pink-500/30 z-50 flex flex-col shadow-2xl select-none animate-in slide-in-from-right duration-200 text-gray-200"
      style={{ top: `${topOffset}px` }}
    >
      {/* Glow ambient background accents */}
      <div className="absolute top-0 right-1/4 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center justify-between px-5 py-4 border-b border-[#252535] bg-[#101018]/70">
        <div className="flex items-center space-x-3">
          <div className="relative w-9 h-9 rounded-2xl bg-gradient-to-br from-pink-500/30 to-purple-600/30 border border-pink-500/40 flex items-center justify-center text-pink-400 shadow-md">
            <Music className="w-5 h-5" />
            {anyPlaying && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-gray-100 flex items-center space-x-1.5">
                <span>{isTh ? 'ศูนย์ควบคุมสื่อ (Media Control)' : 'Media Control'}</span>
              </h2>
              <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                v1.3.0
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              {isTh ? 'Global Media Panel & Windows Volume Mixer' : 'Global Media Panel & Windows Volume Mixer'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* Mute All Toggle */}
          <button
            onClick={handleToggleMuteAll}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs ${
              allMuted
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
            }`}
            title={allMuted ? (isTh ? 'เปิดเสียงทุกแท็บ' : 'Unmute All') : (isTh ? 'ปิดเสียงทุกแท็บ' : 'Mute All')}
          >
            {allMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span className="text-[11px]">{allMuted ? (isTh ? 'เปิดเสียงทั้งหมด' : 'Unmute All') : (isTh ? 'ปิดเสียงทั้งหมด' : 'Mute All')}</span>
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={isTh ? 'ปิด' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs no-scrollbar">
        {/* SECTION 1: NOW PLAYING CARDS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-pink-400" />
              <h3 className="font-bold text-gray-200 text-xs tracking-wide uppercase">
                {isTh ? 'กำลังเล่นมีเดีย (Now Playing)' : 'Now Playing'}
              </h3>
              {playingTabs.length > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {playingTabs.length} {isTh ? 'กำลังเล่น' : 'Active'}
                </span>
              )}
            </div>

            {anyPlaying && (
              <button
                onClick={handlePauseAll}
                className="text-[11px] text-pink-400 hover:text-pink-300 hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <Pause className="w-3 h-3" />
                <span>{isTh ? 'หยุดเล่นทั้งหมด' : 'Pause All'}</span>
              </button>
            )}
          </div>

          {/* Cards for active or recent media tabs */}
          {playingTabs.length > 0 ? (
            <div className="space-y-2.5">
              {playingTabs.map((tab) => {
                const siteName = getSiteName(tab);
                const currentVol = localVolumes[tab.id] ?? tab.volume ?? 100;
                const isMuted = Boolean(tab.isMuted);

                return (
                  <div
                    key={tab.id}
                    onClick={() => onSwitchTab(tab.id)}
                    className="group relative p-3.5 bg-gradient-to-br from-[#1d1d2b] to-[#171724] hover:from-[#242436] hover:to-[#1e1e2f] border border-pink-500/25 hover:border-pink-500/50 rounded-2xl transition-all shadow-md cursor-pointer space-y-3"
                  >
                    {/* Top Row: Info + Action Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 min-w-0 pr-2">
                        {/* Favicon / Site Icon */}
                        <div className="relative flex-shrink-0 w-9 h-9 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden">
                          {tab.favicon ? (
                            <img src={tab.favicon} alt="" className="w-5 h-5 object-contain" />
                          ) : (
                            <Tv className="w-4 h-4 text-pink-400" />
                          )}
                          {/* Animated Equalizer Waves */}
                          <div className="absolute bottom-1 right-1 flex items-end space-x-0.5">
                            <span className="w-0.5 h-2 bg-emerald-400 animate-pulse" />
                            <span className="w-0.5 h-3 bg-emerald-400 animate-pulse delay-75" />
                            <span className="w-0.5 h-1.5 bg-emerald-400 animate-pulse delay-150" />
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-bold text-gray-100 truncate group-hover:text-pink-300 transition-colors">
                              {siteName}
                            </span>
                            <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {isTh ? 'กำลังเล่น' : 'Playing'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 truncate max-w-[210px] mt-0.5">
                            {tab.title || tab.url}
                          </p>
                        </div>
                      </div>

                      {/* Controls: Play/Pause + Mute + Jump */}
                      <div className="flex items-center space-x-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        {/* Play / Pause Toggle Button */}
                        <button
                          onClick={(e) => handleTogglePlay(tab.id, e)}
                          className="w-8 h-8 rounded-full bg-pink-500 hover:bg-pink-400 text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                          title={isTh ? 'หยุดเล่น/เล่นต่อ' : 'Pause / Play'}
                        >
                          <Pause className="w-4 h-4 fill-white" />
                        </button>

                        {/* Mute Toggle Button */}
                        <button
                          onClick={(e) => handleToggleMute(tab.id, e)}
                          className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                            isMuted
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                              : 'bg-white/10 text-gray-300 border-white/10 hover:text-white hover:bg-white/20'
                          }`}
                          title={isMuted ? (isTh ? 'เปิดเสียง' : 'Unmute') : (isTh ? 'ปิดเสียง' : 'Mute')}
                        >
                          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>

                        {/* Jump to Tab */}
                        <button
                          onClick={() => onSwitchTab(tab.id)}
                          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-gray-400 hover:text-pink-300 flex items-center justify-center transition-all cursor-pointer"
                          title={isTh ? 'สลับไปยังแท็บนี้' : 'Switch to this tab'}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom Row: Quick Volume Slider for this playing card */}
                    <div className="pt-1.5 border-t border-white/5 flex items-center space-x-2.5" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[10px] font-mono text-gray-400 w-12 text-right">
                        {isMuted ? 'Muted' : `${currentVol}%`}
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={isMuted ? 0 : currentVol}
                        onChange={(e) => handleVolumeChange(tab.id, Number(e.target.value))}
                        className="flex-1 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                      />
                      <span className="text-[9px] font-mono text-pink-400/80 hidden sm:inline">
                        {renderAsciiVolumeBar(isMuted ? 0 : currentVol)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 bg-[#1b1b26]/70 border border-dashed border-gray-700/70 rounded-2xl flex flex-col items-center text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
                <Music className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-300">
                  {isTh ? 'ไม่มีแท็บที่กำลังเล่นเสียงในขณะนี้' : 'No tabs currently playing media'}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {isTh
                    ? 'เมื่อคุณเปิดเพลงบน YouTube, Spotify หรือเล่นวิดีโอ แถบควบคุมจะปรากฏที่นี่ทันที'
                    : 'When you play music or videos on YouTube, Spotify, etc., controls will appear here.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: WINDOWS-STYLE TAB VOLUME MIXER */}
        <div className="space-y-3.5 pt-2 border-t border-[#252535]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-pink-400" />
              <h3 className="font-bold text-gray-200 text-xs tracking-wide uppercase">
                {isTh ? 'ตัวปรับระดับเสียงแยกแท็บ (Volume Mixer)' : 'Volume Mixer'}
              </h3>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">
              {displayMixerTabs.length} {isTh ? 'แท็บ' : 'tabs'}
            </span>
          </div>

          <p className="text-[11px] text-gray-400 leading-relaxed">
            {isTh
              ? 'ปรับระดับเสียงของแต่ละเว็บไซต์แยกกันได้อย่างอิสระ คล้าย Windows Volume Mixer:'
              : 'Adjust individual website volume independently, like Windows Volume Mixer:'}
          </p>

          {/* Tab Volume List */}
          <div className="space-y-3">
            {displayMixerTabs.map((tab) => {
              const siteName = getSiteName(tab);
              const currentVol = localVolumes[tab.id] ?? tab.volume ?? 100;
              const isMuted = Boolean(tab.isMuted);
              const isPlaying = Boolean(tab.isPlayingAudio);
              const isActive = tab.id === activeTabId;

              return (
                <div
                  key={tab.id}
                  className={`p-3.5 rounded-2xl border transition-all space-y-2 ${
                    isActive
                      ? 'bg-[#1e1e2d] border-pink-500/40 shadow-sm'
                      : 'bg-[#171722]/80 border-[#28283a] hover:border-gray-600'
                  }`}
                >
                  {/* Top line: Site name + icons + ASCII meter */}
                  <div className="flex items-center justify-between">
                    <div
                      onClick={() => onSwitchTab(tab.id)}
                      className="flex items-center space-x-2.5 min-w-0 cursor-pointer group flex-1"
                    >
                      {/* Favicon */}
                      <div className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {tab.favicon ? (
                          <img src={tab.favicon} alt="" className="w-4 h-4 object-contain" />
                        ) : (
                          <Tv className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </div>

                      {/* Site Name / Title */}
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-gray-200 group-hover:text-pink-300 transition-colors truncate">
                            {siteName}
                          </span>
                          {isPlaying && (
                            <span className="flex items-center space-x-1 text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 rounded">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                              <span>LIVE</span>
                            </span>
                          )}
                          {isActive && (
                            <span className="text-[9px] font-mono text-pink-400 bg-pink-500/10 px-1 rounded">
                              {isTh ? 'แท็บปัจจุบัน' : 'Active'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ASCII Volume Meter (e.g. ████████░░ 80%) as requested by user */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <div className="font-mono text-[11px] font-bold text-pink-400 bg-black/40 px-2 py-0.5 rounded-lg border border-pink-500/20 flex items-center space-x-1.5 shadow-inner">
                        <span className="tracking-tighter select-all text-pink-300">
                          {renderAsciiVolumeBar(isMuted ? 0 : currentVol)}
                        </span>
                        <span className="w-9 text-right font-mono text-[10px] text-gray-300">
                          {isMuted ? 'OFF' : `${currentVol}%`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom line: Interactive Volume Slider & Mute button */}
                  <div className="flex items-center space-x-3 pt-1">
                    <button
                      onClick={() => handleToggleMute(tab.id)}
                      className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                        isMuted
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                          : 'bg-white/5 text-gray-300 border-white/10 hover:text-white hover:bg-white/15'
                      }`}
                      title={isMuted ? (isTh ? 'เปิดเสียงแท็บนี้' : 'Unmute Tab') : (isTh ? 'ปิดเสียงแท็บนี้' : 'Mute Tab')}
                    >
                      {isMuted || currentVol === 0 ? (
                        <VolumeX className="w-4 h-4 text-amber-400" />
                      ) : currentVol < 50 ? (
                        <Volume1 className="w-4 h-4 text-gray-300" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-pink-400" />
                      )}
                    </button>

                    {/* Volume Slider */}
                    <div className="flex-1 relative flex items-center">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={isMuted ? 0 : currentVol}
                        onChange={(e) => handleVolumeChange(tab.id, Number(e.target.value))}
                        className="w-full h-2 bg-gray-700/80 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400 transition-all"
                      />
                    </div>

                    {/* Quick play/pause button if playing or has played */}
                    <button
                      onClick={() => handleTogglePlay(tab.id)}
                      className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                        isPlaying
                          ? 'bg-pink-500 text-white border-pink-400 hover:bg-pink-600'
                          : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/15'
                      }`}
                      title={isPlaying ? (isTh ? 'หยุดเล่น' : 'Pause') : (isTh ? 'เล่น' : 'Play')}
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer / Quick Shortcut Bar */}
      <div className="px-5 py-3 border-t border-[#252535] bg-[#101018]/90 flex items-center justify-between text-[11px] text-gray-400">
        <div className="flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>{isTh ? 'ควบคุมเสียงแยกแท็บแบบอิสระ' : 'Per-tab independent audio mixing'}</span>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 font-medium transition-colors cursor-pointer"
        >
          {isTh ? 'เสร็จสิ้น' : 'Done'}
        </button>
      </div>
    </div>
  );
};
