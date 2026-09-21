import React, { useState, useEffect } from 'react';
import type { MediaItem } from '../../types/browser';
import {
  X,
  Download,
  Copy,
  ExternalLink,
  Film,
  Image as ImageIcon,
  Radio,
  RefreshCw,
  Check,
  MousePointerClick,
  CheckSquare,
  Square,
  LayoutGrid,
  List,
  Ban,
  RotateCcw,
  Archive,
  FolderOpen,
} from 'lucide-react';

interface MediaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItems: MediaItem[];
  onRefreshScan: () => void;
  onPickSection: () => void;
  onOpenInTab: (url: string) => void;
  isScanning: boolean;
  topOffset?: number;
  isFloatingModal?: boolean;
}

export const MediaDrawer: React.FC<MediaDrawerProps> = ({
  isOpen,
  onClose,
  mediaItems,
  onRefreshScan,
  onPickSection,
  onOpenInTab,
  isScanning,
  topOffset = 92,
  isFloatingModal = false,
}) => {
  const [filter, setFilter] = useState<'all' | 'video' | 'image'>('all');
  const [hideGifs, setHideGifs] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState<{ current: number; total: number; percent: number; status: string } | null>(null);
  const [zipResultPath, setZipResultPath] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const unbind = window.browserApi.onZipProgress?.((data) => {
      setZipProgress(data);
      if (data.percent >= 100) {
        setTimeout(() => {
          setIsZipping(false);
        }, 1200);
      }
    });
    return () => unbind?.();
  }, []);

  const handleDownloadZip = async () => {
    const itemsToZip = filteredItems.filter((m) => selectedIds.has(m.id));
    if (itemsToZip.length === 0) return;

    setIsZipping(true);
    setZipProgress({ current: 0, total: itemsToZip.length, percent: 0, status: 'เริ่มดาวน์โหลดและบีบอัด...' });
    setZipResultPath(null);

    try {
      const res = await window.browserApi.downloadZip(itemsToZip, `Manga_Chapter_${Date.now()}`);
      if (res.success && res.path) {
        setZipResultPath(res.path);
        setToastMessage(`สร้างไฟล์ ZIP สำเร็จแล้ว! (${((res.sizeBytes || 0) / (1024 * 1024)).toFixed(1)} MB)`);
        setTimeout(() => setToastMessage(null), 4000);
      } else if (res.error) {
        setToastMessage(`เกิดข้อผิดพลาด: ${res.error}`);
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (e: any) {
      console.error('ZIP error:', e);
    } finally {
      setIsZipping(false);
    }
  };

  if (!isOpen) return null;

  const filteredItems = mediaItems.filter((item) => {
    if (hideGifs && (item.url.toLowerCase().includes('.gif') || item.mimeType?.includes('gif'))) {
      return false;
    }
    if (filter === 'all') return true;
    if (filter === 'video') return item.type === 'video' || item.type === 'stream';
    if (filter === 'image') return item.type === 'image';
    return true;
  });

  // Handle click with Shift + Click for range selection
  const handleItemClick = (item: MediaItem, index: number, event: React.MouseEvent) => {
    const isShift = event.shiftKey;

    if (isShift && lastClickedIndex !== null && lastClickedIndex !== index) {
      // Range selection from lastClickedIndex to index
      const start = Math.min(lastClickedIndex, index);
      const end = Math.max(lastClickedIndex, index);
      const next = new Set(selectedIds);

      for (let i = start; i <= end; i++) {
        if (filteredItems[i]) {
          next.add(filteredItems[i].id);
        }
      }
      setSelectedIds(next);
      setToastMessage(`เลือกเพิ่มตั้งแต่ลำดับ ${start + 1} ถึง ${end + 1} (${next.size} รูป)`);
      setTimeout(() => setToastMessage(null), 2000);
    } else {
      // Normal toggle for the exact clicked item
      const next = new Set(selectedIds);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }
      setSelectedIds(next);
      setLastClickedIndex(index);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((i) => i.id)));
    }
  };

  const handleInvertSelection = () => {
    const next = new Set<string>();
    filteredItems.forEach((i) => {
      if (!selectedIds.has(i.id)) next.add(i.id);
    });
    setSelectedIds(next);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
    setLastClickedIndex(null);
  };

  const handleCopy = (item: MediaItem, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleDownloadSingle = async (item: MediaItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloadingId(item.id);
    try {
      const res = await window.browserApi.downloadMedia(item.url);
      if (res.success) {
        setToastMessage(`Saved to Downloads!`);
      } else {
        setToastMessage('Download failed.');
      }
    } catch {
      setToastMessage('Download error.');
    } finally {
      setDownloadingId(null);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleBatchDownload = async () => {
    if (selectedIds.size === 0) return;
    setIsBatchDownloading(true);
    const itemsToDownload = filteredItems.filter((i) => selectedIds.has(i.id));
    setBatchProgress({ current: 0, total: itemsToDownload.length });
    let successCount = 0;

    for (let i = 0; i < itemsToDownload.length; i++) {
      const item = itemsToDownload[i];
      setBatchProgress({ current: i + 1, total: itemsToDownload.length });
      try {
        const res = await window.browserApi.downloadMedia(item.url);
        if (res.success) successCount++;
      } catch {}
    }

    setToastMessage(`ดาวน์โหลดสำเร็จ ${successCount} ไฟล์ลงใน Downloads!`);
    setIsBatchDownloading(false);
    setBatchProgress(null);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const allSelected = filteredItems.length > 0 && selectedIds.size === filteredItems.length;

  const containerClass = isFloatingModal
    ? 'w-full h-full max-h-[590px] flex flex-col bg-[#18181f]/95 backdrop-blur-2xl border border-pink-500/30 rounded-2xl shadow-2xl overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150'
    : 'fixed right-3 z-50 w-[420px] max-h-[75vh] flex flex-col bg-[#18181f]/95 backdrop-blur-2xl border border-pink-500/30 rounded-2xl shadow-2xl overflow-hidden select-none animate-in fade-in slide-in-from-top-2 duration-150';

  return (
    <div
      className={containerClass}
      style={isFloatingModal ? undefined : { top: `${topOffset + 4}px` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a38] bg-[#14141a]/70">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xs">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xs font-bold text-gray-100">Media Extractor</h2>
              <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-1.5 py-0.2 rounded-full font-mono font-bold">
                {mediaItems.length}
              </span>
            </div>
            <p className="text-[10px] text-gray-400">ดึงรูปภาพ วิดีโอ และสตรีมมีเดีย</p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {/* View Mode Toggle: Grid vs List */}
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title={viewMode === 'grid' ? 'Switch to List view' : 'Switch to Grid view'}
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
          </button>
          <button
            onClick={onRefreshScan}
            disabled={isScanning}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Scan whole page DOM"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pick Section on Page Action Bar */}
      <div className="p-2.5 bg-[#141419] border-b border-[#22222a] flex items-center justify-between space-x-2">
        <button
          onClick={onPickSection}
          disabled={isScanning}
          className="flex-1 flex items-center justify-center space-x-2 py-1.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-medium shadow-md shadow-emerald-950/40 transition-all active:scale-95 disabled:opacity-50"
          title="จิ้มเลือกส่วนในหน้าเว็บเพื่อดึงเฉพาะภาพในหมวดนั้น"
        >
          <MousePointerClick className="w-3.5 h-3.5" />
          <span>🎯 จิ้มเลือกส่วนในหน้าเว็บ</span>
        </button>

        {/* Hide GIFs Toggle (removes gambling banners) */}
        <button
          onClick={() => setHideGifs(!hideGifs)}
          className={`flex items-center space-x-1 py-1.5 px-2.5 rounded-lg text-xs font-medium transition-colors border ${
            hideGifs
              ? 'bg-rose-950/50 border-rose-500/40 text-rose-300'
              : 'bg-[#202028] border-[#2c2c36] text-gray-400 hover:text-gray-200'
          }`}
          title="ซ่อนไฟล์ .GIF (แบนเนอร์โฆษณาเว็บ)"
        >
          <Ban className="w-3.5 h-3.5" />
          <span>ซ่อน GIF</span>
        </button>
      </div>

      {/* Filter Tabs & Quick Selection Controls */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#202026] text-xs bg-[#15151b]">
        {/* Filter type */}
        <div className="flex space-x-1">
          {(['all', 'image', 'video'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-2 py-0.5 rounded capitalize font-medium text-[11px] transition-colors ${
                filter === t
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#1f1f26]'
              }`}
            >
              {t === 'video' ? 'Videos' : t === 'image' ? 'Images' : 'All'}
            </button>
          ))}
        </div>

        {/* Quick Selection Buttons */}
        <div className="flex items-center space-x-2 text-[11px]">
          <button
            onClick={handleSelectAll}
            className="flex items-center space-x-1 text-gray-400 hover:text-emerald-400 transition-colors"
          >
            {allSelected ? <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> : <Square className="w-3.5 h-3.5" />}
            <span>{allSelected ? 'ยกเลิก' : 'เลือกหมด'}</span>
          </button>

          {selectedIds.size > 0 && (
            <>
              <button
                onClick={handleInvertSelection}
                className="text-gray-400 hover:text-white transition-colors"
                title="สลับที่เลือก"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleClearSelection}
                className="text-gray-400 hover:text-rose-400 transition-colors"
                title="ล้างที่เลือก"
              >
                ล้าง ({selectedIds.size})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Hint Pill */}
      <div className="px-3 py-1 bg-[#101014] text-[10px] text-gray-500 border-b border-[#1c1c22] flex items-center justify-between">
        <span>💡 คลิกเพื่อเลือก / กด <b>Shift + คลิก</b> เพื่อเลือกทั้งช่วง</span>
        <span className="font-mono text-gray-400">
          แสดง {filteredItems.length} รายการ
        </span>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="mx-3 my-2 p-2 bg-emerald-950/90 border border-emerald-500/40 rounded-md text-xs text-emerald-200 text-center animate-pulse shadow-lg">
          {toastMessage}
        </div>
      )}

      {/* Media Item List / Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-gray-500 text-xs">
            <ImageIcon className="w-8 h-8 mb-2 opacity-40" />
            <p>ไม่พบมีเดียที่ตรงกับตัวกรอง</p>
            {hideGifs && <p className="text-[10px] text-rose-400/80 mt-1">กำลังเปิดตัวกรองซ่อน GIF อยู่</p>}
          </div>
        ) : viewMode === 'grid' ? (
          /* 2-Column Compact Grid View (Best for manga / photo galleries) */
          <div className="grid grid-cols-2 gap-2 pb-16">
            {filteredItems.map((item, idx) => {
              const isSelected = selectedIds.has(item.id);
              return (
                <div
                  key={item.id}
                  onClick={(e) => handleItemClick(item, idx, e)}
                  className={`group relative rounded-lg border overflow-hidden cursor-pointer transition-all ${
                    isSelected
                      ? 'border-emerald-500 ring-2 ring-emerald-500/50 bg-[#16201b]'
                      : 'border-[#282834] bg-[#1a1a22] hover:border-[#3d3d4d]'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative h-28 bg-[#101014] flex items-center justify-center overflow-hidden">
                    {item.type === 'image' ? (
                      <img
                        src={item.url}
                        alt={item.alt || ''}
                        className="max-h-full max-w-full object-contain pointer-events-none"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center text-emerald-400">
                        <Film className="w-6 h-6 mb-1" />
                        <span className="text-[9px] font-mono uppercase">{item.type}</span>
                      </div>
                    )}

                    {/* Checkbox indicator */}
                    <div
                      className={`absolute top-1.5 left-1.5 p-0.5 rounded transition-colors ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-black/60 text-gray-400 group-hover:text-white'
                      }`}
                    >
                      {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                    </div>

                    {/* Order Index badge */}
                    <div className="absolute top-1.5 right-1.5 px-1 py-0.2 rounded text-[9px] font-mono bg-black/70 text-gray-300">
                      #{idx + 1}
                    </div>

                    {/* Dimensions */}
                    {(item.width || item.size) && (
                      <div className="absolute bottom-1.5 right-1.5 px-1 py-0.2 rounded text-[9px] font-mono bg-black/80 text-gray-300">
                        {item.width && item.height ? `${item.width}×${item.height}` : formatBytes(item.size)}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="p-1.5 flex items-center justify-between bg-[#15151c]">
                    <span className="text-[10px] text-gray-400 truncate max-w-[100px] font-mono">
                      {item.url.split('/').pop()?.split('?')[0] || `Item #${idx + 1}`}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => handleCopy(item, e)}
                        className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#252530]"
                        title="Copy URL"
                      >
                        {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={(e) => handleDownloadSingle(item, e)}
                        disabled={downloadingId === item.id}
                        className="p-1 rounded text-gray-400 hover:text-emerald-400 hover:bg-[#252530]"
                        title="Download this item"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Single Column Detail List View */
          <div className="space-y-2.5 pb-16">
            {filteredItems.map((item, idx) => {
              const isSelected = selectedIds.has(item.id);
              return (
                <div
                  key={item.id}
                  onClick={(e) => handleItemClick(item, idx, e)}
                  className={`group rounded-lg border overflow-hidden cursor-pointer transition-all ${
                    isSelected
                      ? 'border-emerald-500 ring-1 ring-emerald-500/40 bg-[#16201b]'
                      : 'border-[#282834] bg-[#1a1a22] hover:border-[#3d3d4d]'
                  }`}
                >
                  <div className="flex items-center p-2 space-x-3">
                    {/* Checkbox */}
                    <div className="flex-shrink-0 text-gray-400">
                      {isSelected ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4" />}
                    </div>

                    {/* Preview Thumbnail */}
                    <div className="w-16 h-16 bg-[#101014] rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.type === 'image' ? (
                        <img
                          src={item.url}
                          alt=""
                          className="max-h-full max-w-full object-contain pointer-events-none"
                        />
                      ) : (
                        <Film className="w-6 h-6 text-emerald-400" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] font-mono text-gray-400">#{idx + 1}</span>
                        <p className="text-xs text-gray-200 truncate font-mono" title={item.url}>
                          {item.url.split('/').pop()?.split('?')[0] || item.url}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 mt-1 text-[10px] text-gray-400 font-mono">
                        <span className="uppercase">{item.type}</span>
                        {item.width && item.height && <span>• {item.width}×{item.height}</span>}
                        {item.size && <span>• {formatBytes(item.size)}</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => handleCopy(item, e)}
                        className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-[#252530]"
                        title="Copy URL"
                      >
                        {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenInTab(item.url);
                        }}
                        className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-[#252530]"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDownloadSingle(item, e)}
                        disabled={downloadingId === item.id}
                        className="p-1.5 rounded text-gray-400 hover:text-emerald-400 hover:bg-[#252530]"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar when items selected */}
      {selectedIds.size > 0 && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-[#131317]/95 border-t border-emerald-500/40 shadow-2xl flex flex-col space-y-2 backdrop-blur-md z-30">
          {/* ZIP Progress Bar */}
          {isZipping && zipProgress && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-amber-300 font-mono">
                <span className="truncate">{zipProgress.status}</span>
                <span>{zipProgress.percent}%</span>
              </div>
              <div className="w-full bg-[#22222d] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-200"
                  style={{ width: `${zipProgress.percent}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex flex-col pr-2">
              <span className="text-xs font-semibold text-emerald-300">
                เลือกแล้ว {selectedIds.size} รายการ
              </span>
              <span className="text-[10px] text-gray-400">
                จากทั้งหมด {filteredItems.length} รูป
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Open Folder Button if ZIP completed */}
              {zipResultPath && !isZipping && (
                <button
                  onClick={() => window.browserApi.showItemInFolder(zipResultPath)}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-lg text-xs font-medium transition-colors"
                  title="เปิดโฟลเดอร์ที่บันทึกไฟล์ ZIP"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">เปิดโฟลเดอร์</span>
                </button>
              )}

              {/* Download as .ZIP Button */}
              <button
                onClick={handleDownloadZip}
                disabled={isZipping || isBatchDownloading}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-lg font-medium text-xs shadow-md shadow-amber-950/40 transition-all active:scale-95 disabled:opacity-50"
                title="รวมภาพทั้งหมดเป็นไฟล์ .ZIP ก้อนเดียว เรียง 001.jpg, 002.png"
              >
                <Archive className={`w-3.5 h-3.5 ${isZipping ? 'animate-spin' : ''}`} />
                <span>{isZipping ? 'กำลังบีบอัด...' : '📦 รวมเป็น .ZIP'}</span>
              </button>

              {/* Download Separate Files Button */}
              <button
                onClick={handleBatchDownload}
                disabled={isBatchDownloading || isZipping}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#252530] hover:bg-[#32323e] text-gray-200 hover:text-white rounded-lg font-medium text-xs border border-white/10 transition-all active:scale-95 disabled:opacity-50"
                title="ดาวน์โหลดแยกไฟล์เดี่ยวๆ ลงโฟลเดอร์"
              >
                <Download className={`w-3.5 h-3.5 ${isBatchDownloading ? 'animate-bounce' : ''}`} />
                <span>
                  {isBatchDownloading && batchProgress
                    ? `${batchProgress.current}/${batchProgress.total}`
                    : 'โหลดแยก'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
