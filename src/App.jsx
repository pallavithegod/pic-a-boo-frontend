import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, Plus, X, Trash2, CheckCircle2 } from 'lucide-react';

import GalleryGrid from './components/GalleryGrid';
import LightboxModal from './components/LightboxModal';
import UploadDropzone from './components/UploadDropzone';
import FloatingUploadStatus from './components/FloatingUploadStatus';
import AlbumsView from './components/AlbumsView';

import { fetchImages, uploadLocalFile, saveImageMetadata, deleteImage } from './services/api';
import { compressImage, getImageDimensions, generateBlurPlaceholder } from './utils/imageUtils';

// ── Custom Logo ───────────────────────────────────────────────────
const LogoIcon = ({ className, style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="6" width="20" height="14" rx="4" stroke="currentColor" strokeWidth="2" />
    <path d="M7 6V4C7 3.44772 7.44772 3 8 3H16C16.5523 3 17 3.44772 17 4V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Peek-a-boo Eye Lens */}
    <path d="M8 13C8 13 10 10 12 10C14 10 16 13 16 13C16 13 14 16 12 16C10 16 8 13 8 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="13" r="1.5" fill="currentColor" />
  </svg>
);

export default function App() {
  const [tab, setTab] = useState('photos'); // 'photos' | 'albums'
  const [searchQuery, setSearchQuery] = useState('');
  
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

  // ── Keyboard shortcuts ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      if (e.key === 'Escape' && selectionMode) clearSelection();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectionMode]);

  // ── Derived State: Filtered Images ──────────────────────────────
  const filteredImages = useMemo(() => {
    if (!searchQuery.trim()) return images;
    return images.filter(img => img.filename.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [images, searchQuery]);

  // ── Upload pipeline ─────────────────────────────────────────────
  const handleFilesInput = useCallback((files) => {
    Array.from(files).forEach(async (file) => {
      const itemId = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
      const filename = file.name;

      setUploadQueue((q) => [{ id: itemId, filename, status: 'queued', progress: 0 }, ...q]);

      try {
        setUploadQueue((q) => q.map((i) => i.id === itemId ? { ...i, status: 'compressing', progress: 10 } : i));
        const compressed = await compressImage(file);

        const dims = await getImageDimensions(compressed);
        const blur = await generateBlurPlaceholder(compressed);

        setUploadQueue((q) => q.map((i) => i.id === itemId ? { ...i, status: 'uploading', progress: 30 } : i));
        const publicUrl = await uploadLocalFile(compressed, (pct) => {
          setUploadQueue((q) => q.map((i) => i.id === itemId ? { ...i, progress: 30 + Math.round(pct * 0.6) } : i));
        });

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
        const remaining = filteredImages.filter((img) => img.id !== id);
        if (remaining.length === 0) return null;
        return Math.min(idx, remaining.length - 1);
      });
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  }, [filteredImages]);

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
    const idx = filteredImages.findIndex((img) => img.id === id);
    if (idx !== -1) setLightboxIndex(idx);
  }, [filteredImages]);

  return (
    <div
      className="h-screen w-full overflow-hidden relative no-select"
      style={{ background: 'var(--surface-0)', color: 'var(--text-primary)' }}
    >
      {/* ── Premium Unified Navbar (Sticky + Glassmorphism) ──────── */}
      <header
        className="absolute top-0 left-0 right-0 z-40 transition-all duration-300"
        style={{
          background: 'rgba(28, 28, 30, 0.75)', // Soft slate/charcoal
          backdropFilter: 'blur(24px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 4px 24px -2px rgba(0,0,0,0.1)'
        }}
      >
        <div className="flex items-center justify-between px-4 md:px-6 h-16 w-full max-w-[1600px] mx-auto gap-4">
          
          {/* 1. Brand (Left) */}
          <div className="flex items-center gap-3 w-1/4 min-w-max">
            <motion.div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center"
              style={{ 
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)', 
                border: '1px solid var(--border-subtle)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.1)'
              }}
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
              whileTap={{ scale: 0.95 }}
            >
              <LogoIcon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            </motion.div>
            <h1
              className="text-[15px] uppercase tracking-[0.2em] font-bold hidden sm:block"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginTop: '2px' }}
            >
              PIC-A-BOO
            </h1>
          </div>

          {/* 2. Segmented Navigation (Center) */}
          <div className="flex items-center justify-center w-2/4">
            <div 
              className="flex items-center p-1 rounded-[14px]"
              style={{ 
                background: 'rgba(0,0,0,0.25)', 
                border: '1px solid rgba(255,255,255,0.04)', 
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)' 
              }}
            >
              {[
                { id: 'photos', label: 'Photos' },
                { id: 'albums', label: 'Albums' }
              ].map((segment) => {
                const active = tab === segment.id;
                return (
                  <motion.button
                    key={segment.id}
                    onClick={() => { setTab(segment.id); if (selectionMode) clearSelection(); }}
                    className="relative px-5 py-1.5 rounded-[10px] text-[13px] font-semibold transition-colors z-10"
                    style={{ color: active ? 'var(--accent)' : 'var(--text-tertiary)' }}
                    whileHover={{ color: active ? 'var(--accent-hover)' : 'var(--text-secondary)' }}
                    whileTap={{ scale: 0.96 }}
                  >
                    {active && (
                      <motion.div
                        layoutId="nav-segment"
                        className="absolute inset-0 rounded-[10px] z-[-1]"
                        style={{
                          background: 'var(--accent-surface)',
                          border: '1px solid var(--accent-border)'
                        }}
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10">{segment.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* 3. Actions (Right): Integrated Search & Premium CTA */}
          <div className="flex items-center justify-end gap-3 w-1/4">
            {/* Search */}
            <div className="relative group hidden lg:block w-48 xl:w-56">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-tertiary)] group-focus-within:text-[var(--accent)] transition-colors" />
              <input 
                type="text" 
                placeholder="Search gallery..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)] focus:bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.04)] focus:border-[var(--accent)] rounded-full pl-9 pr-4 py-1.5 text-[13px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] transition-all outline-none shadow-sm focus:shadow-[0_0_0_1px_var(--accent-surface)]"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            
            {/* Upload Action */}
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
              className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors duration-200"
              style={{
                background: 'var(--text-primary)',
                color: 'var(--surface-0)',
                border: '1px solid transparent',
              }}
              whileHover={{ 
                backgroundColor: 'var(--accent)', 
                color: '#ffffff',
                borderColor: 'var(--accent-border)'
              }}
              whileTap={{ scale: 0.96, backgroundColor: 'var(--accent-pressed)' }}
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              <span className="hidden sm:inline tracking-wide">Upload</span>
            </motion.button>
          </div>
        </div>
        
        {/* Selection Mode Overlay Bar */}
        <AnimatePresence>
          {selectionMode && (
            <motion.div
              className="absolute inset-0 z-50 flex items-center justify-between px-4 md:px-6 w-full h-full"
              style={{
                background: 'rgba(28, 28, 30, 0.95)',
                backdropFilter: 'blur(32px)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <motion.button
                onClick={clearSelection}
                className="p-2 rounded-full transition-colors bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.1)]"
                whileTap={{ scale: 0.9 }}
                aria-label="Cancel selection"
              >
                <X className="w-4 h-4 text-[var(--text-secondary)]" />
              </motion.button>
              
              <div className="flex flex-col items-center">
                <span className="text-[14px] font-semibold text-[var(--text-primary)]">
                  {selectedIds.length} Selected
                </span>
                <span className="text-[11px] text-[var(--text-tertiary)]">Tap to unselect</span>
              </div>
              
              <motion.button
                onClick={deleteSelected}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors"
                style={{ color: '#ffffff', background: 'var(--danger)' }}
                whileHover={{ filter: 'brightness(1.1)', scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delete</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Main Content (Scrolls behind sticky header) ────────────── */}
      <main className="h-full overflow-y-auto pt-20 px-0 sm:px-2 md:px-4 max-w-[1600px] mx-auto">
        
        {/* Mobile Search Input (Visible only if searching is needed on small screens) */}
        <div className="px-4 mb-4 lg:hidden">
          <div className="relative group w-full">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input 
              type="text" 
              placeholder="Search gallery..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-xl pl-10 pr-4 py-2.5 text-[14px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[rgba(255,255,255,0.15)] focus:bg-[rgba(255,255,255,0.06)] transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {tab === 'photos' && (
            <motion.div
              key="photos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {searchQuery && filteredImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 opacity-70">
                  <SearchIcon className="w-10 h-10 text-[var(--text-tertiary)] mb-4" />
                  <p className="text-[15px] text-[var(--text-secondary)]">No photos matching "{searchQuery}"</p>
                </div>
              ) : (
                <GalleryGrid
                  images={filteredImages}
                  isLoading={isLoading}
                  onSelectImage={openLightbox}
                  selectionMode={selectionMode}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                />
              )}
            </motion.div>
          )}
          {tab === 'albums' && (
            <motion.div
              key="albums"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <AlbumsView images={filteredImages} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Overlays ─────────────────────────────────────────────────── */}
      <UploadDropzone onFilesDropped={handleFilesInput} />

      <FloatingUploadStatus
        queue={uploadQueue}
        onClearCompleted={() =>
          setUploadQueue((q) => q.filter((i) => i.status !== 'complete' && i.status !== 'failed'))
        }
      />

      <AnimatePresence>
        {lightboxIndex !== null && (
          <LightboxModal
            images={filteredImages}
            currentIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onPrev={() => setLightboxIndex((i) => (i === 0 ? filteredImages.length - 1 : i - 1))}
            onNext={() => setLightboxIndex((i) => (i === filteredImages.length - 1 ? 0 : i + 1))}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
