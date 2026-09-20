import React from 'react';
import type { TabInfo } from '../../types/browser';
import { Shield, ShieldAlert, CheckCircle2, X } from 'lucide-react';

interface AdShieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: TabInfo;
  onToggleAdBlock: () => void;
  onToggleBlockGifAds: () => void;
  onToggleBlockRedirects: () => void;
}

export const AdShieldModal: React.FC<AdShieldModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  onToggleAdBlock,
  onToggleBlockGifAds,
  onToggleBlockRedirects,
}) => {
  if (!isOpen) return null;

  const enabled = activeTab?.adBlockStats?.enabled ?? true;
  const blockGifAds = activeTab?.adBlockStats?.blockGifAds ?? true;
  const blockRedirects = activeTab?.adBlockStats?.blockRedirects ?? true;
  const blockedCount = activeTab?.adBlockStats?.blockedCount ?? 0;
  const recentBlocked = activeTab?.adBlockStats?.recentBlocked ?? [];

  return (
    <div className="fixed top-[78px] right-0 bottom-0 w-[340px] bg-[#16161a] border-l border-[#25252b] z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#25252b]">
        <div className="flex items-center space-x-2">
          {enabled ? (
            <Shield className="w-4 h-4 text-indigo-400" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          )}
          <h2 className="text-sm font-semibold text-gray-100">Shield Protection</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-[#25252e] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Summary Card */}
      <div className="p-4 border-b border-[#202026] bg-[#141418]">
        <div className="py-1 text-center">
          <div className="text-3xl font-bold font-mono text-indigo-400 tracking-tight">{blockedCount}</div>
          <div className="text-xs font-medium text-gray-300 mt-1">โฆษณา & แทร็กเกอร์ที่บล็อกแล้ว</div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            สกัดกั้นก่อนส่งคำขอออกเครือข่าย
          </div>
        </div>

        {/* Toggle Switches */}
        <div className="mt-3 pt-3 border-t border-[#23232b] space-y-2.5">
          {/* Master Site Protection */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-200 font-medium">🛡️ ป้องกันโฆษณาไซต์นี้</span>
            <button
              onClick={onToggleAdBlock}
              className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                enabled ? 'bg-indigo-600' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Block GIF Ads */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-gray-300 font-medium">🚫 บล็อกแบนเนอร์ GIF</span>
              <span className="text-[10px] text-gray-500">บล็อกรูป GIF พนัน/โฆษณาในเว็บ</span>
            </div>
            <button
              onClick={onToggleBlockGifAds}
              className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                blockGifAds ? 'bg-emerald-600' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  blockGifAds ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Block Redirects & Popups */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-gray-300 font-medium">🛑 บล็อกเด้งเปลี่ยนหน้า</span>
              <span className="text-[10px] text-gray-500">บล็อก Popups และลิงก์พาเปลี่ยนหน้าเว็บ</span>
            </div>
            <button
              onClick={onToggleBlockRedirects}
              className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                blockRedirects ? 'bg-rose-600' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  blockRedirects ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Blocked Items Activity Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">
          <span>Blocked Requests</span>
          <span className="font-mono text-gray-500">({recentBlocked.length})</span>
        </div>

        {recentBlocked.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-gray-500 text-xs">
            <Shield className="w-8 h-8 mb-2 opacity-30 text-indigo-400" />
            <p>ยังไม่มีโฆษณาที่ถูกสกัดในหน้านี้</p>
            <p className="text-[11px] mt-1 text-gray-600">
              เซสชันการท่องเว็บปลอดภัย
            </p>
          </div>
        ) : (
          recentBlocked.map((item, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-lg bg-[#1b1b22] border border-[#272733] hover:border-[#3d3d4e] transition-colors"
            >
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                <span className="text-xs font-mono font-medium text-gray-200 truncate" title={item.url}>
                  {item.domain}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 truncate mt-1 font-mono pl-3" title={item.url}>
                {item.url}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#23232b] bg-[#141418] text-[10px] text-gray-400 flex items-center space-x-2">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
        <span>Chromium Network Request-Level Blocking</span>
      </div>
    </div>
  );
};
