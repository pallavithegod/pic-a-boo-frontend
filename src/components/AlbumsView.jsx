import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Star, Clock, FolderOpen } from 'lucide-react';

const AlbumCard = ({ title, subtitle, images, icon: Icon, accent }) => {
  const covers = images?.slice(0, 4) || [];

  return (
    <motion.div
      className="relative overflow-hidden cursor-pointer group rounded-xl"
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border-subtle)',
      }}
      whileHover={{ scale: 1.01, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* Cover mosaic */}
      <div className="aspect-[4/3] relative overflow-hidden">
        {covers.length > 0 ? (
          <div className="grid grid-cols-2 gap-px w-full h-full">
            {covers.map((img, i) => (
              <img
                key={img.id || i}
                src={img.publicUrl}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ))}
            {covers.length < 4 &&
              Array.from({ length: 4 - covers.length }).map((_, i) => (
                <div key={`empty-${i}`} style={{ background: 'var(--surface-2)' }} />
              ))}
          </div>
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: accent || 'var(--surface-2)' }}
          >
            {Icon && <Icon className="w-8 h-8" style={{ color: accent ? 'rgba(255,255,255,0.7)' : 'var(--text-tertiary)' }} />}
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.04] transition-colors duration-200" />
      </div>

      {/* Label */}
      <div className="px-3 py-2.5">
        <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
          {title}
        </p>
        {subtitle && (
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );
};

const AlbumsView = ({ images }) => {
  const recents = useMemo(() => images.slice(0, 20), [images]);

  return (
    <div className="px-4 md:px-6 py-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        <AlbumCard
          title="Recents"
          subtitle={`${recents.length} photos`}
          images={recents}
          icon={Clock}
        />
        <AlbumCard
          title="Favorites"
          subtitle="0 photos"
          images={[]}
          icon={Star}
          accent="rgba(245, 158, 11, 0.15)"
        />
        <AlbumCard
          title="All Photos"
          subtitle={`${images.length} photos`}
          images={images.slice(0, 4)}
          icon={FolderOpen}
        />
      </div>

      {images.length === 0 && (
        <motion.div
          className="flex flex-col items-center justify-center py-20 gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-[14px] font-medium" style={{ color: 'var(--text-secondary)' }}>
            No albums yet
          </p>
          <p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
            Upload photos to get started
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default AlbumsView;
