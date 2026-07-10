import React from 'react';

const StickyDateHeader = ({ dateString }) => {
  const formatDate = (str) => {
    try {
      const date = new Date(str);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      if (date.toDateString() === today.toDateString()) return 'Today';
      if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

      const sameYear = date.getFullYear() === today.getFullYear();
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        ...(sameYear ? {} : { year: 'numeric' }),
      });
    } catch {
      return str;
    }
  };

  return (
    <div
      className="sticky z-10 flex items-center"
      style={{
        top: 0,
        padding: '14px 20px 10px',
        backgroundColor: 'var(--surface-0)',
      }}
    >
      <h3
        className="text-[13px] font-semibold tracking-tight"
        style={{ color: 'var(--text-primary)' }}
      >
        {formatDate(dateString)}
      </h3>
    </div>
  );
};

export default StickyDateHeader;
