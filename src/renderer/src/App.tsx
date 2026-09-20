import React, { useState, useEffect, useCallback } from 'react';
import type { TabInfo, MediaItem, BookmarkItem, ShortcutItem, RecentlyClosedItem, DownloadItemInfo } from '../types/browser';
import { TabBar } from './components/TabBar';
import { NavigationBar } from './components/NavigationBar';
import { BookmarksBar } from './components/BookmarksBar';
import { NewTabPage } from './components/NewTabPage';
import { MediaDrawer } from './components/MediaDrawer';
import { AdShieldModal } from './components/AdShieldModal';
import { SettingsModal } from './components/SettingsModal';
import { DownloadsFlyout } from './components/DownloadsFlyout';
import { UpdateLogModal } from './components/UpdateLogModal';
import type { Language } from './i18n';

export const App: React.FC = () => {
  const [tabs, setTabs] = useState<TabInfo[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [tabMediaMap, setTabMediaMap] = useState<Record<string, MediaItem[]>>({});
  const [isMediaDrawerOpen, setIsMediaDrawerOpen] = useState(false);
  const [isShieldOpen, setIsShieldOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDownloadsOpen, setIsDownloadsOpen] = useState(false);
  const [downloads, setDownloads] = useState<DownloadItemInfo[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [language, setLanguage] = useState<Language>('th');

  // New Features State
  const [forceDarkMode, setForceDarkMode] = useState(false);
  const [showBookmarksBar, setShowBookmarksBar] = useState(true);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [shortcuts, setShortcuts] = useState<ShortcutItem[]>([]);
  const [recentlyClosed, setRecentlyClosed] = useState<RecentlyClosedItem[]>([]);
  const [isUpdateLogOpen, setIsUpdateLogOpen] = useState(false);
  const [devModeEnabled, setDevModeEnabled] = useState(false);

  // Refresh recently closed tabs list
  const refreshRecentlyClosed = useCallback(async () => {
    try {
      const list = await window.browserApi.getRecentlyClosed();
      setRecentlyClosed(list || []);
    } catch (e) {}
  }, []);

  // Initial load
  useEffect(() => {
    // 0. Load settings & bookmarks & shortcuts
    window.browserApi.getSettings?.().then((settings) => {
      if (settings) {
        if (settings.language) setLanguage(settings.language);
        if (settings.forceDarkMode !== undefined) setForceDarkMode(settings.forceDarkMode);
        if (settings.showBookmarksBar !== undefined) setShowBookmarksBar(settings.showBookmarksBar);
        if (settings.devModeEnabled !== undefined) setDevModeEnabled(settings.devModeEnabled);
      }
    });

    window.browserApi.getBookmarks?.().then((bms) => {
      if (bms) setBookmarks(bms);
    });

    window.browserApi.getShortcuts?.().then((scs) => {
      if (scs) setShortcuts(scs);
    });

    refreshRecentlyClosed();

    // 1. Listen for tab updates
    const unbindTabs = window.browserApi.onTabsUpdated((updatedTabs, currentActiveId) => {
      setTabs(updatedTabs);
      setActiveTabId(currentActiveId);
      refreshRecentlyClosed();
    });

    // 2. Listen for media discovered via network sniffing
    const unbindMedia = window.browserApi.onMediaFound((tabId, item) => {
      setTabMediaMap((prev) => {
        const existing = prev[tabId] || [];
        if (existing.some((m) => m.url === item.url)) return prev;
        return {
          ...prev,
          [tabId]: [...existing, item],
        };
      });
    });

    // 3. Listen for ads blocked
    const unbindAdBlock = window.browserApi.onAdBlocked((_tabId, _url, _total) => {
      // stats update through onTabsUpdated
    });

    // 4. Load initial downloads & listen for downloads progress/completion
    window.browserApi.getDownloads?.().then((dls) => {
      if (dls) setDownloads(dls);
    });

    const unbindDlProgress = window.browserApi.onDownloadProgress?.((item) => {
      setDownloads((prev) => {
        const idx = prev.findIndex((d) => d.id === item.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = item;
          return next;
        }
        return [item, ...prev];
      });
    });

    const unbindDlComplete = window.browserApi.onDownloadComplete?.((item) => {
      setDownloads((prev) => {
        const idx = prev.findIndex((d) => d.id === item.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = item;
          return next;
        }
        return [item, ...prev];
      });
    });

    return () => {
      unbindTabs();
      unbindMedia();
      unbindAdBlock();
      unbindDlProgress?.();
      unbindDlComplete?.();
    };
  }, [refreshRecentlyClosed]);

  // Global Keyboard Shortcuts (Ctrl+Shift+T for restore tab, Ctrl+Shift+N for incognito, Ctrl+T for new tab)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Reopen closed tab: Ctrl + Shift + T (or Cmd + Shift + T)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        window.browserApi.restoreClosedTab().then(() => {
          refreshRecentlyClosed();
        });
      }
      // New Incognito Tab: Ctrl + Shift + N (or Cmd + Shift + N)
      else if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        window.browserApi.createIncognitoTab('bocchy://newtab');
      }
      // New Regular Tab: Ctrl + T (or Cmd + T)
      else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        window.browserApi.createTab('bocchy://newtab');
      }
      // F12 or Ctrl + Shift + I: Toggle DevTools
      else if (e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'i' || e.key === 'I'))) {
        e.preventDefault();
        if (activeTabId) window.browserApi.toggleDevTools(activeTabId);
      }
      // Zoom In: Ctrl + = or Ctrl + +
      else if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        if (activeTabId) window.browserApi.zoomIn(activeTabId);
      }
      // Zoom Out: Ctrl + -
      else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        if (activeTabId) window.browserApi.zoomOut(activeTabId);
      }
      // Reset Zoom: Ctrl + 0
      else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        if (activeTabId) window.browserApi.resetZoom(activeTabId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [refreshRecentlyClosed, activeTabId]);

  // Sync WebContentsView bounds when sidebar drawer opens/closes
  useEffect(() => {
    if (isMediaDrawerOpen) {
      window.browserApi.setSidebarWidth(420);
    } else if (isShieldOpen) {
      window.browserApi.setSidebarWidth(340);
    } else if (isSettingsOpen) {
      window.browserApi.setSidebarWidth(380);
    } else if (isDownloadsOpen) {
      window.browserApi.setSidebarWidth(360);
    } else {
      window.browserApi.setSidebarWidth(0);
    }
  }, [isMediaDrawerOpen, isShieldOpen, isSettingsOpen, isDownloadsOpen]);

  // Sync TopBar Height when Bookmarks bar is toggled or visible
  useEffect(() => {
    const hasBookmarksBar = showBookmarksBar && bookmarks.length > 0;
    const height = hasBookmarksBar ? 108 : 78;
    window.browserApi.setTopBarHeight(height);
  }, [showBookmarksBar, bookmarks.length]);

  const isNewTabUrl = (url?: string) => !url || url === 'bocchy://newtab' || url === 'nexus://newtab' || url === 'about:blank';
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const isNewTabPage = !activeTab || isNewTabUrl(activeTab.url);
  const currentTabMedia = (activeTabId && tabMediaMap[activeTabId]) || [];

  // Check if current tab is bookmarked
  const isBookmarked = Boolean(
    activeTab?.url &&
      !isNewTabUrl(activeTab.url) &&
      bookmarks.some((b) => b.url.toLowerCase() === activeTab.url.toLowerCase())
  );

  // Tab Actions
  const handleSelectTab = (tabId: string) => {
    window.browserApi.switchTab(tabId);
  };

  const handleCloseTab = (tabId: string) => {
    window.browserApi.closeTab(tabId);
  };

  const handleNewTab = () => {
    window.browserApi.createTab('bocchy://newtab');
  };

  const handleNewIncognitoTab = () => {
    window.browserApi.createIncognitoTab('bocchy://newtab');
  };

  const handleRestoreClosedTab = async () => {
    await window.browserApi.restoreClosedTab();
    refreshRecentlyClosed();
  };

  const handleNavigate = (url: string) => {
    if (activeTabId) {
      window.browserApi.navigate(activeTabId, url);
    }
  };

  const handleBack = () => {
    if (activeTabId) window.browserApi.goBack(activeTabId);
  };

  const handleForward = () => {
    if (activeTabId) window.browserApi.goForward(activeTabId);
  };

  const handleReload = () => {
    if (activeTabId) window.browserApi.reload(activeTabId);
  };

  // Dark Mode Toggle
  const handleToggleForceDarkMode = async () => {
    const nextState = !forceDarkMode;
    setForceDarkMode(nextState);
    await window.browserApi.toggleForceDarkMode(nextState);
  };

  // Bookmarks Toggle
  const handleToggleBookmark = async () => {
    if (!activeTab?.url || isNewTabUrl(activeTab.url)) return;
    if (isBookmarked) {
      await window.browserApi.removeBookmark(activeTab.url);
      setBookmarks((prev) => prev.filter((b) => b.url.toLowerCase() !== activeTab.url.toLowerCase()));
    } else {
      const added = await window.browserApi.addBookmark({
        title: activeTab.title || activeTab.url,
        url: activeTab.url,
        favicon: activeTab.favicon,
      });
      setBookmarks((prev) => [added, ...prev.filter((b) => b.id !== added.id)]);
    }
  };

  const handleRemoveBookmark = async (id: string) => {
    await window.browserApi.removeBookmark(id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleToggleBookmarksBar = async () => {
    const next = !showBookmarksBar;
    setShowBookmarksBar(next);
    await window.browserApi.updateSettings({ showBookmarksBar: next });
  };

  // Shortcuts Actions
  const handleAddShortcut = async (item: { title: string; url: string; color?: string }) => {
    const added = await window.browserApi.addShortcut(item);
    setShortcuts((prev) => [...prev, added]);
  };

  const handleRemoveShortcut = async (id: string) => {
    await window.browserApi.removeShortcut(id);
    setShortcuts((prev) => prev.filter((s) => s.id !== id));
  };

  // Shield & AdBlock Actions
  const handleToggleAdBlock = async () => {
    if (activeTabId) {
      await window.browserApi.toggleAdBlocker(activeTabId);
    }
  };

  const handleToggleBlockGifAds = async () => {
    await window.browserApi.toggleBlockGifAds();
  };

  const handleToggleBlockRedirects = async () => {
    await window.browserApi.toggleBlockRedirects();
  };

  // Media Actions
  const handleRefreshScan = async () => {
    if (!activeTabId) return;
    setIsScanning(true);
    try {
      const items = await window.browserApi.extractDomMedia(activeTabId);
      setTabMediaMap((prev) => {
        const existing = prev[activeTabId] || [];
        const combined = [...existing];
        items.forEach((newItem) => {
          if (!combined.some((m) => m.url === newItem.url)) {
            combined.push(newItem);
          }
        });
        return { ...prev, [activeTabId]: combined };
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handlePickSection = async () => {
    if (!activeTabId) return;
    setIsScanning(true);
    try {
      const items = await window.browserApi.pickSectionMedia(activeTabId);
      if (items && items.length > 0) {
        setTabMediaMap((prev) => {
          const existing = prev[activeTabId] || [];
          const combined = [...existing];
          items.forEach((newItem) => {
            if (!combined.some((m) => m.url === newItem.url)) {
              combined.unshift(newItem);
            }
          });
          return { ...prev, [activeTabId]: combined };
        });
      }
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#121214] overflow-hidden select-none">
      {/* Top Bar Container: TabBar (40px) + NavigationBar (38px) + optional BookmarksBar (30px) */}
      <header className="flex-shrink-0 z-30">
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
          onNewTab={handleNewTab}
          onNewIncognitoTab={handleNewIncognitoTab}
          onRestoreClosedTab={handleRestoreClosedTab}
          canRestoreClosed={recentlyClosed.length > 0}
        />
        <NavigationBar
          activeTab={activeTab}
          mediaCount={currentTabMedia.length}
          language={language}
          isBookmarked={isBookmarked}
          forceDarkMode={forceDarkMode}
          showBookmarksBar={showBookmarksBar}
          devModeEnabled={devModeEnabled}
          onNavigate={handleNavigate}
          onBack={handleBack}
          onForward={handleForward}
          onReload={handleReload}
          onToggleShield={() => {
            setIsShieldOpen(!isShieldOpen);
            setIsMediaDrawerOpen(false);
            setIsSettingsOpen(false);
            setIsDownloadsOpen(false);
          }}
          onToggleMediaDrawer={() => {
            setIsMediaDrawerOpen(!isMediaDrawerOpen);
            setIsShieldOpen(false);
            setIsSettingsOpen(false);
            setIsDownloadsOpen(false);
          }}
          onToggleSettings={() => {
            setIsSettingsOpen(!isSettingsOpen);
            setIsShieldOpen(false);
            setIsMediaDrawerOpen(false);
            setIsDownloadsOpen(false);
          }}
          isDownloadsOpen={isDownloadsOpen}
          onToggleDownloads={() => {
            setIsDownloadsOpen(!isDownloadsOpen);
            setIsShieldOpen(false);
            setIsMediaDrawerOpen(false);
            setIsSettingsOpen(false);
          }}
          activeDownloadsCount={downloads.filter((d) => d.state === 'progressing').length}
          onToggleBookmark={handleToggleBookmark}
          onToggleForceDarkMode={handleToggleForceDarkMode}
          onToggleBookmarksBar={handleToggleBookmarksBar}
          onToggleUpdateLog={() => setIsUpdateLogOpen(true)}
          onToggleDevTools={() => {
            if (activeTabId) window.browserApi.toggleDevTools(activeTabId);
          }}
          onZoomIn={() => {
            if (activeTabId) window.browserApi.zoomIn(activeTabId);
          }}
          onZoomOut={() => {
            if (activeTabId) window.browserApi.zoomOut(activeTabId);
          }}
          onResetZoom={() => {
            if (activeTabId) window.browserApi.resetZoom(activeTabId);
          }}
          onSetZoom={(factor) => {
            if (activeTabId) window.browserApi.setTabZoom(activeTabId, factor);
          }}
          isMediaDrawerOpen={isMediaDrawerOpen}
          isShieldOpen={isShieldOpen}
          isSettingsOpen={isSettingsOpen}
        />
        {showBookmarksBar && bookmarks.length > 0 && (
          <BookmarksBar
            bookmarks={bookmarks}
            onNavigate={handleNavigate}
            onOpenInNewTab={(url) => window.browserApi.createTab(url)}
            onRemoveBookmark={handleRemoveBookmark}
          />
        )}
      </header>

      {/* Main Content Area:
          If current tab is nexus://newtab, render the React NewTabPage!
          If browsing a real site, WebContentsView is rendered natively by Electron above this layer */}
      <div className="flex-1 relative w-full overflow-hidden flex flex-col">
        {isNewTabPage && (
          <NewTabPage
            language={language}
            shortcuts={shortcuts}
            bookmarks={bookmarks}
            recentlyClosed={recentlyClosed}
            onNavigate={handleNavigate}
            onOpenInNewTab={(url) => window.browserApi.createTab(url)}
            onAddShortcut={handleAddShortcut}
            onRemoveShortcut={handleRemoveShortcut}
            onRestoreClosedTab={handleRestoreClosedTab}
          />
        )}
      </div>

      {/* Popovers / Drawers */}
      <AdShieldModal
        isOpen={isShieldOpen}
        onClose={() => setIsShieldOpen(false)}
        activeTab={activeTab}
        onToggleAdBlock={handleToggleAdBlock}
        onToggleBlockGifAds={handleToggleBlockGifAds}
        onToggleBlockRedirects={handleToggleBlockRedirects}
      />

      <MediaDrawer
        isOpen={isMediaDrawerOpen}
        onClose={() => setIsMediaDrawerOpen(false)}
        mediaItems={currentTabMedia}
        onRefreshScan={handleRefreshScan}
        onPickSection={handlePickSection}
        onOpenInTab={handleNavigate}
        isScanning={isScanning}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        language={language}
        onLanguageChange={(newLang) => setLanguage(newLang)}
        forceDarkMode={forceDarkMode}
        onToggleForceDarkMode={handleToggleForceDarkMode}
        showBookmarksBar={showBookmarksBar}
        onToggleBookmarksBar={handleToggleBookmarksBar}
        devModeEnabled={devModeEnabled}
        onToggleDevMode={async () => {
          const next = !devModeEnabled;
          setDevModeEnabled(next);
          await window.browserApi.updateSettings({ devModeEnabled: next });
        }}
        onOpenUpdateLog={() => setIsUpdateLogOpen(true)}
      />

      <DownloadsFlyout
        isOpen={isDownloadsOpen}
        onClose={() => setIsDownloadsOpen(false)}
        downloads={downloads}
        onCancelDownload={(id) => window.browserApi.cancelDownload?.(id)}
        onClearHistory={() => {
          window.browserApi.clearDownloadsHistory?.();
          setDownloads((prev) => prev.filter((d) => d.state === 'progressing'));
        }}
        language={language}
      />

      <UpdateLogModal
        isOpen={isUpdateLogOpen}
        onClose={() => setIsUpdateLogOpen(false)}
        language={language}
      />
    </div>
  );
};

export default App;
