import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, CheckCircle2, AlertTriangle, X } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const icons = {
    info: <Info size={18} color="var(--forest-700)" />,
    success: <CheckCircle2 size={18} color="var(--success-text)" />,
    warning: <AlertTriangle size={18} color="var(--warning-text)" />,
  };

  return (
    <AnimatePresence>
      <motion.div
        className={`toast-container toast-${type}`}
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        role="status"
        aria-live="polite"
      >
        <div className="toast-content">
          <span className="toast-icon">{icons[type] || icons.info}</span>
          <span className="toast-message">{message}</span>
        </div>
        <button
          type="button"
          className="toast-close-btn"
          onClick={onClose}
          aria-label="Dismiss notification"
        >
          <X size={14} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
