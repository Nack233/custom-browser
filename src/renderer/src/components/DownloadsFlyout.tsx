import React, { useEffect } from 'react';
import type { DownloadItemInfo } from '../../types/browser';
import {
  Download,
  X,
  FolderOpen,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Film,
  Image as ImageIcon,
  Archive,
  Music,
  ExternalLink,
  Folder,
  Sparkles,
} from 'lucide-react';
import type { Language } from '../i18n';
import { translations } from '../i18n';

interface DownloadsFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
  downloads: DownloadItemInfo[];
  onCancelDownload: (id: string) => void;
  onClearHistory: () => void;
  language: Language;
  topOffset?: number;
  isFloatingModal?: boolean;
}

export const DownloadsFlyout: React.FC<DownloadsFlyoutProps> = ({
  isOpen,
  onClose,
  downloads,
  onCancelDownload,
  onClearHistory,
  language,
  topOffset = 92,
  isFloatingModal = false,
}) => {
  if (!isOpen) return null;

  const t = translations[language] || translations.th;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const formatBytes = (bytes?: number): string => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatSpeed = (bytesPerSec?: number): string => {
    if (!bytesPerSec || bytesPerSec <= 0) return '';
    return `${formatBytes(bytesPerSec)}/s`;
  };

  const getFileIcon = (filename: string, isZip?: boolean, mimeType?: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (isZip || ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return (
        <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
          <Archive className="w-4 h-4 text-amber-400" />
        </div>
      );
    }
    if (['mp4', 'mkv', 'webm', 'mov', 'avi'].includes(ext) || mimeType?.includes('video')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
          <Film className="w-4 h-4 text-rose-400" />
        </div>
      );
    }
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif'].includes(ext) || mimeType?.includes('image')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
          <ImageIcon className="w-4 h-4 text-emerald-400" />
        </div>
      );
    }
    if (['mp3', 'wav', 'ogg', 'flac'].includes(ext) || mimeType?.includes('audio')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
          <Music className="w-4 h-4 text-purple-400" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
        <FileText className="w-4 h-4 text-blue-400" />
      </div>
    );
  };

  const handleOpenFile = (path?: string) => {
    if (path) {
      window.browserApi.openDownloadFile(path);
    }
  };

  const handleShowInFolder = (path?: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (path) {
      window.browserApi.showItemInFolder(path);
    }
  };

  const handleOpenDownloadsFolder = () => {
    window.browserApi.openDownloadsFolder();
  };

  const containerClass = isFloatingModal
    ? 'w-full h-full max-h-[510px] flex flex-col bg-[#18181f]/95 backdrop-blur-2xl border border-pink-500/30 rounded-2xl shadow-2xl overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150'
    : 'fixed right-3 z-50 w-[380px] max-h-[75vh] flex flex-col bg-[#18181f]/95 backdrop-blur-2xl border border-pink-500/30 rounded-2xl shadow-2xl overflow-hidden select-none animate-in fade-in slide-in-from-top-2 duration-150';

  return (
    <div
      className={containerClass}
      style={isFloatingModal ? undefined : { top: `${topOffset + 4}px` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a38] bg-[#14141a]/70">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 shadow-xs">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xs font-bold text-gray-100">{t.downloadsFlyoutTitle || 'Downloads'}</h2>
              {downloads.filter((d) => d.state === 'progressing').length > 0 && (
                <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-pink-500/25 text-pink-300 border border-pink-500/40 rounded-full animate-pulse">
                  {downloads.filter((d) => d.state === 'progressing').length} active
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-400">
              {language === 'th' ? 'การดาวน์โหลดและประวัติไฟล์' : 'Downloads & File History'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={handleOpenDownloadsFolder}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title={t.openDownloadsFolder || 'Open downloads folder'}
          >
            <Folder className="w-4 h-4" />
          </button>
          {downloads.some((d) => d.state !== 'progressing') && (
            <button
              onClick={onClearHistory}
              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
              title={t.clearDownloads || 'Clear history'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Downloads List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {downloads.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 py-16">
            <div className="w-12 h-12 rounded-full bg-[#1e1e26] flex items-center justify-center mb-3">
              <Download className="w-6 h-6 text-gray-600" />
            </div>
            <p className="text-xs font-medium text-gray-400">{t.noDownloads || 'No downloads yet'}</p>
            <button
              onClick={handleOpenDownloadsFolder}
              className="mt-4 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#20202a] hover:bg-[#282836] text-gray-300 text-xs transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>{t.openDownloadsFolder || 'Open downloads folder'}</span>
            </button>
          </div>
        ) : (
          downloads.map((item) => {
            const isProgressing = item.state === 'progressing';
            const isCompleted = item.state === 'completed';
            const isFailed = item.state === 'interrupted' || item.state === 'cancelled';
            const percent =
              item.totalBytes > 0
                ? Math.min(100, Math.round((item.receivedBytes / item.totalBytes) * 100))
                : item.receivedBytes > 0
                ? Math.min(99, Math.round(item.receivedBytes % 100))
                : 0;

            return (
              <div
                key={item.id}
                onClick={() => isCompleted && handleOpenFile(item.savePath)}
                className={`p-2.5 rounded-xl border transition-all ${
                  isProgressing
                    ? 'border-blue-500/40 bg-[#161b24]'
                    : isCompleted
                    ? 'border-[#262632] bg-[#191922] hover:border-[#353545] cursor-pointer'
                    : 'border-[#262632] bg-[#16161d] opacity-70'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {getFileIcon(item.filename, item.isZip, item.mimeType)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-200 truncate pr-2" title={item.filename}>
                        {item.filename}
                      </p>
                      {isCompleted && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      )}
                      {isFailed && (
                        <AlertCircle className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                      )}
                    </div>

                    {/* Progress details */}
                    {isProgressing && (
                      <div className="mt-1.5 space-y-1">
                        <div className="w-full h-1.5 bg-[#252533] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                            style={{ width: `${Math.max(5, percent)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                          <span>
                            {formatBytes(item.receivedBytes)}
                            {item.totalBytes > 0 ? ` / ${formatBytes(item.totalBytes)}` : ''}
                          </span>
                          <span>
                            {item.speed && item.speed > 0 ? `${formatSpeed(item.speed)} • ` : ''}
                            {percent}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Completed details & Actions */}
                    {isCompleted && (
                      <div className="mt-1.5 flex items-center justify-between text-[11px]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenFile(item.savePath);
                          }}
                          className="text-blue-400 hover:text-blue-300 font-medium hover:underline flex items-center space-x-1"
                        >
                          <span>{t.openFile || 'Open file'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] text-gray-500 font-mono">
                            {formatBytes(item.receivedBytes || item.totalBytes)}
                          </span>
                          <button
                            onClick={(e) => handleShowInFolder(item.savePath, e)}
                            className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#252535] transition-colors"
                            title={t.showInFolder || 'Show in folder'}
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Cancelled / Failed details */}
                    {isFailed && (
                      <div className="mt-1 flex items-center justify-between text-[10px] text-gray-500">
                        <span>{item.state === 'cancelled' ? t.cancelled : t.interrupted}</span>
                        {item.savePath && (
                          <button
                            onClick={(e) => handleShowInFolder(item.savePath, e)}
                            className="text-gray-400 hover:text-white underline"
                          >
                            {t.showInFolder}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Cancel button during download */}
                  {isProgressing && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCancelDownload(item.id);
                      }}
                      className="p-1 rounded text-gray-400 hover:text-rose-400 hover:bg-[#252535] transition-colors flex-shrink-0"
                      title={t.cancel || 'Cancel'}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[#2a2a38] bg-[#14141a]/80 flex items-center justify-between">
        <button
          onClick={handleOpenDownloadsFolder}
          className="w-full py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-medium transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
        >
          <FolderOpen className="w-3.5 h-3.5 text-pink-400" />
          <span>{t.openDownloadsFolder || 'Open downloads folder'}</span>
        </button>
      </div>
    </div>
  );
};
