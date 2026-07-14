import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { diffScreenplay } from '../lib/diffUtils';

export default function RevisionDiffModal({ isOpen, onClose }) {
  const { currentProject } = useProject();
  const history = currentProject?.history || [];
  const [versionA, setVersionA] = useState(history[0]?.id || '');
  const [versionB, setVersionB] = useState(history[1]?.id || '');
  const [diffs, setDiffs] = useState([]);

  const compare = () => {
    const vA = history.find(v => v.id === versionA);
    const vB = history.find(v => v.id === versionB);
    if (!vA || !vB) return;
    const changes = diffScreenplay(vA.screenplay || [], vB.screenplay || []);
    setDiffs(changes);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '90vw', maxHeight: '80vh', overflow: 'auto',
          background: '#0a0a0d', border: '1px solid #1d1d24', borderRadius: '12px',
          padding: '24px', color: '#fff', minWidth: '500px'
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#ccee00' }}>
          Comparar Revisões
        </h2>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
          <select
            value={versionA}
            onChange={e => setVersionA(e.target.value)}
            style={{ flex: 1, padding: '8px', background: '#020203', border: '1px solid #1d1d24', color: '#fff', borderRadius: '6px', fontSize: '12px' }}
          >
            {history.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <span style={{ color: '#7c7c82', fontWeight: 'bold' }}>vs</span>
          <select
            value={versionB}
            onChange={e => setVersionB(e.target.value)}
            style={{ flex: 1, padding: '8px', background: '#020203', border: '1px solid #1d1d24', color: '#fff', borderRadius: '6px', fontSize: '12px' }}
          >
            {history.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <button
            onClick={compare}
            style={{ padding: '8px 16px', background: '#ccee00', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
          >
            Comparar
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontFamily: 'Courier, monospace', fontSize: '13px' }}>
          {diffs.length === 0 && (
            <p style={{ color: '#7c7c82', fontStyle: 'italic' }}>Nenhuma diferença encontrada.</p>
          )}
          {diffs.map((d, i) => (
            <div
              key={i}
              style={{
                background: d.type === 'added' ? 'rgba(16,185,129,0.1)' :
                           d.type === 'removed' ? 'rgba(239,68,68,0.1)' :
                           'rgba(245,158,11,0.1)',
                borderLeft: `3px solid ${
                  d.type === 'added' ? '#10b981' :
                  d.type === 'removed' ? '#ef4444' : '#f59e0b'
                }`,
                padding: '6px 10px', margin: '2px 0', borderRadius: '4px'
              }}
            >
              <span style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '2px' }}>
                {d.type === 'added' ? '+ ' : d.type === 'removed' ? '- ' : '~ '}
                [{d.element?.type || d.new?.type}] Ln {d.index + 1}
              </span>
              <div>
                {d.element?.text || d.new?.text}
                {d.old && (
                  <span style={{ color: '#f87171', textDecoration: 'line-through', marginLeft: '8px' }}>
                    {d.old.text}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 16px', background: '#121217', border: '1px solid #1d1d24', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
