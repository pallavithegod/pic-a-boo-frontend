import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon, FolderOpen, Search as SearchIcon, Plus, X, Trash2 } from 'lucide-react';

import GalleryGrid from './components/GalleryGrid';
import LightboxModal from './components/LightboxModal';
import UploadDropzone from './components/UploadDropzone';
import FloatingUploadStatus from './components/FloatingUploadStatus';
import SearchView from './components/SearchView';
import AlbumsView from './components/AlbumsView';

import { fetchImages, uploadLocalFile, saveImageMetadata, deleteImage } from './services/api';
import { compressImage, getImageDimensions, generateBlurPlaceholder } from './utils/imageUtils';

// ── Custom Logo ───────────────────────────────────────────────────
const LogoIcon = ({ className, style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="20" height="16" rx="4" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="2" fill="var(--accent)" />
    <path d="M12 4V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// ── Tab definitions ───────────────────────────────────────────────
const TABS = [
  { id: 'photos', label: 'Photos', Icon: ImageIcon },
  { id: 'albums', label: 'Albums', Icon: FolderOpen },
  { id: 'search', label: 'Search', Icon: SearchIcon },
];

export default function App() {
  const [tab, setTab] = useState('photos');
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const fileInputRef = useRef(null);

  // ── Load gallery on mount ───────────────────────────────────────
  useEffect(() => {
    fetchImages()
      .then(setImages)
      .catch((err) => console.error('Failed to load images:', err))
      .finally(() => setIsLoading(false));
  }, []);

  // ── "/" shortcut → search tab ───────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      if (e.key === '/') { e.preventDefault(); setTab('search'); }
      if (e.key === 'Escape' && selectionMode) clearSelection();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectionMode]);

  // ── Upload pipeline ─────────────────────────────────────────────
  const handleFilesInput = useCallback((files) => {
    Array.from(files).forEach(async (file) => {
      const itemId = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
      const filename = file.name;

      setUploadQueue((q) => [{ id: itemId, filename, status: 'queued', progress: 0 }, ...q]);

      try {
        // 1. Compress
        setUploadQueue((q) => q.map((i) => i.id === itemId ? { ...i, status: 'compressing', progress: 10 } : i));
        const compressed = await compressImage(file);

        // 2. Dimensions + blur
        const dims = await getImageDimensions(compressed);
        const blur = await generateBlurPlaceholder(compressed);

        // 3. Read as base64
        setUploadQueue((q) => q.map((i) => i.id === itemId ? { ...i, status: 'uploading', progress: 30 } : i));
        const publicUrl = await uploadLocalFile(compressed, (pct) => {
          setUploadQueue((q) => q.map((i) => i.id === itemId ? { ...i, progress: 30 + Math.round(pct * 0.6) } : i));
        });

        // 4. Save metadata
        setUploadQueue((q) => q.map((i) => i.id === itemId ? { ...i, status: 'saving', progress: 95 } : i));
        const saved = await saveImageMetadata({
          id: itemId,
          key: '',
          publicUrl,
          filename,
          width: dims.width,
          height: dims.height,
          aspectRatio: dims.aspectRatio,
          blurDataUrl: blur,
          timestamp: new Date().toISOString(),
        });

        // 5. Done
        setUploadQueue((q) => q.map((i) => i.id === itemId ? { ...i, status: 'complete', progress: 100 } : i));
        setImages((prev) => [saved, ...prev]);
      } catch (err) {
        console.error('Upload failed:', err);
        setUploadQueue((q) => q.map((i) =>
          i.id === itemId ? { ...i, status: 'failed', error: err.message || 'Failed' } : i
        ));
      }
    });
  }, []);

  // ── Delete ──────────────────────────────────────────────────────
  const handleDelete = useCallback(async (id) => {
    try {
      await deleteImage(id);
      setImages((prev) => prev.filter((img) => img.id !== id));
      setLightboxIndex((idx) => {
        if (idx === null) return null;
        const remaining = images.filter((img) => img.id !== id);
        if (remaining.length === 0) return null;
        return Math.min(idx, remaining.length - 1);
      });
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  }, [images]);

  // ── Selection ───────────────────────────────────────────────────
  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    setSelectionMode(true);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    setSelectionMode(false);
  }, []);

  const deleteSelected = useCallback(async () => {
    if (!confirm(`Delete ${selectedIds.length} photo${selectedIds.length > 1 ? 's' : ''}?`)) return;
    for (const id of selectedIds) {
      try { await deleteImage(id); } catch { /* continue */ }
    }
    setImages((prev) => prev.filter((img) => !selectedIds.includes(img.id)));
    clearSelection();
  }, [selectedIds, clearSelection]);

  // ── Lightbox ────────────────────────────────────────────────────
  const openLightbox = useCallback((id) => {
    const idx = images.findIndex((img) => img.id === id);
    if (idx !== -1) setLightboxIndex(idx);
  }, [images]);

  return (
    <div
      className="flex flex-col h-screen overflow-hidden no-select"
      style={{ background: 'var(--surface-0)', color: 'var(--text-primary)' }}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header
        className="shrink-0 flex items-center justify-between px-4 md:px-6"
        style={{
          height: 56,
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--surface-1)',
        }}
      >
        <AnimatePresence mode="wait">
          {selectionMode ? (
            <motion.div
              key="selection-bar"
              className="flex items-center justify-between w-full"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <motion.button
                onClick={clearSelection}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                whileHover={{ backgroundColor: 'var(--surface-2)' }}
                whileTap={{ scale: 0.95 }}
                aria-label="Cancel selection"
              >
                <X className="w-5 h-5" />
              </motion.button>
              <span className="text-[14px] font-semibold">
                {selectedIds.length} selected
              </span>
              <motion.button
                onClick={deleteSelected}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-colors"
                style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.08)' }}
                whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.14)' }}
                whileTap={{ scale: 0.95 }}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="normal-bar"
              className="flex items-center justify-between w-full"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
            >
              {/* App title */}
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--accent-soft)', border: '1px solid rgba(209, 50, 45, 0.2)' }}
                >
                  <LogoIcon className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                </div>
                <h1
                  className="text-[20px] uppercase tracking-widest font-bold"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginTop: '4px' }}
                >
                  PIC-A-BOO
                </h1>
              </div>

              {/* Upload button */}
              {tab === 'photos' && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.length) handleFilesInput(e.target.files);
                      e.target.value = '';
                    }}
                  />
                  <motion.button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 pl-3 pr-4 py-2 rounded-xl text-[13px] font-semibold transition-colors"
                    style={{
                      background: 'var(--accent)',
                      color: '#ffffff',
                    }}
                    whileHover={{ scale: 1.02, filter: 'brightness(1.08)' }}
                    whileTap={{ scale: 0.96 }}
                    title="Upload images"
                  >
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                    Upload
                  </motion.button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Tab navigation (integrated in header area) ────────────── */}
      {!selectionMode && (
        <nav
          className="shrink-0 flex items-center gap-1 px-4 md:px-6 py-1"
          style={{
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--surface-1)',
          }}
        >
          {TABS.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <motion.button
                key={id}
                onClick={() => { setTab(id); if (selectionMode) clearSelection(); }}
                className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors"
                style={{
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  background: active ? 'var(--accent-soft)' : 'transparent',
                }}
                whileHover={{
                  backgroundColor: active ? undefined : 'var(--surface-2)',
                }}
                whileTap={{ scale: 0.97 }}
              >
                <Icon className="w-4 h-4" />
                {label}
              </motion.button>
            );
          })}
        </nav>
      )}

      {/* ── Main content ───────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--surface-0)' }}>
        <AnimatePresence mode="wait">
          {tab === 'photos' && (
            <motion.div
              key="photos"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <GalleryGrid
                images={images}
                isLoading={isLoading}
                onSelectImage={openLightbox}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
              />
            </motion.div>
          )}
          {tab === 'albums' && (
            <motion.div
              key="albums"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <AlbumsView images={images} />
            </motion.div>
          )}
          {tab === 'search' && (
            <motion.div
              key="search"
              className="h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <SearchView images={images} onSelectImage={openLightbox} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Drag & Drop overlay ────────────────────────────────────── */}
      <UploadDropzone onFilesDropped={handleFilesInput} />

      {/* ── Upload status (liquid glass) ───────────────────────────── */}
      <FloatingUploadStatus
        queue={uploadQueue}
        onClearCompleted={() =>
          setUploadQueue((q) => q.filter((i) => i.status !== 'complete' && i.status !== 'failed'))
        }
      />

      {/* ── Lightbox ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <LightboxModal
            images={images}
            currentIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onPrev={() => setLightboxIndex((i) => (i === 0 ? images.length - 1 : i - 1))}
            onNext={() => setLightboxIndex((i) => (i === images.length - 1 ? 0 : i + 1))}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
