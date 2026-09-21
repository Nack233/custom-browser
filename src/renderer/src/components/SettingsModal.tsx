import React, { useState, useEffect } from 'react';
import type { AppSettings } from '../../types/browser';
import type { Language } from '../i18n';
import { translations } from '../i18n';
import {
  Settings,
  X,
  Globe,
  Shield,
  Info,
  CheckCircle2,
  Server,
  Zap,
  Check,
  Moon,
  Bookmark,
  Cpu,
  Code2,
  Sparkles,
  Maximize2,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  forceDarkMode: boolean;
  onToggleForceDarkMode: () => void;
  showBookmarksBar: boolean;
  onToggleBookmarksBar: () => void;
  devModeEnabled: boolean;
  onToggleDevMode: () => void;
  onOpenUpdateLog: () => void;
  topOffset?: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  language,
  onLanguageChange,
  forceDarkMode,
  onToggleForceDarkMode,
  showBookmarksBar,
  onToggleBookmarksBar,
  devModeEnabled,
  onToggleDevMode,
  onOpenUpdateLog,
  topOffset = 78,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'language' | 'dns' | 'about'>('general');
  const [dnsProvider, setDnsProvider] = useState<AppSettings['dnsProvider']>('cloudflare');
  const [customDnsUrl, setCustomDnsUrl] = useState('');
  const [hardwareAcceleration, setHardwareAcceleration] = useState(true);
  const [needsRelaunch, setNeedsRelaunch] = useState(false);
  const [tabSleepEnabled, setTabSleepEnabled] = useState(true);
  const [tabSleepMinutes, setTabSleepMinutes] = useState(15);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const t = translations[language];

  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
      description: language === 'th' ? 'แนะนำ: ปลดบล็อกเว็บ ทะลุการบล็อกของ ISP ไทย โหลดเร็ว' : 'Recommended: Fast, private & bypasses ISP blocks',
      badge: 'Popular',
      icon: Zap,
    },
    {
      id: 'google',
      label: 'Google Public DNS (8.8.8.8)',
      description: language === 'th' ? 'เสถียรภาพสูง เชื่อมต่อทั่วโลก' : 'High reliability & global infrastructure',
      icon: Globe,
    },
    {
      id: 'adguard',
      label: 'AdGuard DNS',
      description: language === 'th' ? 'กรองโฆษณาและแทร็กเกอร์เพิ่มที่ระดับ DNS' : 'Extra ad & tracking blocker at DNS level',
      badge: 'AdBlock+',
      icon: Shield,
    },
    {
      id: 'quad9',
      label: 'Quad9 (9.9.9.9)',
      description: language === 'th' ? 'เน้นความปลอดภัย ป้องกันฟิชชิ่งและมัลแวร์' : 'Malware & phishing threat protection',
      icon: Server,
    },
    {
      id: 'system',
      label: language === 'th' ? 'ค่าเริ่มต้นของระบบ (ปิด DoH)' : 'System Default (DoH Off)',
      description: language === 'th' ? 'ใช้ DNS ปกติของผู้ให้บริการอินเทอร์เน็ต' : 'Use default network DNS without encryption',
      icon: Server,
    },
    {
      id: 'custom',
      label: language === 'th' ? 'กำหนดเอง (Custom DoH URL)' : 'Custom DoH URL',
      description: language === 'th' ? 'ระบุ URL ของ DoH เซิร์ฟเวอร์ที่ต้องการ' : 'Specify custom DNS-over-HTTPS endpoint',
      icon: Settings,
    },
  ];

  return (
    <div
      className="fixed right-0 bottom-0 w-[380px] bg-[#16161a] border-l border-[#25252b] z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 select-none"
      style={{ top: `${topOffset}px` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#25252b] bg-[#131317]">
        <div className="flex items-center space-x-2">
          <Settings className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-gray-100">{t.settingsTitle}</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-[#25252e] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex px-3 py-2 border-b border-[#202026] bg-[#141419] space-x-1 text-xs overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-medium transition-colors flex-shrink-0 ${
            activeTab === 'general'
              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#1f1f26]'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>{t.generalTab || '⚙️ General'}</span>
        </button>

        <button
          onClick={() => setActiveTab('language')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-medium transition-colors flex-shrink-0 ${
            activeTab === 'language'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#1f1f26]'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{t.languageTab}</span>
        </button>

        <button
          onClick={() => setActiveTab('dns')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-medium transition-colors flex-shrink-0 ${
            activeTab === 'dns'
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#1f1f26]'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{t.dnsTab}</span>
        </button>

        <button
          onClick={() => setActiveTab('about')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-medium transition-colors flex-shrink-0 ${
            activeTab === 'about'
              ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#1f1f26]'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>{t.aboutTab}</span>
        </button>
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="mx-3 my-2 p-2 bg-blue-950/90 border border-blue-500/40 rounded-md text-xs text-blue-200 text-center animate-pulse shadow-lg">
          {toastMessage}
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Tab 0: General & Appearance */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-gray-200">
                {language === 'th' ? 'การแสดงผล & ลักษณะ' : 'Display & Appearance'}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {language === 'th'
                  ? 'ปรับแต่งโหมดมืดและแถบเครื่องมือของเบราว์เซอร์'
                  : 'Customize dark mode and browser toolbars'}
              </p>
            </div>

            {/* Force Dark Mode Toggle */}
            <div className="p-3.5 rounded-xl bg-[#1b1b22] border border-[#292934] flex items-center justify-between">
              <div className="flex items-start space-x-3 pr-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 mt-0.5">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-200">{t.forceDarkMode}</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{t.forceDarkSub}</p>
                </div>
              </div>
              <button
                onClick={onToggleForceDarkMode}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  forceDarkMode ? 'bg-amber-500' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    forceDarkMode ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Bookmarks Bar Toggle */}
            <div className="p-3.5 rounded-xl bg-[#1b1b22] border border-[#292934] flex items-center justify-between">
              <div className="flex items-start space-x-3 pr-2">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 mt-0.5">
                  <Bookmark className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-200">{t.bookmarks || 'Bookmarks Bar'}</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                    {language === 'th'
                      ? 'แสดงแถบลิงก์บุ๊กมาร์กใต้ช่อง URL เพื่อง่ายต่อการคลิก'
                      : 'Show favorite bookmarks bar below the URL bar'}
                  </p>
                </div>
              </div>
              <button
                onClick={onToggleBookmarksBar}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  showBookmarksBar ? 'bg-blue-600' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    showBookmarksBar ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Hardware Acceleration Toggle */}
            <div className="p-3.5 rounded-xl bg-[#1b1b22] border border-[#292934] flex items-center justify-between">
              <div className="flex items-start space-x-3 pr-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-200">{t.hardwareAcceleration}</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                    {t.hardwareAccelerationSub}
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
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  hardwareAcceleration ? 'bg-emerald-500' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    hardwareAcceleration ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Relaunch Banner */}
            {needsRelaunch && (
              <div className="p-3 rounded-xl bg-amber-950/70 border border-amber-500/40 flex items-center justify-between shadow-lg animate-pulse">
                <div className="text-[11px] text-amber-200 pr-2">
                  {t.relaunchNotice}
                </div>
                <button
                  onClick={() => window.browserApi.relaunchApp()}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg text-xs transition-colors shadow-md flex-shrink-0"
                >
                  {t.relaunchNow}
                </button>
              </div>
            )}

            {/* Tab Sleep / Memory Saver Card */}
            <div className="p-3.5 rounded-xl bg-[#1b1b22] border border-[#292934] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-3 pr-2">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 mt-0.5">
                    <span className="text-base select-none">💤</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-200">{t.tabSleep}</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                      {t.tabSleepSub}
                    </p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    const next = !tabSleepEnabled;
                    setTabSleepEnabled(next);
                    await window.browserApi.updateSettings({ tabSleepEnabled: next });
                  }}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    tabSleepEnabled ? 'bg-cyan-500' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      tabSleepEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {tabSleepEnabled && (
                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-gray-400">{t.tabSleepMinutes}</span>
                  <div className="flex space-x-1.5">
                    {[5, 15, 30, 60].map((mins) => (
                      <button
                        key={mins}
                        onClick={async () => {
                          setTabSleepMinutes(mins);
                          await window.browserApi.updateSettings({ tabSleepMinutes: mins });
                        }}
                        className={`px-2 py-0.5 rounded-md text-xs font-mono transition-colors ${
                          tabSleepMinutes === mins
                            ? 'bg-cyan-500 text-black font-semibold shadow-sm'
                            : 'bg-[#252530] text-gray-300 hover:bg-[#32323e]'
                        }`}
                      >
                        {mins} นาที
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Developer Mode */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#1a1a22] border border-[#262632]">
              <div className="space-y-0.5 pr-4">
                <div className="flex items-center space-x-2">
                  <Code2 className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-medium text-gray-200">{t.devMode || 'Developer Mode'}</span>
                </div>
                <p className="text-[10px] text-gray-400 leading-tight">
                  {t.devModeSub || 'Enable F12 shortcut and tools to inspect tabs, console & network'}
                </p>
              </div>
              <button
                onClick={onToggleDevMode}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  devModeEnabled ? 'bg-amber-500' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    devModeEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Window Size & Position Card */}
            <div className="p-3.5 rounded-xl bg-[#201326] border border-pink-500/30 flex items-center justify-between">
              <div className="flex items-start space-x-3 pr-2">
                <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 mt-0.5">
                  <Maximize2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-pink-200">
                    {language === 'th' ? 'จดจำขนาดและตำแหน่งหน้าต่าง' : 'Remember Window Size & Position'}
                  </h4>
                  <p className="text-[11px] text-pink-300/70 mt-0.5 leading-relaxed">
                    {language === 'th'
                      ? 'บันทึกขนาดหน้าต่าง พิกัด และสถานะขยายเต็มจอ (Maximize) อัตโนมัติเมื่อเปิดปิดเบราว์เซอร์'
                      : 'Automatically remembers window dimensions, coordinates, and maximized state across sessions'}
                  </p>
                </div>
              </div>
              <button
                onClick={async () => {
                  await window.browserApi.resetWindowSize();
                  setToastMessage(
                    language === 'th'
                      ? '🔄 รีเซ็ตขนาดหน้าต่างเป็นค่าเริ่มต้น 1280x850 แล้ว'
                      : '🔄 Window size reset to default 1280x850'
                  );
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 border border-pink-500/40 transition-colors flex-shrink-0"
              >
                {language === 'th' ? 'รีเซ็ตค่าเริ่มต้น' : 'Reset Default'}
              </button>
            </div>

            {/* Incognito Info Box */}
            <div className="p-3.5 rounded-xl bg-[#201830] border border-purple-500/30">
              <h4 className="text-xs font-semibold text-purple-300 flex items-center space-x-1.5">
                <span>🕵️ {t.incognitoTab}</span>
              </h4>
              <p className="text-[11px] text-purple-200/70 mt-1 leading-relaxed">
                {t.incognitoNotice} (ปุ่มลัด: <span className="font-mono text-purple-300">Ctrl + Shift + N</span>)
              </p>
            </div>

            {/* Restore Tab Info Box */}
            <div className="p-3.5 rounded-xl bg-[#14261d] border border-emerald-500/30">
              <h4 className="text-xs font-semibold text-emerald-300 flex items-center space-x-1.5">
                <span>↩️ {t.restoreClosedTab}</span>
              </h4>
              <p className="text-[11px] text-emerald-200/70 mt-1 leading-relaxed">
                {language === 'th'
                  ? 'เผลอปิดแท็บสามารถกดปุ่มลัด Ctrl + Shift + T หรือปุ่มย้อนกลับบนแถบแท็บ เพื่อเปิดแท็บเดิมกลับมาได้ทันที'
                  : 'Accidentally closed a tab? Press Ctrl + Shift + T to restore it instantly.'}
              </p>
            </div>
          </div>
        )}
        {/* Tab 1: Language */}
        {activeTab === 'language' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-gray-200">{t.selectLanguage}</h3>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                {language === 'th'
                  ? 'เลือกภาษาสำหรับเบราว์เซอร์และเว็บไซต์ภายนอก (Localization เช่น YouTube, Google ฯลฯ)'
                  : 'Choose language for browser interface and website localization (YouTube, Google, etc.)'}
              </p>
            </div>

            <div className="space-y-2">
              {/* Thai */}
              <div
                onClick={() => handleLanguageSelect('th')}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  language === 'th'
                    ? 'bg-blue-950/40 border-blue-500 ring-1 ring-blue-500/30'
                    : 'bg-[#1b1b22] border-[#292934] hover:border-[#3a3a49]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🇹🇭</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-100">{t.thaiLang}</p>
                    <p className="text-[10px] text-gray-400">
                      {language === 'th' ? 'เมนูภาษาไทย + YouTube/Google แสดงภาษาไทย' : 'Thai UI + YouTube/Google in Thai'}
                    </p>
                  </div>
                </div>
                {language === 'th' && <Check className="w-4 h-4 text-blue-400" />}
              </div>

              {/* English */}
              <div
                onClick={() => handleLanguageSelect('en')}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  language === 'en'
                    ? 'bg-blue-950/40 border-blue-500 ring-1 ring-blue-500/30'
                    : 'bg-[#1b1b22] border-[#292934] hover:border-[#3a3a49]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🇺🇸</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-100">{t.engLang}</p>
                    <p className="text-[10px] text-gray-400">
                      {language === 'th' ? 'เมนูภาษาอังกฤษ + YouTube/Google แสดงภาษาอังกฤษ' : 'English UI + YouTube/Google in English'}
                    </p>
                  </div>
                </div>
                {language === 'en' && <Check className="w-4 h-4 text-blue-400" />}
              </div>
            </div>

            {/* Localization Info Card */}
            <div className="p-3.5 rounded-xl bg-[#141b2b] border border-blue-500/30 text-blue-200">
              <div className="flex items-start space-x-2.5">
                <Globe className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
                <div className="text-[11px] leading-relaxed text-blue-200/80">
                  <span className="font-semibold text-blue-100 block mb-0.5">
                    {language === 'th' ? '🌐 ระบบปรับภาษาเว็บไซต์อัตโนมัติ (Web Localization):' : '🌐 Automatic Web Localization:'}
                  </span>
                  {language === 'th'
                    ? 'เมื่อสลับภาษา เบราว์เซอร์จะส่งค่า Accept-Language และตั้งค่าคุกกี้ภาษา (PREF) ไปยัง YouTube, Google ฯลฯ อัตโนมัติ พร้อมรีเฟรชหน้าเว็บแท็บปัจจุบันทันที ไม่ต้องกดสลับภาษาในเว็บซ้ำ'
                    : 'When switching, the browser sends Accept-Language headers and updates platform cookies (PREF) for YouTube, Google, etc. Current active website reloads automatically in the chosen language.'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Secure DNS (DoH) */}
        {activeTab === 'dns' && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold text-gray-100">{t.secureDnsTitle}</h3>
              </div>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                {t.secureDnsDesc}
              </p>
            </div>

            {/* Providers list */}
            <div className="space-y-2">
              {dnsOptions.map((opt) => {
                const isSelected = dnsProvider === opt.id;
                const IconComponent = opt.icon;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setDnsProvider(opt.id)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/30'
                        : 'bg-[#1a1a22] border-[#272733] hover:border-[#3b3b48]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-gray-400'}`} />
                        <span className="text-xs font-medium text-gray-200">{opt.label}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        {opt.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {opt.badge}
                          </span>
                        )}
                        <div
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-600'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1 pl-5 leading-tight">
                      {opt.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Custom DoH Input */}
            {dnsProvider === 'custom' && (
              <div className="p-2.5 bg-[#141419] rounded-lg border border-[#2a2a36] space-y-1.5 animate-in fade-in duration-150">
                <label className="text-[10px] font-medium text-gray-300 uppercase tracking-wider">
                  DoH Query URL
                </label>
                <input
                  type="text"
                  value={customDnsUrl}
                  onChange={(e) => setCustomDnsUrl(e.target.value)}
                  placeholder={t.customDnsPlaceholder}
                  className="w-full px-2.5 py-1.5 bg-[#0f0f13] border border-[#2e2e3a] rounded text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {/* Save Button */}
            <div className="pt-2">
              <button
                onClick={handleSaveDns}
                className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-medium shadow-md shadow-emerald-950/40 transition-all active:scale-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t.saveAndApply}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: About */}
        {activeTab === 'about' && (
          <div className="space-y-4 text-xs text-gray-300">
            <div className="p-4 bg-[#141419] rounded-xl border border-[#24242e] text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden shadow-lg border border-pink-500/20 bg-[#1e1e26] p-1">
                <img src="./bocchy.png" alt="Bocchy" className="w-full h-full object-cover rounded-xl" />
              </div>
              <h3 className="font-semibold text-gray-100 text-sm">Bocchy Browser</h3>
              <p className="text-[11px] text-pink-400 font-mono font-semibold">v1.1.1 Hotfix • Custom Chromium Browser</p>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="p-2.5 bg-[#1a1a22] rounded-lg border border-[#262632] flex items-center justify-between">
                <span className="text-gray-400">Request-Level AdBlocker</span>
                <span className="text-emerald-400 font-semibold font-mono">Active</span>
              </div>

              <div className="p-2.5 bg-[#1a1a22] rounded-lg border border-[#262632] flex items-center justify-between">
                <span className="text-gray-400">DNS over HTTPS (DoH)</span>
                <span className="text-blue-400 font-semibold font-mono uppercase">{dnsProvider}</span>
              </div>

              <div className="p-2.5 bg-[#1a1a22] rounded-lg border border-[#262632] flex items-center justify-between">
                <span className="text-gray-400">Per-Tab Audio & Volume</span>
                <span className="text-emerald-400 font-semibold font-mono">Ready</span>
              </div>

              <div className="p-2.5 bg-[#1a1a22] rounded-lg border border-[#262632] flex items-center justify-between">
                <span className="text-gray-400">Page Zoom (25% - 500%)</span>
                <span className="text-blue-400 font-semibold font-mono">Active</span>
              </div>

              <div className="p-2.5 bg-[#1a1a22] rounded-lg border border-[#262632] flex items-center justify-between">
                <span className="text-gray-400">Developer Mode & F12</span>
                <span className={`font-semibold font-mono ${devModeEnabled ? 'text-amber-400' : 'text-gray-500'}`}>
                  {devModeEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenUpdateLog();
              }}
              className="w-full mt-2 py-2 px-3 flex items-center justify-center space-x-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 text-pink-300 border border-pink-500/30 rounded-lg text-xs font-semibold transition-all shadow-sm active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>{language === 'th' ? 'ดูบันทึกการอัปเดต (What\'s New in v1.1.1)' : 'View Release Notes & Changelog'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
