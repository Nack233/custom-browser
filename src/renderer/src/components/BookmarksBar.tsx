import React from 'react';
import type { BookmarkItem } from '../../../types/browser';
import { Bookmark, Globe, X } from 'lucide-react';

interface BookmarksBarProps {
  bookmarks: BookmarkItem[];
  onNavigate: (url: string) => void;
  onOpenInNewTab?: (url: string) => void;
  onRemoveBookmark: (id: string) => void;
}

export const BookmarksBar: React.FC<BookmarksBarProps> = ({
  bookmarks,
  onNavigate,
  onOpenInNewTab,
  onRemoveBookmark,
}) => {
  if (bookmarks.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center h-[30px] px-3 bg-gradient-to-r from-[#140a1a]/95 via-[#110716]/90 to-[#0e0513]/95 backdrop-blur-xl border-b border-pink-500/15 space-x-1 select-none overflow-x-auto no-scrollbar z-20">
      <div className="flex items-center space-x-1.5 flex-1">
        <Bookmark className="w-3.5 h-3.5 text-amber-400 mr-1 flex-shrink-0 opacity-90 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]" />
        {bookmarks.map((bm) => (
          <div
            key={bm.id}
            onClick={() => onNavigate(bm.url)}
            onAuxClick={(e) => {
              // Middle click opens in new tab
              if (e.button === 1 && onOpenInNewTab) {
                e.preventDefault();
                onOpenInNewTab(bm.url);
              }
            }}
            className="group flex items-center h-6 px-2.5 rounded-full text-xs text-pink-200/80 hover:text-white hover:bg-pink-500/20 hover:border-pink-400/30 border border-transparent cursor-pointer transition-all max-w-[180px] flex-shrink-0 shadow-sm"
            title={`${bm.title}\n${bm.url} (Middle-click to open in new tab)`}
          >
            {bm.favicon ? (
              <img
                src={bm.favicon}
                alt=""
                className="w-3.5 h-3.5 rounded-sm mr-1.5 object-contain flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <Globe className="w-3 h-3 text-pink-400/50 mr-1.5 flex-shrink-0" />
            )}
            <span className="truncate flex-1 text-[11px] font-medium">{bm.title || bm.url}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveBookmark(bm.id);
              }}
              className="ml-1 p-0.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-pink-500/30 text-pink-300/60 hover:text-white transition-opacity"
              title="Remove Bookmark"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
