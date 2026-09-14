import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <AnimatePresence>
      <motion.div
        className={`toast-container ${
          isSuccess ? 'toast-success' : isError ? 'toast-error' : 'toast-info'
        }`}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        role="alert"
      >
        <div className="toast-icon">
          {isSuccess ? (
            <CheckCircle2 size={18} />
          ) : isError ? (
            <AlertCircle size={18} />
          ) : (
            <Info size={18} />
          )}
        </div>
        <div className="toast-message">{toast.message}</div>
        <button
          type="button"
          className="toast-close-btn"
          onClick={onClose}
          aria-label="Dismiss message"
        >
          <X size={14} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
