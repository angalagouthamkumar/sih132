import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  loading = false,
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
      const handleKeyDown = (e) => {
        if (e.key === 'Escape' && !loading) {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const isDanger = type === 'danger';

  return (
    <AnimatePresence>
      <div className="modal-backdrop" style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 31, 32, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}>
        <motion.div
          ref={modalRef}
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          className="modal-card"
          style={{
            background: 'var(--surface, #FFFFFF)',
            borderRadius: '12px',
            border: '1px solid var(--border, #E2E9E4)',
            maxWidth: '440px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 10px 25px rgba(5, 31, 32, 0.15)',
            outline: 'none',
          }}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: isDanger ? '#fed7d7' : '#DAF1DE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDanger ? '#c53030' : '#235347',
              }}>
                <AlertTriangle size={20} />
              </div>
              <h3 id="confirm-modal-title" style={{
                fontFamily: 'var(--font-heading, "Bricolage Grotesque", sans-serif)',
                fontSize: '1.2rem',
                fontWeight: 700,
                color: 'var(--primary-900, #051F20)',
                margin: 0,
              }}>
                {title}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              aria-label="Close modal"
              style={{
                background: 'none',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                color: 'var(--text-secondary, #66756D)',
                padding: '4px',
              }}
            >
              <X size={18} />
            </button>
          </div>

          <p style={{
            fontSize: '0.92rem',
            color: 'var(--text-secondary, #66756D)',
            lineHeight: 1.5,
            marginBottom: '24px',
          }}>
            {message}
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-secondary-action"
              style={{ minHeight: '44px', padding: '0 16px' }}
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="btn"
              style={{
                minHeight: '44px',
                padding: '0 18px',
                backgroundColor: isDanger ? '#c53030' : 'var(--primary-600, #235347)',
                color: '#FFFFFF',
                fontWeight: 600,
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Processing...' : confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
