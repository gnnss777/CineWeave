import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function PromptModal({ title, message, initialValue, placeholder, onConfirm, onCancel }) {
  const [value, setValue] = useState(initialValue || '');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      onConfirm(value.trim());
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <form
        className="form-modal glass"
        style={{ maxWidth: '420px', height: 'auto', maxHeight: 'auto', padding: '1.5rem' }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: '0 0 0.5rem' }}>{title}</h3>
            {message && <p style={{ fontSize: '0.8125rem', color: '#a3a3a3', margin: '0 0 1rem', lineHeight: 1.5 }}>{message}</p>}
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder || ''}
              style={{
                width: '100%', padding: '0.75rem 1rem', fontSize: '0.875rem',
                background: '#151515', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px', color: '#fff', outline: 'none',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') onCancel();
              }}
            />
          </div>
          <button type="button" onClick={onCancel} style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer', padding: '0.25rem', flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button type="button" onClick={onCancel} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
            Confirmar
          </button>
        </div>
      </form>
    </div>
  );
}
