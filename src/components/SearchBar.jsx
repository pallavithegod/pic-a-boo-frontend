import React, { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({ query, setQuery, autoFocus = false, compact = false }) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  return (
    <div className="relative w-full group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search
          className="h-4 w-4 transition-colors duration-200"
          style={{ color: 'var(--text-tertiary)' }}
        />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search photos…"
        className={`
          w-full pl-9 pr-9 font-normal transition-all duration-200
          focus:outline-none
          ${compact ? 'py-2 text-sm rounded-lg' : 'py-2.5 text-[14px] rounded-xl'}
        `}
        style={{
          background: 'var(--surface-2)',
          border: '1px solid transparent',
          color: 'var(--text-primary)',
          caretColor: 'var(--accent)',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--border-default)';
          e.target.style.background = 'var(--surface-1)';
          e.target.style.boxShadow = '0 0 0 3px var(--accent-soft)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'transparent';
          e.target.style.background = 'var(--surface-2)';
          e.target.style.boxShadow = 'none';
        }}
      />
      {query && (
        <button
          onClick={() => { setQuery(''); inputRef.current?.focus(); }}
          className="absolute inset-y-0 right-0 pr-3 flex items-center transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-tertiary)' }}
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
