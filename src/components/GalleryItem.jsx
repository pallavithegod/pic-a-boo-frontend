import React, { useState, useCallback, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const GalleryItem = memo(({ image, onClick, selected = false, onSelect, selectionMode = false, index = 0 }) => {
  const [loaded, setLoaded] = useState(false);
  const longPressTimer = useRef(null);

  const handleClick = useCallback(() => {
    if (selectionMode) {
      onSelect?.(image.id);
    } else {
      onClick?.();
    }
  }, [selectionMode, onSelect, onClick, image.id]);

  const startLongPress = useCallback(() => {
    longPressTimer.current = setTimeout(() => onSelect?.(image.id), 400);
  }, [onSelect, image.id]);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  return (
    <motion.div
      className="relative overflow-hidden cursor-pointer group no-select"
      style={{
        backgroundColor: 'var(--surface-2)',
        borderRadius: '2px',
      }}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.35,
        delay: Math.min(index * 0.02, 0.3),
        ease: [0.22, 1, 0.36, 1],
      }}
      onClick={handleClick}
      onMouseDown={startLongPress}
      onMouseUp={cancelLongPress}
      onMouseLeave={cancelLongPress}
      onTouchStart={startLongPress}
      onTouchEnd={cancelLongPress}
      whileHover={{ scale: 1.008 }}
      whileTap={{ scale: 0.985 }}
    >
      {/* Aspect ratio container */}
      <div style={{ paddingBottom: '100%', position: 'relative' }}>
        {/* Blur-up placeholder */}
        {image.blurDataUrl && !loaded && (
          <img
            src={image.blurDataUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'blur(20px)', transform: 'scale(1.1)' }}
            aria-hidden="true"
          />
        )}

        {/* Real image */}
        <img
          src={image.publicUrl}
          alt={image.filename}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover ${
            loaded ? 'animate-image-reveal' : 'opacity-0'
          }`}
          style={{
            transition: 'filter 0.2s ease',
          }}
        />

        {/* Hover darkening overlay */}
        <div
          className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.06] transition-colors duration-200 pointer-events-none"
        />

        {/* Selection overlay */}
        {selected && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ background: 'rgba(52, 120, 246, 0.18)' }}
          />
        )}

        {/* Checkmark badge */}
        {(selectionMode || selected) && (
          <motion.div
            className="absolute top-2 right-2 flex items-center justify-center rounded-full"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            style={{
              width: 22,
              height: 22,
              background: selected ? 'var(--accent)' : 'rgba(255,255,255,0.7)',
              border: selected ? 'none' : '1.5px solid var(--border-default)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
            }}
          >
            {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
});

GalleryItem.displayName = 'GalleryItem';
export default GalleryItem;
