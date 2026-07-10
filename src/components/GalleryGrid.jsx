import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon } from 'lucide-react';
import GalleryItem from './GalleryItem';
import StickyDateHeader from './StickyDateHeader';
import ImageSkeleton from './ImageSkeleton';

const GalleryGrid = ({
  images,
  isLoading,
  onSelectImage,
  selectedIds = [],
  selectionMode = false,
  onToggleSelect,
}) => {
  // Group images by date (YYYY-MM-DD), sorted descending
  const groups = useMemo(() => {
    const map = {};
    images.forEach((img) => {
      const day = img.timestamp ? img.timestamp.slice(0, 10) : 'unknown';
      if (!map[day]) map[day] = [];
      map[day].push(img);
    });
    return Object.entries(map).sort(([a], [b]) => (a < b ? 1 : -1));
  }, [images]);

  if (isLoading) {
    return (
      <div className="px-4 pt-4">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1">
          {Array.from({ length: 18 }).map((_, i) => (
            <ImageSkeleton key={i} aspectRatio={1} />
          ))}
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-32 gap-4 no-select"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--surface-2)' }}
        >
          <ImageIcon className="w-7 h-7" style={{ color: 'var(--text-tertiary)' }} />
        </div>
        <div className="text-center">
          <p className="text-[15px] font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            No photos yet
          </p>
          <p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
            Drag & drop images or click Upload to get started
          </p>
        </div>
      </motion.div>
    );
  }

  let globalIndex = 0;

  return (
    <div className="pb-8">
      <AnimatePresence mode="popLayout">
        {groups.map(([day, dayImages]) => (
          <div key={day}>
            <StickyDateHeader dateString={day} />
            <div className="px-2 sm:px-3 md:px-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-0.5 sm:gap-1">
                {dayImages.map((img) => {
                  const idx = globalIndex++;
                  return (
                    <GalleryItem
                      key={img.id}
                      image={img}
                      index={idx}
                      onClick={() => onSelectImage(img.id)}
                      selected={selectedIds.includes(img.id)}
                      selectionMode={selectionMode}
                      onSelect={onToggleSelect}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default GalleryGrid;
