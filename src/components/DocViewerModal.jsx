import { useState } from 'react';
import { X, FileText, Mic, RotateCcw, Trash2, Check, Edit } from 'lucide-react';

export default function DocViewerModal({ doc, onClose, onDelete, onRetry, onEditContent }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(doc?.content || '');
  const isRecording = doc?.metadata?.source === 'recording';
  const FileIcon = isRecording ? Mic : FileText;
  const fileSize = isRecording
    ? `${(doc?.content || '').split(/\s+/).filter(Boolean).length} palavras`
    : `${((doc?.size || 0) / 1024).toFixed(1)} KB`;

  if (!doc) return null;

  const handleSaveEdit = () => {
    onEditContent(doc.id, editContent);
    setIsEditing(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="doc-viewer-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="doc-viewer-header">
          <div className="doc-viewer-title">
            <FileIcon size={20} style={{ color: 'var(--primary-gold)' }} />
            <div>
              <h3>{doc.name}</h3>
              <span className="doc-viewer-meta">{fileSize} • {doc.type?.toUpperCase()}</span>
            </div>
          </div>
          <button className="doc-viewer-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="doc-viewer-content">
          {doc.status === 'error' && (
            <div className="doc-viewer-error">{doc.error}</div>
          )}

          {isEditing ? (
            <div className="doc-edit-area">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="doc-viewer-textarea"
                rows={12}
              />
              <div className="doc-viewer-edit-actions">
                <button className="btn-primary py-1 px-3 text-xs" onClick={handleSaveEdit}>
                  <Check size={14} /> Salvar
                </button>
                <button className="btn-secondary py-1 px-3 text-xs" onClick={() => setIsEditing(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="doc-viewer-text">{doc.content || 'Sem conteúdo'}</div>
          )}
        </div>

        <div className="doc-viewer-footer">
          {isRecording && !isEditing && (
            <button className="btn-secondary py-1 px-3 text-xs" onClick={() => { setEditContent(doc.content); setIsEditing(true); }}>
              <Edit size={14} /> Editar
            </button>
          )}
          {doc.status === 'error' && (
            <button className="btn-secondary py-1 px-3 text-xs" onClick={() => onRetry?.(doc)}>
              <RotateCcw size={14} /> Reprocessar
            </button>
          )}
          {doc.status === 'parsed' && (
            <button className="btn-secondary py-1 px-3 text-xs" onClick={onRetry}>
              <RotateCcw size={14} /> Reprocessar
            </button>
          )}
          <button className="btn-secondary py-1 px-3 text-xs" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }} onClick={() => onDelete?.(doc.id)}>
            <Trash2 size={14} /> Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
