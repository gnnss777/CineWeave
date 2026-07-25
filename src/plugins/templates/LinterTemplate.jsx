/**
 * Linter Plugin - Template UI
 * Interface para plugin de linting de sluglines
 */

export default function LinterTemplate({ results, onApply, onReject }) {
  const totalModified = results.modifiedCount

  if (!results) return <div>Carregando...</div>

  return (
    <div className="plugin-linter">
      <div className="plugin-header">
        <h3>Slugline Linter</h3>
        <p>{totalModified} cabeçalhos encontrados para normalizar</p>
      </div>

      <div className="plugin-preview">
        <h4>Pré-visualização</h4>
        {results.modified.slice(0, 5).map(block => (
          <div key={block.id} className="linter-block-preview">
            <span className="original">{block.originalText}</span>
            <span className="arrow">→</span>
            <span className="modified">{block.text}</span>
          </div>
        ))}
        {totalModified > 5 && (
          <div className="more-count">
            +{totalModified - 5} mais...
          </div>
        )}
      </div>

      <div className="plugin-actions">
        <button
          onClick={onApply}
          className="btn-primary"
          disabled={totalModified === 0}
        >
          Aplicar Normalizações ({totalModified})
        </button>
        <button onClick={onReject} className="btn-secondary">
          Rejeitar
        </button>
      </div>

      <div className="plugin-info">
        <p>
          Este plugin irá normalizar todos os cabeçalhos de cena para CAIXA ALTA.
          As mudanças serão aplicadas apenas se você confirmar.
        </p>
      </div>
    </div>
  )
}
