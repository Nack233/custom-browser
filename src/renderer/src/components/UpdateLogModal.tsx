import React from 'react';
import type { Language } from '../i18n';
import {
  Sparkles,
  X,
  Volume2,
  ZoomIn,
  Code2,
  FileText,
  ShieldCheck,
  Film,
  Zap,
  CheckCircle2,
  Calendar,
  ExternalLink,
} from 'lucide-react';

interface UpdateLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const UpdateLogModal: React.FC<UpdateLogModalProps> = ({ isOpen, onClose, language }) => {
  if (!isOpen) return null;

  const isTh = language === 'th';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative flex flex-col w-full max-w-2xl max-h-[85vh] bg-[#16161b] border border-[#2d2d38] rounded-2xl shadow-2xl shadow-black/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#252530] bg-[#1b1b22]/70">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-gray-100">
                  {isTh ? 'บันทึกการอัปเดต (Update Log)' : 'Release Notes & Changelog'}
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold font-mono uppercase rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  v1.1.0 Latest
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {isTh
                  ? 'ตรวจสอบคุณสมบัติใหม่และการปรับปรุงใน Bocchy Browser'
                  : "Discover what's new and improved in Bocchy Browser"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#282834] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 custom-scrollbar text-xs text-gray-300">
          {/* VERSION 1.1.0 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#262633]">
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold text-pink-400 font-mono">v1.1.0</span>
                <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {isTh ? 'เวอร์ชันปัจจุบัน' : 'Current Release'}
                </span>
              </div>
              <div className="flex items-center text-gray-500 text-[11px] space-x-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>2026-09-21</span>
              </div>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Feature 1: Tab Volume */}
              <div className="p-3.5 bg-[#1a1a23] border border-indigo-500/20 rounded-xl space-y-1.5 hover:border-indigo-500/40 transition-colors">
                <div className="flex items-center space-x-2 text-indigo-400 font-semibold">
                  <Volume2 className="w-4 h-4 flex-shrink-0" />
                  <span className="text-gray-100">
                    {isTh ? 'จัดการเสียงแยกแท็บ (Per-Tab Audio)' : 'Per-Tab Audio & Volume'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  {isTh
                    ? 'ปรับระดับความดัง (0% - 100%) แยกอิสระในแต่ละแท็บ พร้อมสัญลักษณ์คลื่นเสียง 🔊 และคลิกเพื่อ Mute/Unmute ทันที'
                    : 'Independent volume control (0% - 100%) and instant mute toggle with animated audio wave indicators on each tab.'}
                </p>
              </div>

              {/* Feature 2: Page Zoom */}
              <div className="p-3.5 bg-[#1a1a23] border border-blue-500/20 rounded-xl space-y-1.5 hover:border-blue-500/40 transition-colors">
                <div className="flex items-center space-x-2 text-blue-400 font-semibold">
                  <ZoomIn className="w-4 h-4 flex-shrink-0" />
                  <span className="text-gray-100">
                    {isTh ? 'ย่อ-ขยายหน้าเว็บ (Page Zoom)' : 'Page Zoom Controls'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  {isTh
                    ? 'ซูมหน้าเว็บได้ตั้งแต่ 25% ถึง 500% ผ่านคีย์ลัด Ctrl + + / Ctrl + - / Ctrl + 0 หรือตัวปรับสเกลบนแถบเครื่องมือ'
                    : 'Scale web pages smoothly from 25% to 500% using standard Ctrl + +/- / 0 shortcuts or toolbar zoom stepper.'}
                </p>
              </div>

              {/* Feature 3: Dev Mode */}
              <div className="p-3.5 bg-[#1a1a23] border border-amber-500/20 rounded-xl space-y-1.5 hover:border-amber-500/40 transition-colors">
                <div className="flex items-center space-x-2 text-amber-400 font-semibold">
                  <Code2 className="w-4 h-4 flex-shrink-0" />
                  <span className="text-gray-100">
                    {isTh ? 'โหมดนักพัฒนา (Developer Mode)' : 'Developer Mode & F12'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  {isTh
                    ? 'เปิด DevTools ตรวจสอบหน้าเว็บ คอนโซล โค้ด และเน็ตเวิร์กได้อย่างรวดเร็วด้วยปุ่ม F12 หรือ Ctrl + Shift + I'
                    : 'Instantly inspect web elements, run scripts in console, and inspect network traffic with F12 and shortcut triggers.'}
                </p>
              </div>

              {/* Feature 4: Update Log Viewer */}
              <div className="p-3.5 bg-[#1a1a23] border border-pink-500/20 rounded-xl space-y-1.5 hover:border-pink-500/40 transition-colors">
                <div className="flex items-center space-x-2 text-pink-400 font-semibold">
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  <span className="text-gray-100">
                    {isTh ? 'บันทึกการอัปเดต (Update Log)' : 'Interactive Changelog'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  {isTh
                    ? 'หน้าต่างดูประวัติและความเปลี่ยนแปลงในแต่ละเวอร์ชัน เข้าถึงได้ง่ายจากแถบเครื่องมือและการตั้งค่า'
                    : 'Easily track all releases, new additions, bug fixes, and feature guides anytime from the toolbar or settings.'}
                </p>
              </div>
            </div>
          </div>

          {/* VERSION 1.0.0 */}
          <div className="space-y-3 pt-3 border-t border-[#262633]/60">
            <div className="flex items-center justify-between pb-2 border-b border-[#20202a]">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-gray-400 font-mono">v1.0.0</span>
                <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-gray-800 text-gray-400">
                  Initial Release
                </span>
              </div>
              <div className="flex items-center text-gray-500 text-[11px] space-x-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>2026-09-20</span>
              </div>
            </div>

            <ul className="space-y-2 text-[11px] text-gray-400">
              <li className="flex items-start space-x-2">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
                <span>
                  <b>AdShield Protection:</b> สกัดกั้นโฆษณา แบนเนอร์ GIF ป๊อปอัป และลิงก์เด้งพนันตั้งแต่ระดับคำขอเน็ตเวิร์ก
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <Film className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>
                  <b>Media Extractor 2.0:</b> ดักจับวิดีโอ สตรีม HLS และรูปภาพในเว็บ พร้อมดาวน์โหลดรวมเป็นไฟล์ .ZIP
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <Zap className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                <span>
                  <b>DNS-over-HTTPS (DoH):</b> รองรับ Cloudflare, Google, AdGuard, Quad9 เพื่อความปลอดภัยและปลดบล็อก ISP
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>
                  <b>Smart Tab Sleep & RAM Saver:</b> จำศีลแท็บที่ไม่ได้ใช้งานอัตโนมัติ ช่วยประหยัดแรมได้ถึง 70%
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#252530] bg-[#141418]">
          <div className="flex items-center space-x-2 text-[11px] text-gray-500">
            <span>Bocchy Custom Web Browser</span>
            <span>•</span>
            <span className="font-mono text-gray-400">v1.1.0</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-pink-950/40 transition-all active:scale-95"
          >
            {isTh ? 'ปิดหน้าต่าง' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
