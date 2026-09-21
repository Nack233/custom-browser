import React, { useState, useEffect } from 'react';
import type { AppSettings } from '../../types/browser';
import type { Language } from '../i18n';
import { translations } from '../i18n';
import {
  Settings,
  Globe,
  Zap,
  Info,
  Moon,
  Bookmark,
  Code2,
  Maximize2,
  CheckCircle2,
  Server,
  Sparkles,
  RotateCcw,
  Check,
  Shield,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface SettingsPageProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  forceDarkMode: boolean;
  onToggleForceDarkMode: () => void;
  showBookmarksBar: boolean;
  onToggleBookmarksBar: () => void;
  devModeEnabled: boolean;
  onToggleDevMode: () => void;
  onOpenUpdateLog: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  language,
  onLanguageChange,
  forceDarkMode,
  onToggleForceDarkMode,
  showBookmarksBar,
  onToggleBookmarksBar,
  devModeEnabled,
  onToggleDevMode,
  onOpenUpdateLog,
}) => {
  const [activeSection, setActiveSection] = useState<'general' | 'language' | 'dns' | 'performance' | 'about'>('general');
  const [dnsProvider, setDnsProvider] = useState<AppSettings['dnsProvider']>('cloudflare');
  const [customDnsUrl, setCustomDnsUrl] = useState('');
  const [hardwareAcceleration, setHardwareAcceleration] = useState(true);
  const [needsRelaunch, setNeedsRelaunch] = useState(false);
  const [tabSleepEnabled, setTabSleepEnabled] = useState(true);
  const [tabSleepMinutes, setTabSleepMinutes] = useState(15);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const t = translations[language];

  useEffect(() => {
    window.browserApi.getSettings().then((settings) => {
      if (settings) {
        setDnsProvider(settings.dnsProvider || 'cloudflare');
        setCustomDnsUrl(settings.customDnsUrl || '');
        if (settings.hardwareAcceleration !== undefined) {
          setHardwareAcceleration(settings.hardwareAcceleration);
        }
        if (settings.tabSleepEnabled !== undefined) {
          setTabSleepEnabled(settings.tabSleepEnabled);
        }
        if (settings.tabSleepMinutes !== undefined) {
          setTabSleepMinutes(settings.tabSleepMinutes);
        }
      }
    });
  }, []);

  const handleLanguageSelect = async (lang: Language) => {
    onLanguageChange(lang);
    await window.browserApi.updateSettings({ language: lang });
    setToastMessage(
      lang === 'th'
        ? '🇹🇭 สลับเป็นภาษาไทยแล้ว (ปรับ UI เว็บไซต์ YouTube & เบราว์เซอร์)'
        : '🇺🇸 Switched to English (YouTube & Browser localized)'
    );
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveDns = async () => {
    await window.browserApi.updateSettings({
      dnsProvider,
      customDnsUrl: customDnsUrl.trim(),
    });
    setToastMessage(t.settingsSaved);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const dnsOptions: Array<{
    id: AppSettings['dnsProvider'];
    label: string;
    description: string;
    badge?: string;
    icon: any;
  }> = [
    {
      id: 'cloudflare',
      label: 'Cloudflare (1.1.1.1)',
      description: language === 'th' ? 'แนะนำ: โหลดเร็ว ปลอดภัย ปลดบล็อกเว็บ ทะลุการบล็อกของ ISP ไทย' : 'Recommended: Fast, private & bypasses ISP blocks',
      badge: 'Popular',
      icon: Zap,
    },
    {
      id: 'google',
      label: 'Google Public DNS (8.8.8.8)',
      description: language === 'th' ? 'มาตรฐานโลก แม่นยำ และมีความเสถียรสูง' : 'Global standard, highly stable & reliable',
      icon: Server,
    },
    {
      id: 'adguard',
      label: 'AdGuard DNS',
      description: language === 'th' ? 'บล็อกโฆษณาและมัลแวร์ในระดับเครือข่าย DNS อัตโนมัติ' : 'Blocks ads and malware automatically at DNS level',
      badge: 'Privacy',
      icon: Shield,
    },
    {
      id: 'quad9',
      label: 'Quad9 (9.9.9.9)',
      description: language === 'th' ? 'เน้นความปลอดภัยขั้นสูงสุด บล็อกฟิชชิ่งและบ็อตเน็ต' : 'Maximum security, blocks phishing and botnets',
      icon: Shield,
    },
    {
      id: 'system',
      label: language === 'th' ? 'DNS ปกติของเครื่อง (System Default)' : 'System Default DNS',
      description: language === 'th' ? 'ใช้ DNS จากเน็ตบ้าน / ผู้ให้บริการมือถือปกติ' : 'Uses standard ISP DNS settings',
      icon: Server,
    },
    {
      id: 'custom',
      label: language === 'th' ? 'กำหนดเอง (Custom DoH URL)' : 'Custom DoH URL',
      description: language === 'th' ? 'ใส่ URL ของ DoH Resolver ที่คุณต้องการ' : 'Specify custom DNS-over-HTTPS endpoint',
      icon: Settings,
    },
  ];

  return (
    <div className="flex-1 w-full h-full overflow-hidden bg-[#fff5f9] flex select-none text-gray-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-8 z-50 px-4 py-2.5 bg-white border border-pink-300 rounded-2xl shadow-xl text-xs text-pink-700 font-medium flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Left Navigation Sidebar */}
      <div className="w-64 bg-white/70 backdrop-blur-md border-r border-pink-200/80 p-5 flex flex-col justify-between flex-shrink-0">
        <div className="space-y-6">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-pink-500/15 border border-pink-300 flex items-center justify-center text-pink-600 shadow-xs">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                {language === 'th' ? 'การตั้งค่า' : 'Settings'}
              </h2>
              <span className="text-[10px] text-pink-600 font-mono font-semibold">bocchy://settings</span>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveSection('general')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeSection === 'general'
                  ? 'bg-pink-500 text-white font-semibold shadow-xs'
                  : 'text-gray-650 hover:bg-pink-100/60 hover:text-gray-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>{language === 'th' ? 'การตั้งค่าทั่วไป' : 'General Settings'}</span>
            </button>

            <button
              onClick={() => setActiveSection('language')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeSection === 'language'
                  ? 'bg-pink-500 text-white font-semibold shadow-xs'
                  : 'text-gray-650 hover:bg-pink-100/60 hover:text-gray-900'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>{language === 'th' ? 'ภาษา & เว็บไซต์ (Localization)' : 'Language & Web'}</span>
            </button>

            <button
              onClick={() => setActiveSection('dns')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeSection === 'dns'
                  ? 'bg-pink-500 text-white font-semibold shadow-xs'
                  : 'text-gray-650 hover:bg-pink-100/60 hover:text-gray-900'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>{language === 'th' ? 'ความปลอดภัย & Secure DNS' : 'Security & DNS'}</span>
            </button>

            <button
              onClick={() => setActiveSection('performance')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeSection === 'performance'
                  ? 'bg-pink-500 text-white font-semibold shadow-xs'
                  : 'text-gray-650 hover:bg-pink-100/60 hover:text-gray-900'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{language === 'th' ? 'ประสิทธิภาพ & ประหยัด RAM' : 'Performance & RAM'}</span>
            </button>

            <button
              onClick={() => setActiveSection('about')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeSection === 'about'
                  ? 'bg-pink-500 text-white font-semibold shadow-xs'
                  : 'text-gray-650 hover:bg-pink-100/60 hover:text-gray-900'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>{language === 'th' ? 'เกี่ยวกับ Bocchy' : 'About Bocchy'}</span>
            </button>
          </nav>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-pink-200/70 text-center">
          <p className="text-[11px] text-pink-700 font-semibold">Bocchy Browser</p>
          <p className="text-[10px] text-gray-400 font-mono">v1.2.0 • Ultra Edition</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8 lg:p-12 max-w-5xl">
        {/* SECTION 1: GENERAL */}
        {activeSection === 'general' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {language === 'th' ? 'การตั้งค่าทั่วไป (General)' : 'General Settings'}
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                {language === 'th' ? 'ปรับแต่งการแสดงผล โหมดมืด และขนาดหน้าต่าง' : 'Customize browser appearance, dark mode, and window sizing'}
              </p>
            </div>

            <div className="space-y-3.5">
              {/* Force Dark Mode Card */}
              <div className="p-4 bg-white rounded-2xl border border-pink-200 shadow-xs flex items-center justify-between">
                <div className="flex items-start space-x-3.5 pr-4">
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-500">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">{t.forceDarkMode}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{t.forceDarkSub}</p>
                  </div>
                </div>
                <button
                  onClick={onToggleForceDarkMode}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    forceDarkMode ? 'bg-pink-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      forceDarkMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Bookmarks Bar Card */}
              <div className="p-4 bg-white rounded-2xl border border-pink-200 shadow-xs flex items-center justify-between">
                <div className="flex items-start space-x-3.5 pr-4">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-500">
                    <Bookmark className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">{t.bookmarksBar || 'แถบบุ๊กมาร์ก (Bookmarks Bar)'}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {language === 'th' ? 'แสดงแถบทางลัดบุ๊กมาร์กใต้ช่อง URL เพื่อง่ายต่อการคลิก' : 'Show bookmarks bar below the address bar'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onToggleBookmarksBar}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    showBookmarksBar ? 'bg-pink-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      showBookmarksBar ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Window State Persistence & Reset Card */}
              <div className="p-4 bg-white rounded-2xl border border-pink-200 shadow-xs flex items-center justify-between">
                <div className="flex items-start space-x-3.5 pr-4">
                  <div className="p-2.5 rounded-xl bg-pink-50 text-pink-600">
                    <Maximize2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">
                      {language === 'th' ? 'จดจำขนาดและตำแหน่งหน้าต่าง (Window Persistence)' : 'Remember Window Size & Position'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {language === 'th'
                        ? 'บันทึกขนาดหน้าต่าง พิกัด และสถานะเต็มจออัตโนมัติเมื่อปิดแอพ พร้อมระบบป้องกันหลุดจอ'
                        : 'Automatically remembers window dimensions, coordinates, and maximized state across restarts'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    await window.browserApi.resetWindowSize();
                    setToastMessage(language === 'th' ? '🔄 รีเซ็ตขนาดหน้าต่างเป็นค่าเริ่มต้น 1280x850 แล้ว' : '🔄 Window size reset to 1280x850');
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-pink-100 hover:bg-pink-200 text-pink-700 border border-pink-200 transition-colors flex-shrink-0 shadow-xs"
                >
                  {language === 'th' ? 'รีเซ็ตค่าเริ่มต้น (1280x850)' : 'Reset Default'}
                </button>
              </div>

              {/* Developer Mode Card */}
              <div className="p-4 bg-white rounded-2xl border border-pink-200 shadow-xs flex items-center justify-between">
                <div className="flex items-start space-x-3.5 pr-4">
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-500">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">{t.devMode || 'Developer Tools (F12)'}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t.devModeSub || 'เปิดใช้งานปุ่มลัด F12 และเครื่องมือตรวจสอบแท็บ Console & Network'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onToggleDevMode}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    devModeEnabled ? 'bg-pink-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      devModeEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: LANGUAGE & LOCALIZATION */}
        {activeSection === 'language' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {language === 'th' ? 'ภาษา & การแสดงผลเว็บไซต์ (Localization)' : 'Language & Localization'}
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                {language === 'th'
                  ? 'กำหนดภาษาของเมนูเบราว์เซอร์ พร้อมส่งภาษาไทย/อังกฤษไปยัง YouTube และเว็บไซต์ภายนอกโดยอัตโนมัติ'
                  : 'Choose browser language and automatically request Thai/English UI on YouTube & Google'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Thai Language */}
              <div
                onClick={() => handleLanguageSelect('th')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all shadow-xs flex items-center justify-between ${
                  language === 'th'
                    ? 'bg-pink-50 border-pink-500 shadow-sm ring-2 ring-pink-200'
                    : 'bg-white border-pink-100 hover:border-pink-300'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <span className="text-3xl">🇹🇭</span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">ภาษาไทย (Thai)</h3>
                    <p className="text-xs text-gray-500 mt-0.5">UI เบราว์เซอร์ + เมนู YouTube ภาษาไทย</p>
                  </div>
                </div>
                {language === 'th' && (
                  <div className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* English Language */}
              <div
                onClick={() => handleLanguageSelect('en')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all shadow-xs flex items-center justify-between ${
                  language === 'en'
                    ? 'bg-pink-50 border-pink-500 shadow-sm ring-2 ring-pink-200'
                    : 'bg-white border-pink-100 hover:border-pink-300'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <span className="text-3xl">🇺🇸</span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">English (United States)</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Browser UI + YouTube UI in English</p>
                  </div>
                </div>
                {language === 'en' && (
                  <div className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-pink-200 space-y-2 text-xs text-gray-650">
              <h4 className="font-semibold text-gray-800 flex items-center space-x-2">
                <Globe className="w-4 h-4 text-pink-600" />
                <span>{language === 'th' ? 'การทำงานของระบบ Web Localization' : 'How Web Localization Works'}</span>
              </h4>
              <p>
                {language === 'th'
                  ? 'เมื่อคุณเลือกภาษา ระบบจะส่ง Accept-Language Header พร้อมทั้งตั้งค่าคุกกี้ภาษา (PREF) ไปยังโดเมน YouTube, Google และเว็บไซต์อื่น ๆ โดยตรง ทำให้หน้าเว็บปรับเปลี่ยนภาษาตามทันทีโดยที่คุณไม่ต้องกดเปลี่ยนเอง'
                  : 'When you select a language, Bocchy injects Accept-Language headers and sets PREF cookies on YouTube and Google, automatically localizing web pages.'}
              </p>
            </div>
          </div>
        )}

        {/* SECTION 3: SECURE DNS */}
        {activeSection === 'dns' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {language === 'th' ? 'ความปลอดภัย & Secure DNS (DoH)' : 'Security & Secure DNS'}
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                {language === 'th'
                  ? 'เข้ารหัสการเชื่อมต่อชื่อเว็บไซต์ด้วย DNS-over-HTTPS ช่วยปลดบล็อกเว็บและป้องกันการดักข้อมูล'
                  : 'Encrypt DNS queries with DNS-over-HTTPS to bypass ISP blocks and protect privacy'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {dnsOptions.map((opt) => {
                const isSelected = dnsProvider === opt.id;
                const Icon = opt.icon;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setDnsProvider(opt.id)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all shadow-xs flex flex-col justify-between ${
                      isSelected
                        ? 'bg-pink-50/80 border-pink-500 shadow-sm ring-2 ring-pink-200'
                        : 'bg-white border-pink-100 hover:border-pink-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2.5">
                        <div className={`p-2 rounded-xl ${isSelected ? 'bg-pink-500 text-white' : 'bg-pink-50 text-pink-600'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-bold text-gray-900">{opt.label}</h4>
                      </div>
                      {opt.badge && (
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-pink-100 text-pink-700">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed mt-1">{opt.description}</p>
                  </div>
                );
              })}
            </div>

            {dnsProvider === 'custom' && (
              <div className="p-4 bg-white rounded-2xl border border-pink-200 space-y-2">
                <label className="text-xs font-semibold text-gray-850">
                  {language === 'th' ? 'ที่อยู่ DoH URL แบบกำหนดเอง' : 'Custom DoH URL'}
                </label>
                <input
                  type="text"
                  value={customDnsUrl}
                  onChange={(e) => setCustomDnsUrl(e.target.value)}
                  placeholder="https://your-dns-server/dns-query"
                  className="w-full px-3.5 py-2 rounded-xl border border-pink-200 focus:border-pink-500 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-200"
                />
              </div>
            )}

            <button
              onClick={handleSaveDns}
              className="px-6 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold shadow-sm transition-all"
            >
              {language === 'th' ? 'บันทึกการตั้งค่า DNS' : 'Save DNS Settings'}
            </button>
          </div>
        )}

        {/* SECTION 4: PERFORMANCE & RAM */}
        {activeSection === 'performance' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {language === 'th' ? 'ประสิทธิภาพ & การประหยัด RAM (Performance)' : 'Performance & Memory Saver'}
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                {language === 'th' ? 'จัดการการใช้หน่วยความจำ และการเร่งความเร็วด้วยการ์ดจอ' : 'Manage memory hibernation and GPU hardware acceleration'}
              </p>
            </div>

            <div className="space-y-4">
              {/* Tab Sleep Card */}
              <div className="p-5 bg-white rounded-2xl border border-pink-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-3.5 pr-4">
                    <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-600">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">{t.tabSleep || 'จำศีลแท็บเพื่อประหยัด RAM (Tab Hibernation)'}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{t.tabSleepSub || 'พักการทำงานของแท็บที่ไม่ได้แตะนานเพื่อคืน RAM ให้เครื่อง'}</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const next = !tabSleepEnabled;
                      setTabSleepEnabled(next);
                      await window.browserApi.updateSettings({ tabSleepEnabled: next });
                    }}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      tabSleepEnabled ? 'bg-pink-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        tabSleepEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {tabSleepEnabled && (
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-600 font-medium">{t.tabSleepMinutes || 'เวลาที่รอก่อนจำศีลแท็บ'}</span>
                    <div className="flex space-x-1.5">
                      {[5, 15, 30, 60].map((mins) => (
                        <button
                          key={mins}
                          onClick={async () => {
                            setTabSleepMinutes(mins);
                            await window.browserApi.updateSettings({ tabSleepMinutes: mins });
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-colors ${
                            tabSleepMinutes === mins
                              ? 'bg-pink-500 text-white shadow-xs'
                              : 'bg-pink-50 text-pink-700 hover:bg-pink-100'
                          }`}
                        >
                          {mins} นาที
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Hardware Acceleration Card */}
              <div className="p-5 bg-white rounded-2xl border border-pink-200 shadow-xs flex items-center justify-between">
                <div className="flex items-start space-x-3.5 pr-4">
                  <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">{t.hardwareAccel || 'การเร่งความเร็วด้วยฮาร์ดแวร์ (GPU Acceleration)'}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {language === 'th'
                        ? 'เปิดการ์ดจอเพื่อเรนเดอร์วิดีโอ 4K และอนิเมชันลื่นไหล (ปิดหากต้องการแชร์หน้าจอบน Discord แล้วไม่จอดำ)'
                        : 'Enable GPU acceleration for smooth 4K videos and animations'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    const next = !hardwareAcceleration;
                    setHardwareAcceleration(next);
                    setNeedsRelaunch(true);
                    await window.browserApi.updateSettings({ hardwareAcceleration: next });
                  }}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    hardwareAcceleration ? 'bg-pink-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      hardwareAcceleration ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {needsRelaunch && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between">
                  <span className="text-xs font-medium text-amber-800">
                    {language === 'th' ? '⚠️ ต้องรีสตาร์ทเบราว์เซอร์เพื่อให้การตั้งค่า GPU มีผล' : '⚠️ Restart required to apply GPU changes'}
                  </span>
                  <button
                    onClick={() => window.browserApi.relaunchApp()}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs"
                  >
                    {language === 'th' ? 'รีสตาร์ทเดี๋ยวนี้' : 'Restart Now'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 5: ABOUT BOCCHY */}
        {activeSection === 'about' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {language === 'th' ? 'เกี่ยวกับ Bocchy Browser' : 'About Bocchy Browser'}
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                {language === 'th' ? 'เบราว์เซอร์ส่วนตัวความเร็วสูง สไตล์สดใส น่ารัก และเต็มไปด้วยฟีเจอร์พรีเมียม' : 'High-speed, cute, modern custom browser'}
              </p>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-pink-200 shadow-xs flex flex-col items-center text-center space-y-4">
              <div className="relative p-1.5 rounded-2xl bg-pink-100 border border-pink-300 shadow-sm">
                <img src="./bocchy.png" alt="Bocchy" className="w-20 h-20 rounded-xl object-cover" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Bocchy Browser</h2>
                <div className="flex items-center justify-center space-x-2 mt-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-pink-500 text-white text-[11px] font-mono font-bold">
                    v1.2.0
                  </span>
                  <span className="text-xs text-gray-400 font-medium">Ultra Edition</span>
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={onOpenUpdateLog}
                  className="px-4 py-2 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-700 text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                  <span>{language === 'th' ? 'ดูประวัติการอัปเดต (Update Log)' : 'View Changelog'}</span>
                </button>

                <a
                  href="https://github.com/Nack233/custom-browser"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>GitHub Repository</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
