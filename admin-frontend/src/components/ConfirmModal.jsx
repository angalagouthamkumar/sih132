import { useEffect, useRef } from 'react';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  type = 'danger',
  loading = false,
  error = '',
}) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
      <div
        ref={modalRef}
        tabIndex="-1"
        className="modal-box"
        style={{ outline: 'none' }}
      >
        <div className="modal-body">
          <h3 id="confirm-modal-title" className="modal-title">{title}</h3>
          <p className="modal-message">{message}</p>
          {error && <div className="alert alert-error" role="alert">{error}</div>}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className={type === 'danger' ? 'btn-danger' : 'btn-primary'}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? 'Processing...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
