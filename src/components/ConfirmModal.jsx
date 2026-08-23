import React from 'react';

export default function ConfirmModal({
  title,
  message,
  confirmText = "Conferma",
  cancelText = "Annulla",
  onConfirm,
  onCancel,
  loading = false,
  danger = false
}) {
  return (
    <div className="modal-overlay">
      <div className="modal-card">

        <h2>{title}</h2>

        <p>{message}</p>

        <div className="modal-actions">

          <button
            onClick={onCancel}
            className="btn-secondary btn-secondary--block"
            disabled={loading}
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            className={danger ? 'button-danger confirm-modal-danger-button' : 'btn-primary btn-primary--block'}
            disabled={loading}
          >
            {confirmText}
          </button>

        </div>

      </div>
    </div>
  );
}
