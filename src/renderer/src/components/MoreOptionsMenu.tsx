import React, { useEffect, useRef } from 'react';
import type { Language } from '../i18n';
import {
  Plus,
  Copy,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Bookmark,
  Clock,
  Download,
  Shield,
  Film,
  Moon,
  Sun,
  Code2,
  Settings,
  Sparkles,
  X,
  RotateCcw,
  Music,
} from 'lucide-react';

interface MoreOptionsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  currentZoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onNewTab: () => void;
  onNewIncognitoTab: () => void;
  showBookmarksBar: boolean;
  onToggleBookmarksBar: () => void;
  onOpenDownloads: () => void;
  onOpenShield: () => void;
  onOpenMedia: () => void;
  forceDarkMode: boolean;
  onToggleForceDarkMode: () => void;
  devModeEnabled: boolean;
  onToggleDevTools: () => void;
  onOpenSettings: () => void;
  onOpenUpdateLog: () => void;
  onRestoreClosedTab: () => void;
  canRestoreClosed: boolean;
  onOpenMediaControl?: () => void;
  isFloatingModal?: boolean;
}

export const MoreOptionsMenu: React.FC<MoreOptionsMenuProps> = ({
  isOpen,
  onClose,
  language,
  currentZoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onNewTab,
  onNewIncognitoTab,
  showBookmarksBar,
  onToggleBookmarksBar,
  onOpenDownloads,
  onOpenShield,
  onOpenMedia,
  forceDarkMode,
  onToggleForceDarkMode,
  devModeEnabled,
  onToggleDevTools,
  onOpenSettings,
  onOpenUpdateLog,
  onRestoreClosedTab,
  canRestoreClosed,
  onOpenMediaControl,
  isFloatingModal = false,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const zoomPercent = Math.round((currentZoom || 1.0) * 100);
  const isTh = language === 'th';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const containerClass = isFloatingModal
    ? 'w-full h-full max-h-[560px] overflow-y-auto bg-[#18181f]/95 backdrop-blur-2xl border border-pink-500/30 rounded-2xl shadow-2xl z-50 text-gray-200 text-xs py-1.5 select-none animate-in fade-in zoom-in-95 duration-100'
    : 'fixed top-12 right-3 w-72 bg-[#202024]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-50 text-gray-200 text-xs py-1.5 select-none animate-in fade-in zoom-in-95 duration-100';

  return (
    <div
      ref={menuRef}
      className={containerClass}
    >
      {/* 1. Tabs Group */}
      <div className="px-1 space-y-0.5">
        <button
          onClick={() => {
            onNewTab();
            onClose();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 transition-colors group text-left"
        >
          <div className="flex items-center space-x-3">
            <Plus className="w-4 h-4 text-gray-400 group-hover:text-white" />
            <span>{isTh ? 'แท็บใหม่ (New tab)' : 'New tab'}</span>
          </div>
          <span className="text-[11px] font-mono text-gray-500">Ctrl+T</span>
        </button>

        <button
          onClick={() => {
            onNewIncognitoTab();
            onClose();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 transition-colors group text-left"
        >
          <div className="flex items-center space-x-3">
            <EyeOff className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
            <span>{isTh ? 'แท็บไม่ระบุตัวตน (InPrivate)' : 'New InPrivate tab'}</span>
          </div>
          <span className="text-[11px] font-mono text-gray-500">Ctrl+Shift+N</span>
        </button>

        {canRestoreClosed && (
          <button
            onClick={() => {
              onRestoreClosedTab();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 transition-colors group text-left"
          >
            <div className="flex items-center space-x-3">
              <RotateCcw className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300" />
              <span>{isTh ? 'เปิดแท็บที่เพิ่งปิดล่าสุด' : 'Reopen closed tab'}</span>
            </div>
            <span className="text-[11px] font-mono text-gray-500">Ctrl+Shift+T</span>
          </button>
        )}
      </div>

      <div className="my-1.5 h-[1px] bg-white/10" />

      {/* 2. Zoom Controls Row */}
      <div className="px-4 py-2 flex items-center justify-between">
        <span className="text-gray-300 font-medium">{isTh ? 'การซูม (Zoom)' : 'Zoom'}</span>
        <div className="flex items-center space-x-1.5 bg-black/40 border border-white/10 rounded-xl p-0.5">
          <button
            onClick={onZoomOut}
            className="w-6 h-6 rounded-lg text-gray-300 hover:text-white hover:bg-white/20 flex items-center justify-center transition-colors"
            title="Zoom Out (Ctrl + -)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onResetZoom}
            className="px-2 h-6 rounded-lg font-mono text-[11px] font-bold text-gray-200 hover:text-pink-400 hover:bg-white/10 transition-colors"
            title="Reset (Ctrl + 0)"
          >
            {zoomPercent}%
          </button>
          <button
            onClick={onZoomIn}
            className="w-6 h-6 rounded-lg text-gray-300 hover:text-white hover:bg-white/20 flex items-center justify-center transition-colors"
            title="Zoom In (Ctrl + +)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="my-1.5 h-[1px] bg-white/10" />

      {/* 3. Utilities Group */}
      <div className="px-1 space-y-0.5">
        <button
          onClick={() => {
            onToggleBookmarksBar();
            onClose();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 transition-colors group text-left"
        >
          <div className="flex items-center space-x-3">
            <Bookmark className={`w-4 h-4 ${showBookmarksBar ? 'text-amber-400' : 'text-gray-400 group-hover:text-white'}`} />
            <span>{showBookmarksBar ? (isTh ? 'ซ่อนแถบบุ๊กมาร์ก' : 'Hide Bookmarks Bar') : (isTh ? 'แสดงแถบบุ๊กมาร์ก' : 'Show Bookmarks Bar')}</span>
          </div>
          <span className="text-[11px] font-mono text-gray-500">Ctrl+Shift+O</span>
        </button>

        <button
          onClick={() => {
            onOpenDownloads();
            onClose();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 transition-colors group text-left"
        >
          <div className="flex items-center space-x-3">
            <Download className="w-4 h-4 text-gray-400 group-hover:text-white" />
            <span>{isTh ? 'ดาวน์โหลด (Downloads)' : 'Downloads'}</span>
          </div>
          <span className="text-[11px] font-mono text-gray-500">Ctrl+J</span>
        </button>

        <button
          onClick={() => {
            onOpenShield();
            onClose();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 transition-colors group text-left"
        >
          <div className="flex items-center space-x-3">
            <Shield className="w-4 h-4 text-pink-400 group-hover:text-pink-300" />
            <span>{isTh ? 'ตัวป้องกันโฆษณา (AdBlock Shield)' : 'AdBlock Shield'}</span>
          </div>
        </button>

        <button
          onClick={() => {
            onOpenMedia();
            onClose();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 transition-colors group text-left"
        >
          <div className="flex items-center space-x-3">
            <Film className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300" />
            <span>{isTh ? 'ดักจับมีเดีย & วิดีโอ (Media Sniffer)' : 'Media Sniffer'}</span>
          </div>
        </button>

        {onOpenMediaControl && (
          <button
            onClick={() => {
              onOpenMediaControl();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 transition-colors group text-left"
          >
            <div className="flex items-center space-x-3">
              <Music className="w-4 h-4 text-pink-400 group-hover:text-pink-300" />
              <span>{isTh ? 'ควบคุมสื่อ & ผสมเสียง (Media Control)' : 'Media Control & Volume Mixer'}</span>
            </div>
            <span className="text-[10px] font-mono text-pink-400 bg-pink-500/15 px-1.5 py-0.5 rounded">NEW</span>
          </button>
        )}

        <button
          onClick={() => {
            onToggleForceDarkMode();
            onClose();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 transition-colors group text-left"
        >
          <div className="flex items-center space-x-3">
            {forceDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-gray-400 group-hover:text-white" />
            )}
            <span>{forceDarkMode ? (isTh ? 'โหมดมืด: เปิดอยู่' : 'Force Dark: ON') : (isTh ? 'โหมดมืด: ปิดอยู่' : 'Force Dark: OFF')}</span>
          </div>
        </button>

        {devModeEnabled && (
          <button
            onClick={() => {
              onToggleDevTools();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 transition-colors group text-left"
          >
            <div className="flex items-center space-x-3">
              <Code2 className="w-4 h-4 text-amber-400 group-hover:text-amber-300" />
              <span>{isTh ? 'เครื่องมือนักพัฒนา (DevTools)' : 'Developer Tools'}</span>
            </div>
            <span className="text-[11px] font-mono text-gray-500">F12</span>
          </button>
        )}
      </div>

      <div className="my-1.5 h-[1px] bg-white/10" />

      {/* 4. Settings & Help Group */}
      <div className="px-1 space-y-0.5">
        <button
          onClick={() => {
            onOpenSettings();
            onClose();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 transition-colors group text-left"
        >
          <div className="flex items-center space-x-3">
            <Settings className="w-4 h-4 text-pink-400 group-hover:text-pink-300" />
            <span className="font-semibold text-white">{isTh ? 'การตั้งค่า (Settings)' : 'Settings'}</span>
          </div>
          <span className="text-[10px] font-mono text-pink-400 bg-pink-500/20 px-1.5 py-0.5 rounded">bocchy://settings</span>
        </button>

        <button
          onClick={() => {
            onOpenUpdateLog();
            onClose();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 transition-colors group text-left"
        >
          <div className="flex items-center space-x-3">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span>{isTh ? 'ประวัติการอัปเดต (What\'s New)' : 'Changelog & What\'s New'}</span>
          </div>
          <span className="text-[10px] font-mono text-pink-400 font-bold">v1.3.2</span>
        </button>
      </div>
    </div>
  );
};
