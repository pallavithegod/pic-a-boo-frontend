import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import SearchBar from './SearchBar';
import GalleryGrid from './GalleryGrid';

const SearchView = ({ images, onSelectImage }) => {
  const [query, setQuery] = useState('');

  const results = query.trim()
    ? images.filter((img) => img.filename.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <div className="flex flex-col h-full">
      {/* Search input */}
      <div className="px-4 md:px-6 pt-4 pb-3">
        <SearchBar query={query} setQuery={setQuery} autoFocus />
      </div>

      {/* Results area */}
      <div className="flex-1 overflow-y-auto">
        {query.trim() === '' ? (
          <motion.div
            className="flex flex-col items-center justify-center py-24 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--surface-2)' }}
            >
              <Search className="w-6 h-6" style={{ color: 'var(--text-tertiary)' }} />
            </div>
            <div className="text-center">
              <p className="text-[14px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Search your photos
              </p>
              <p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
                Type a filename to filter · Press <kbd className="px-1.5 py-0.5 rounded text-[11px] font-mono" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}>/</kbd> anywhere
              </p>
            </div>
          </motion.div>
        ) : results.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-24 gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-[14px] font-medium" style={{ color: 'var(--text-secondary)' }}>
              No results
            </p>
            <p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
              No photos matching "{query}"
            </p>
          </motion.div>
        ) : (
          <GalleryGrid images={results} isLoading={false} onSelectImage={onSelectImage} />
        )}
      </div>
    </div>
  );
};

export default SearchView;
