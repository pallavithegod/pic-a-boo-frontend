import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Download, Trash2, Info, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut, Maximize2, Minimize2,
} from 'lucide-react';

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const imageVariants = {
  enter: (direction) => ({ opacity: 0, x: direction > 0 ? 60 : -60, scale: 0.96 }),
  center: { opacity: 1, x: 0, scale: 1 },
  exit: (direction) => ({ opacity: 0, x: direction > 0 ? -60 : 60, scale: 0.96 }),
};

const LightboxModal = ({ images, currentIndex, onClose, onPrev, onNext, onDelete }) => {
  const [showInfo, setShowInfo] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [direction, setDirection] = useState(0);

  const image = images[currentIndex];

  useEffect(() => { setZoom(1); setShowInfo(false); }, [currentIndex]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }, []);

  const goNext = useCallback(() => { setDirection(1); onNext(); }, [onNext]);
  const goPrev = useCallback(() => { setDirection(-1); onPrev(); }, [onPrev]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'f' || e.key === 'F') { e.preventDefault(); toggleFullscreen(); }
      if (e.key === 'i' || e.key === 'I') setShowInfo((p) => !p);
      if (e.key === 'Delete' && image) {
        if (confirm(`Delete "${image.filename}"?`)) onDelete(image.id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, goPrev, goNext, toggleFullscreen, image, onDelete]);

  const handleDownload = useCallback(() => {
    if (!image) return;
    const a = document.createElement('a');
    a.href = image.publicUrl;
    a.download = image.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [image]);

  if (!image) return null;

  const ActionButton = ({ icon: Icon, label, onClick, active = false, danger = false }) => (
    <motion.button
      onClick={onClick}
      className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors"
      style={{
        color: active ? 'var(--accent)' : danger ? 'var(--danger)' : 'rgba(255,255,255,0.7)',
        background: 'transparent',
      }}
      whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.08)' }}
      whileTap={{ scale: 0.95 }}
      title={label}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </motion.button>
  );

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col no-select"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        transition={{ duration: 0.25 }}
        style={{ background: 'rgba(10, 10, 10, 0.95)', backdropFilter: 'blur(8px)' }}
      >
        {/* ── Top bar ─────────────────────────────────────────────────────── */}
        <div className="shrink-0 flex items-center justify-between px-4 md:px-6 h-14">
          <motion.button
            onClick={onClose}
            className="p-2 rounded-full transition-colors"
            style={{ color: 'rgba(255,255,255,0.8)' }}
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.9 }}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </motion.button>

          <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {currentIndex + 1} of {images.length}
          </span>

          <motion.button
            onClick={handleDownload}
            className="p-2 rounded-full transition-colors"
            style={{ color: 'rgba(255,255,255,0.8)' }}
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.9 }}
            aria-label="Download"
          >
            <Download className="w-5 h-5" />
          </motion.button>
        </div>

        {/* ── Image area ──────────────────────────────────────────────────── */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden min-h-0">
          {/* Prev arrow */}
          <motion.button
            onClick={goPrev}
            className="absolute left-2 md:left-4 z-10 p-2.5 rounded-full"
            style={{ color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.06)' }}
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.12)', scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>

          {/* Image with directional slide transition */}
          <AnimatePresence mode="popLayout" custom={direction}>
            <motion.div
              key={currentIndex}
              className="absolute inset-0 flex items-center justify-center px-12 md:px-20"
              custom={direction}
              variants={imageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onClick={onClose}
            >
              <motion.img
                src={image.publicUrl}
                alt={image.filename}
                className="max-w-full max-h-full object-contain rounded-sm select-none"
                style={{
                  transform: `scale(${zoom})`,
                  transition: 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
                  cursor: zoom > 1 ? 'zoom-out' : 'zoom-in',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom((z) => (z === 1 ? 2 : 1));
                }}
                draggable={false}
              />
            </motion.div>
          </AnimatePresence>

          {/* Next arrow */}
          <motion.button
            onClick={goNext}
            className="absolute right-2 md:right-4 z-10 p-2.5 rounded-full"
            style={{ color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.06)' }}
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.12)', scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </motion.button>
        </div>

        {/* ── Bottom toolbar ──────────────────────────────────────────────── */}
        <div className="shrink-0">
          <div className="flex items-center justify-center gap-1 px-4 py-3">
            <ActionButton
              icon={zoom > 1 ? ZoomOut : ZoomIn}
              label="Zoom"
              onClick={() => setZoom((z) => (z === 1 ? 2 : 1))}
              active={zoom > 1}
            />
            <ActionButton
              icon={isFullscreen ? Minimize2 : Maximize2}
              label="Fullscreen"
              onClick={toggleFullscreen}
              active={isFullscreen}
            />
            <ActionButton
              icon={Info}
              label="Info"
              onClick={() => setShowInfo((p) => !p)}
              active={showInfo}
            />
            <ActionButton
              icon={Trash2}
              label="Delete"
              onClick={() => {
                if (confirm(`Delete "${image.filename}"?`)) onDelete(image.id);
              }}
              danger
            />
          </div>

          {/* Info panel */}
          <AnimatePresence>
            {showInfo && (
              <motion.div
                className="overflow-hidden"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <div
                  className="px-6 py-4 grid grid-cols-2 gap-x-8 gap-y-3"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {[
                    { label: 'Filename', value: image.filename },
                    {
                      label: 'Uploaded',
                      value: new Date(image.timestamp).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      }),
                    },
                    {
                      label: 'Dimensions',
                      value: image.width && image.height ? `${image.width} × ${image.height}` : '—',
                    },
                    {
                      label: 'Aspect ratio',
                      value: image.aspectRatio ? `${image.aspectRatio.toFixed(2)}` : '—',
                    },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[11px] font-medium uppercase tracking-wider mb-0.5"
                         style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {label}
                      </p>
                      <p className="text-[13px] truncate" style={{ color: 'rgba(255,255,255,0.8)' }}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LightboxModal;
