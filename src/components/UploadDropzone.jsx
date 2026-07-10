import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud } from 'lucide-react';

const UploadDropzone = ({ onFilesDropped }) => {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    let dragCounter = 0;

    const onDragEnter = (e) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer?.items?.length > 0) setIsDragging(true);
    };
    const onDragLeave = (e) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) setIsDragging(false);
    };
    const onDragOver = (e) => e.preventDefault();
    const onDrop = (e) => {
      e.preventDefault();
      setIsDragging(false);
      dragCounter = 0;
      const files = Array.from(e.dataTransfer?.files || []).filter((f) =>
        f.type.startsWith('image/')
      );
      if (files.length > 0) onFilesDropped(files);
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    };
  }, [onFilesDropped]);

  return (
    <AnimatePresence>
      {isDragging && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            background: 'rgba(248, 248, 247, 0.85)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <motion.div
            className="flex flex-col items-center gap-5 p-10 rounded-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              border: '2px dashed var(--border-default)',
              background: 'var(--surface-1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
              minWidth: 280,
            }}
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--accent-soft)' }}
              >
                <UploadCloud className="w-7 h-7" style={{ color: 'var(--accent)' }} />
              </div>
            </motion.div>
            <div className="text-center">
              <p className="text-[15px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Drop to upload
              </p>
              <p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
                Images will be compressed automatically
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UploadDropzone;
