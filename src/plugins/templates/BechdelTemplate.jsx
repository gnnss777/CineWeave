/**
 * Bechdel Test Plugin - Template UI
 * Interface para teste de diversidade Bechdel-Wallace
 */

export default function BechdelTemplate({ results, onReview }) {
  if (!results) return <div>Carregando...</div>

  const {
    bechdelPassed,
    femaleSpeakersCount,
    maleSpeakersCount,
    dialoguesAnalyzed,
    issues,
    suggestions
  } = results

  return (
    <div className="plugin-bechdel">
      <div className="plugin-header">
        <h3>Diversity Analyzer (Bechdel Test)</h3>
        <p>Analise a diversidade de personagens femininos no seu roteiro</p>
      </div>

      <div className="plugin-results">
        <div className="result-card" style={{
          background: bechdelPassed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          borderLeft: bechdelPassed ? '4px solid #10b981' : '4px solid #ef4444'
        }}>
          <div className="result-label">Resultado</div>
          <div className="result-value" style={{
            color: bechdelPassed ? '#10b981' : '#ef4444'
          }}>
            {bechdelPassed ? '✅ PASSED' : '❌ FAILED'}
          </div>
        </div>

        <div className="result-stats">
          <div className="stat">
            <span className="stat-label">Dialogues Analisadas:</span>
            <span className="stat-value">{dialoguesAnalyzed}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Personagens Femininas:</span>
            <span className="stat-value">{femaleSpeakersCount}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Personagens Masculinos:</span>
            <span className="stat-value">{maleSpeakersCount}</span>
          </div>
        </div>
      </div>

      {issues.length > 0 && (
        <div className="plugin-issues">
          <h4>Problemas Identificados:</h4>
          <ul>
            {issues.map((issue, idx) => (
              <li key={idx}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="plugin-suggestions">
          <h4>Sugestões:</h4>
          <ul>
            {suggestions.map((suggestion, idx) => (
              <li key={idx}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="plugin-actions">
        <button
          onClick={() => onReview(results)}
          className="btn-primary"
        >
          Revisar Análise
        </button>
      </div>
    </div>
  )
}
