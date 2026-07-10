import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronUp, ChevronDown, CheckCircle2, AlertCircle, Loader2, ImageIcon } from 'lucide-react';

const STATUS_CONFIG = {
  queued:       { label: 'Waiting…',      color: 'var(--text-tertiary)' },
  compressing:  { label: 'Compressing…',  color: 'var(--accent)' },
  uploading:    { label: null,            color: 'var(--accent)' },  // uses progress %
  saving:       { label: 'Saving…',       color: 'var(--accent)' },
  complete:     { label: 'Done',          color: 'var(--success)' },
  failed:       { label: 'Failed',        color: 'var(--danger)' },
};

const StatusIcon = ({ status }) => {
  if (status === 'complete') return <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--success)' }} />;
  if (status === 'failed') return <AlertCircle className="w-4 h-4" style={{ color: 'var(--danger)' }} />;
  if (['compressing', 'uploading', 'saving'].includes(status))
    return <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--accent)' }} />;
  return (
    <div
      className="w-4 h-4 rounded-full"
      style={{ border: '1.5px solid var(--border-default)', background: 'var(--surface-2)' }}
    />
  );
};

const FloatingUploadStatus = ({ queue, onClearCompleted }) => {
  const [expanded, setExpanded] = useState(true);

  const { total, done, failed, active, overallProgress, allDone } = useMemo(() => {
    const total = queue.length;
    const done = queue.filter((f) => f.status === 'complete').length;
    const failed = queue.filter((f) => f.status === 'failed').length;
    const active = total - done - failed;
    const overallProgress = total > 0 ? Math.round(queue.reduce((s, f) => s + (f.progress || 0), 0) / total) : 0;
    return { total, done, failed, active, overallProgress, allDone: active === 0 };
  }, [queue]);

  if (queue.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={`fixed bottom-6 right-6 z-40 overflow-hidden rounded-2xl ${allDone ? 'liquid-glass' : 'liquid-glass-accent'} no-select`}
        style={{ width: 320, maxWidth: 'calc(100vw - 48px)' }}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        layout
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer"
          onClick={() => setExpanded((p) => !p)}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: allDone ? 'rgba(34, 197, 94, 0.1)' : 'var(--accent-soft)' }}
            >
              {allDone ? (
                <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--success)' }} />
              ) : (
                <ImageIcon className="w-4 h-4 progress-pulse" style={{ color: 'var(--accent)' }} />
              )}
            </div>
            <div>
              <p className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                {allDone
                  ? `${done} photo${done !== 1 ? 's' : ''} uploaded`
                  : `Uploading ${active} photo${active !== 1 ? 's' : ''}…`}
              </p>
              {!allDone && (
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  {overallProgress}% complete
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setExpanded((p) => !p)}
              className="p-1.5 rounded-lg transition-colors hover:bg-black/5"
              style={{ color: 'var(--text-tertiary)' }}
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
            {allDone && (
              <button
                onClick={onClearCompleted}
                className="p-1.5 rounded-lg transition-colors hover:bg-black/5"
                style={{ color: 'var(--text-tertiary)' }}
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {!allDone && (
          <div className="h-[2px] mx-4 mb-1 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'var(--accent)' }}
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        )}

        {/* File list */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              className="overflow-y-auto"
              style={{ maxHeight: 200 }}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="px-2 pb-2">
                {queue.map((item) => (
                  <motion.div
                    key={item.id}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      background: item.status === 'failed' ? 'rgba(239, 68, 68, 0.06)' : 'transparent',
                    }}
                  >
                    <StatusIcon status={item.status} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {item.filename}
                      </p>
                      <p className="text-[11px]" style={{ color: STATUS_CONFIG[item.status]?.color || 'var(--text-tertiary)' }}>
                        {item.status === 'uploading'
                          ? `${item.progress || 0}%`
                          : item.status === 'failed'
                          ? item.error || 'Failed'
                          : STATUS_CONFIG[item.status]?.label || ''}
                      </p>
                    </div>
                    {/* Per-file micro progress bar */}
                    {['compressing', 'uploading', 'saving'].includes(item.status) && (
                      <div className="w-12 h-1 rounded-full overflow-hidden shrink-0" style={{ background: 'var(--surface-3)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${item.progress || 0}%`, background: 'var(--accent)' }}
                        />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default FloatingUploadStatus;
