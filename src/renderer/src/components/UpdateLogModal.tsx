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
  Wrench,
  Globe,
  MousePointer,
  Heart,
  Maximize2,
} from 'lucide-react';

interface UpdateLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  topOffset?: number;
}

export const UpdateLogModal: React.FC<UpdateLogModalProps> = ({
  isOpen,
  onClose,
  language,
  topOffset = 78,
}) => {
  if (!isOpen) return null;

  const isTh = language === 'th';

  return (
    <div
      className="fixed right-0 bottom-0 w-[440px] bg-[#16161c] border-l border-[#282834] z-50 flex flex-col shadow-2xl select-none animate-in slide-in-from-right duration-200"
      style={{ top: `${topOffset}px` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#252530] bg-[#141419]">
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xs font-bold text-gray-100">
                {isTh ? 'ประวัติการอัปเดต (Update Log)' : 'Changelog & Updates'}
              </h2>
              <span className="px-1.5 py-0.2 text-[9px] font-bold font-mono uppercase rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                v1.2.0
              </span>
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {isTh ? 'การปรับปรุงครั้งใหญ่: Dedicated Settings & เมนู ...' : 'Major release: Dedicated Settings & ... Menu'}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-[#25252e] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-gray-300 no-scrollbar">
        {/* VERSION 1.2.0 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#2a2a38]">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-pink-400 font-mono">v1.2.0</span>
              <span className="px-1.5 py-0.2 text-[9px] font-semibold rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                {isTh ? 'เวอร์ชันใหม่ล่าสุด' : 'Latest Major'}
              </span>
            </div>
            <div className="flex items-center text-gray-500 text-[10px] space-x-1">
              <Calendar className="w-3 h-3" />
              <span>2026-09-21</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="p-3 bg-[#221024] border border-pink-500/30 rounded-xl space-y-1">
              <div className="flex items-center space-x-1.5 text-pink-300 font-semibold text-[11px]">
                <Settings className="w-3.5 h-3.5 flex-shrink-0 text-pink-400" />
                <span>{isTh ? 'หน้าการตั้งค่าแบบเต็มแท็บ (bocchy://settings)' : 'Dedicated Settings Tab'}</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed pl-5">
                {isTh
                  ? 'เปลี่ยนหน้า Settings จาก Drawer ด้านข้างที่เคยบีบหน้าเว็บ มาเป็นแท็บเฉพาะของตัวเอง (bocchy://settings) กว้างขวาง จัดหมวดหมู่ชัดเจน และไม่รบกวนหน้าเว็บอื่นที่เปิดอยู่'
                  : 'Settings is now a full, dedicated tab (bocchy://settings) with clean navigation and zero webpage splitting.'}
              </p>
            </div>

            <div className="p-3 bg-[#221024] border border-pink-500/30 rounded-xl space-y-1">
              <div className="flex items-center space-x-1.5 text-pink-300 font-semibold text-[11px]">
                <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-pink-400" />
                <span>{isTh ? 'เมนูลอยสไตล์ Edge (...) และ Zero-Compression' : 'Edge-Style (...) Menu & Zero-Compression'}</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed pl-5">
                {isTh
                  ? 'เพิ่มปุ่มเมนู ... ด้านบนขวา พร้อมปุ่มลัดครบครัน (ซูม, แท็บใหม่, InPrivate, บุ๊กมาร์ก, ดาวน์โหลด, ป้องกันโฆษณา, ดักมีเดีย, โหมดมืด) และยกเลิกการบีบหดหน้าเว็บ ทำให้ YouTube เล่นได้เต็มจอไม่มีสะดุด'
                  : 'Added an Edge-style ... options menu with zoom, new tab, downloads, adblock, and eliminated sidebar width squishing.'}
              </p>
            </div>
          </div>
        </div>

        {/* VERSION 1.1.1 HOTFIX */}
        <div className="space-y-3 pt-2 border-t border-[#262635]">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#2a2a38]">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-rose-400 font-mono">v1.1.1</span>
              <span className="px-1.5 py-0.2 text-[9px] font-semibold rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {isTh ? 'Hotfix แก้ไขด่วน' : 'Hotfix'}
              </span>
            </div>
            <div className="flex items-center text-gray-500 text-[10px] space-x-1">
              <Calendar className="w-3 h-3" />
              <span>2026-09-21</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="p-3 bg-[#1c1a24] border border-rose-500/25 rounded-xl space-y-1">
              <div className="flex items-center space-x-1.5 text-rose-300 font-semibold text-[11px]">
                <Wrench className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{isTh ? 'แก้ไขหน้าต่าง Zoom หล่นไปอยู่หลังหน้าเว็บ' : 'Fix Zoom Controls Clipping Behind Page'}</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed pl-5">
                {isTh
                  ? 'ปรับตัวควบคุมการซูมเป็นแบบ Inline Stepper ([-] 100% [+]) บน Navigation Bar ทำให้กดซูมได้ทันทีและไม่ถูก WebContentsView / YouTube บดบัง'
                  : 'Redesigned zoom controls into an inline stepper on the top bar, ensuring it never gets hidden behind native WebContentsView.'}
              </p>
            </div>

            <div className="p-3 bg-[#1c1a24] border border-rose-500/25 rounded-xl space-y-1">
              <div className="flex items-center space-x-1.5 text-rose-300 font-semibold text-[11px]">
                <Wrench className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{isTh ? 'แก้ไขปัญหาแถบด้านบนจอดำเมื่อเปิด Update Log' : 'Fix Dark Top Bar Overlay on Update Log'}</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed pl-5">
                {isTh
                  ? 'เปลี่ยนหน้าต่าง Update Log เป็น Right-Side Drawer ที่หดพื้นที่หน้าเว็บออกโดยอัตโนมัติ ทำให้ดูอัปเดตไปพร้อมกับการดู YouTube ได้โดยแถบไม่ดำ'
                  : 'Converted the update log to a right-side drawer with auto window resize, eliminating dark overlay on the top bar.'}
              </p>
            </div>

            <div className="p-3 bg-[#1c1a24] border border-rose-500/25 rounded-xl space-y-1">
              <div className="flex items-center space-x-1.5 text-rose-300 font-semibold text-[11px]">
                <Wrench className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{isTh ? 'เพิ่ม Scroll Wheel ปรับเสียงที่หัวแท็บ' : 'Scroll Wheel Audio Volume on Tabs'}</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed pl-5">
                {isTh
                  ? 'สามารถหมุนล้อเมาส์บนไอคอนลำโพงที่หัวแท็บเพื่อปรับระดับความดังขึ้น-ลงได้อย่างรวดเร็ว และคลิกเพื่อ Mute/Unmute'
                  : 'Quickly adjust volume by scrolling the mouse wheel on the tab speaker icon, and click to instantly mute/unmute.'}
              </p>
            </div>

            <div className="p-3 bg-[#1c1a24] border border-blue-500/25 rounded-xl space-y-1">
              <div className="flex items-center space-x-1.5 text-blue-300 font-semibold text-[11px]">
                <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{isTh ? 'ระบบ Web Localization (รองรับภาษาไทย/อังกฤษใน YouTube & Google)' : 'Web Localization (YouTube & Google in TH/EN)'}</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed pl-5">
                {isTh
                  ? 'เมื่อเปลี่ยนภาษาใน Settings ระบบจะส่ง Accept-Language และตั้งค่าคุกกี้ภาษา (PREF) ไปยังเว็บไซต์ เช่น YouTube และ Google โดยตรง ทำให้หน้าเว็บแสดงผล UI เป็นภาษาไทยหรืออังกฤษตามที่ต้องการทันที'
                  : 'Changing browser language now injects Accept-Language and PREF cookies into external sites like YouTube and Google, automatically rendering their UI in Thai or English.'}
              </p>
            </div>

            <div className="p-3 bg-[#1c1a24] border border-cyan-500/25 rounded-xl space-y-1">
              <div className="flex items-center space-x-1.5 text-cyan-300 font-semibold text-[11px]">
                <MousePointer className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{isTh ? 'ฟังก์ชันเมาส์และเมนูคลิกขวา (Mouse Shortcuts & Context Menu)' : 'Mouse Shortcuts & Rich Context Menu'}</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed pl-5">
                {isTh
                  ? 'รองรับคลิกเมาส์กลางเปิดแท็บใหม่จากลิงก์/YouTube, คลิกเมาส์กลางที่หัวแท็บเพื่อปิดแท็บ, เมนูคลิกขวาเต็มรูปแบบ (Back, Forward, Refresh, Save as, Print, Inspect element) และปุ่มข้างเมาส์ Back/Forward'
                  : 'Added middle-click link to new tab (YouTube/web), middle-click tab to close, rich right-click context menu (Back, Forward, Refresh, Inspect, Print), and mouse side buttons.'}
              </p>
            </div>

            <div className="p-3 bg-[#221024] border border-pink-500/30 rounded-xl space-y-1">
              <div className="flex items-center space-x-1.5 text-pink-300 font-semibold text-[11px]">
                <Heart className="w-3.5 h-3.5 flex-shrink-0 fill-pink-400 text-pink-400" />
                <span>{isTh ? 'ดีไซน์ใหม่: Pink Glassmorphism UI (แก้วใสสีชมพูสไตล์ Bocchy)' : 'Cute Pink Glassmorphism UI Redesign'}</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed pl-5">
                {isTh
                  ? 'ปรับแต่งหน้า New Tab และแถบนำทางด้านบน (TabBar, NavigationBar, BookmarksBar) ใหม่หมดจด ด้วยโทนสีชมพูพาสเทลเอฟเฟกต์แก้วใส (Glass Transparent), แสงนีออนละมุน และฟอนต์โมเดิร์น Plus Jakarta Sans'
                  : 'Transformed New Tab page and top bars (TabBar, NavigationBar, BookmarksBar) with pastel pink glass transparent aesthetics, ambient neon glow, and modern Plus Jakarta Sans typography.'}
              </p>
            </div>

            <div className="p-3 bg-[#221024] border border-pink-500/30 rounded-xl space-y-1">
              <div className="flex items-center space-x-1.5 text-pink-300 font-semibold text-[11px]">
                <Maximize2 className="w-3.5 h-3.5 flex-shrink-0 text-pink-400" />
                <span>{isTh ? 'ระบบจดจำขนาดหน้าต่าง (Window State Persistence)' : 'Window State Persistence'}</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed pl-5">
                {isTh
                  ? 'จำขนาดหน้าต่าง พิกัด x, y และสถานะขยายเต็มจอ (Maximize) อัตโนมัติเมื่อเปิดปิดเบราว์เซอร์ พร้อมระบบป้องกันหน้าต่างหลุดจอกรณีถอดจอแยก และปุ่มรีเซ็ตขนาดใน Settings'
                  : 'Automatically remembers window dimensions, screen position, and maximized state across restarts with multi-monitor safety checks and a quick reset button.'}
              </p>
            </div>
          </div>
        </div>

        {/* VERSION 1.1.0 */}
        <div className="space-y-3 pt-2 border-t border-[#262635]">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#252532]">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-pink-400 font-mono">v1.1.0</span>
              <span className="px-1.5 py-0.2 text-[9px] font-semibold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Major Update
              </span>
            </div>
            <div className="flex items-center text-gray-500 text-[10px] space-x-1">
              <Calendar className="w-3 h-3" />
              <span>2026-09-21</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="p-2.5 bg-[#191922] border border-[#272736] rounded-lg space-y-1">
              <div className="flex items-center space-x-1.5 text-indigo-400 font-semibold text-[11px]">
                <Volume2 className="w-3.5 h-3.5" />
                <span className="text-gray-200">{isTh ? 'ระบบควบคุมเสียงแยกแท็บ' : 'Per-Tab Audio Control'}</span>
              </div>
              <p className="text-[10px] text-gray-400 pl-5">
                {isTh
                  ? 'ตรวจจับเสียงแท็บอัตโนมัติ แสดงไอคอนคลื่นเสียง 🔊 และปรับ Mute / Volume 0-100%'
                  : 'Independent per-tab volume and instant mute with audio wave animations.'}
              </p>
            </div>

            <div className="p-2.5 bg-[#191922] border border-[#272736] rounded-lg space-y-1">
              <div className="flex items-center space-x-1.5 text-blue-400 font-semibold text-[11px]">
                <ZoomIn className="w-3.5 h-3.5" />
                <span className="text-gray-200">{isTh ? 'ย่อ-ขยายหน้าเว็บ (Page Zoom)' : 'Page Zoom 25% - 500%'}</span>
              </div>
              <p className="text-[10px] text-gray-400 pl-5">
                {isTh
                  ? 'ซูมหน้าเว็บผ่านปุ่มลัด Ctrl + + / Ctrl + - / Ctrl + 0'
                  : 'Scale web pages with shortcuts Ctrl + +/- / 0.'}
              </p>
            </div>

            <div className="p-2.5 bg-[#191922] border border-[#272736] rounded-lg space-y-1">
              <div className="flex items-center space-x-1.5 text-amber-400 font-semibold text-[11px]">
                <Code2 className="w-3.5 h-3.5" />
                <span className="text-gray-200">{isTh ? 'โหมดนักพัฒนา (Developer Mode)' : 'Developer Mode'}</span>
              </div>
              <p className="text-[10px] text-gray-400 pl-5">
                {isTh
                  ? 'กด F12 หรือ Ctrl + Shift + I เพื่อเปิด DevTools ตรวจสอบโค้ดหน้าเว็บและ Console'
                  : 'Toggle Chrome DevTools with F12 or Ctrl + Shift + I.'}
              </p>
            </div>
          </div>
        </div>

        {/* VERSION 1.0.0 */}
        <div className="space-y-2 pt-2 border-t border-[#262635]">
          <div className="flex items-center justify-between pb-1 border-b border-[#20202a]">
            <span className="text-xs font-bold text-gray-400 font-mono">v1.0.0 Initial</span>
            <span className="text-gray-500 text-[10px]">2026-09-20</span>
          </div>
          <ul className="space-y-1.5 text-[10px] text-gray-400">
            <li className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3 h-3 text-indigo-400 flex-shrink-0" />
              <span>AdShield & Tracker Blocking</span>
            </li>
            <li className="flex items-center space-x-1.5">
              <Film className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              <span>Media Extractor 2.0 & ZIP Packager</span>
            </li>
            <li className="flex items-center space-x-1.5">
              <Zap className="w-3 h-3 text-amber-400 flex-shrink-0" />
              <span>DNS-over-HTTPS (DoH) Bypass ISP</span>
            </li>
            <li className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3 h-3 text-blue-400 flex-shrink-0" />
              <span>Tab Sleep Memory Saver (Save 70% RAM)</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#22222a] bg-[#121216]">
        <span className="text-[10px] text-gray-500 font-mono">Bocchy v1.1.1 Hotfix</span>
        <button
          onClick={onClose}
          className="px-3 py-1 bg-[#262633] hover:bg-[#343444] text-white rounded-md text-[11px] font-medium transition-colors"
        >
          {isTh ? 'ปิด' : 'Close'}
        </button>
      </div>
    </div>
  );
};
