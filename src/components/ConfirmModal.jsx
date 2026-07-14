import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ title, message, confirmLabel, cancelLabel, onConfirm, onCancel, variant }) {
  const isDanger = variant === 'danger';
  const isAlert = variant === 'alert';
  const handleConfirm = onConfirm || onCancel;
  const handleCancel = onCancel || onConfirm;

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div
        className="form-modal glass"
        style={{ maxWidth: '420px', height: 'auto', maxHeight: 'auto', padding: '1.5rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          {isDanger && (
            <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', display: 'flex', flexShrink: 0 }}>
              <AlertTriangle size={24} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: '0 0 0.5rem' }}>{title}</h3>
            <p style={{ fontSize: '0.8125rem', color: '#a3a3a3', margin: 0, lineHeight: 1.5 }}>{message}</p>
          </div>
          {!isAlert && (
            <button onClick={handleCancel} style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer', padding: '0.25rem', flexShrink: 0 }}>
              <X size={18} />
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {!isAlert && (
            <button onClick={handleCancel} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
              {cancelLabel || 'Cancelar'}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className="btn-primary"
            style={{
              padding: '0.5rem 1rem', fontSize: '0.8125rem',
              background: isDanger ? 'linear-gradient(135deg, #ef4444, #dc2626)' : undefined,
              boxShadow: isDanger ? '0 4px 14px rgba(239,68,68,0.25)' : undefined,
            }}
          >
            {confirmLabel || (isAlert ? 'OK' : 'Confirmar')}
          </button>
        </div>
      </div>
    </div>
  );
}
