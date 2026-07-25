/**
 * Markup Cleaner Plugin - Template UI
 * Interface para limpeza de markup do roteiro
 */

import { useCineWeaveAPI } from '../../lib/pluginAPI'

export default function CleanerTemplate({ results, onApply, onReject }) {
  if (!results) return <div>Carregando...</div>

  const {
    removedCount,
    currentLength,
    finalLength,
    removedBlocks,
    message
  } = results

  return (
    <div className="plugin-cleaner">
      <div className="plugin-header">
        <h3>Markup Cleaner</h3>
        <p>Limpe markup indesejado do roteiro</p>
      </div>

      <div className="plugin-preview">
        <div className="preview-stats">
          <div className="stat">
            <span className="stat-label">Blocos originais:</span>
            <span className="stat-value">{currentLength}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Blocos removidos:</span>
            <span className="stat-value" style={{ color: '#ef4444' }}>
              -{removedCount}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Blocos finais:</span>
            <span className="stat-value">{finalLength}</span>
          </div>
        </div>

        {removedBlocks.length > 0 && (
          <>
            <h4>Blocos Removidos:</h4>
            <ul className="removed-list">
              {removedBlocks.slice(0, 10).map((block, idx) => (
                <li key={idx}>{block.text || '(texto vazio)'}</li>
              ))}
              {removedBlocks.length > 10 && (
                <li>+{removedBlocks.length - 10} mais...</li>
              )}
            </ul>
          </>
        )}
      </div>

      <div className="plugin-info">
        <p>{message}</p>
      </div>

      <div className="plugin-actions">
        <button
          onClick={onApply}
          className="btn-primary"
          disabled={removedCount === 0}
        >
          Aplicar Limpeza ({removedCount} blocos)
        </button>
        <button onClick={onReject} className="btn-secondary">
          Rejeitar
        </button>
      </div>
    </div>
  )
}
