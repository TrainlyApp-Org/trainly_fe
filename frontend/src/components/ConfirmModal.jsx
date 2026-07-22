import React from 'react';

export default function ConfirmModal({
  title,
  message,
  confirmText = "Conferma",
  cancelText = "Annulla",
  onConfirm,
  onCancel
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
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            className="btn-primary btn-primary--block"
          >
            {confirmText}
          </button>

        </div>

      </div>
    </div>
  );
}