import React, { useState, useMemo } from 'react';
import { useProject } from '../context/ProjectContext';
import { CRITERIA, GENRES, LANGUAGES, calculateScore, extractMetrics, getFilteredBenchmark, autoRate, detectBeats, buildCharacterGraph } from '../lib/scriptCoverage';
import { BarChart3, Award, Users, TrendingUp, FileText, RefreshCw, Sliders } from 'lucide-react';

const REC_STYLE = {
  Recommend: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: '#22c55e', label: 'Recomendado', icon: '★' },
  Consider: { color: '#eab308', bg: 'rgba(234,179,8,0.08)', border: '#eab308', label: 'Considerar', icon: '◆' },
  Pass: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: '#ef4444', label: 'Passar', icon: '▼' },
};

const CRITERIA_COLORS = ['#a78bfa', '#60a5fa', '#34d399', '#f472b6', '#fbbf24', '#fb923c'];

function ProgressBar({ value, max, color }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})`, transition: 'width 0.3s ease' }} className="h-full rounded-full" />
      </div>
      <span className="text-xs font-mono text-gray-400 w-10 text-right">{value}/{max}</span>
    </div>
  );
}

function HelpTip({ children }) {
  return <div style={{ fontSize: 11, color: '#666', lineHeight: 1.5, padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, marginTop: -8, marginBottom: 16 }}>{children}</div>;
}

function MetricRow({ label, value, benchmark, unit, color }) {
  const val = value ?? 0;
  const ben = benchmark ?? 0;
  const diff = ben > 0 ? ((val - ben) / ben) * 100 : 0;
  const isGood = Math.abs(diff) < 20;
  const isOk = Math.abs(diff) < 50;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
      <span style={{ fontSize: 12, color: '#ccc', width: 130, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, color: color || '#fff', fontFamily: 'monospace', width: 80, textAlign: 'right' }}>{val}{unit}</span>
      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
        <div style={{
          width: `${Math.min((val / Math.max(ben * 2, 1)) * 100, 100)}%`, height: '100%',
          background: isGood ? '#22c55e' : isOk ? '#eab308' : '#ef4444', borderRadius: 2, opacity: 0.6,
        }} />
      </div>
      <span style={{ fontSize: 11, color: '#666', width: 90, textAlign: 'right' }}>benchmark {ben}{unit}</span>
    </div>
  );
}

export default function CoverageReport() {
  const { currentProject } = useProject();
  const screenplay = currentProject?.screenplay || [];

  const [manualMode, setManualMode] = useState(false);
  const [ratings, setRatings] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');

  const metrics = useMemo(() => extractMetrics(screenplay), [screenplay]);
  const benchmark = useMemo(() => getFilteredBenchmark(selectedGenre, selectedLanguage), [selectedGenre, selectedLanguage]);
  const autoRatings = useMemo(() => autoRate(metrics, benchmark), [metrics, benchmark]);
  const activeRatings = ratings || autoRatings;
  const result = useMemo(() => calculateScore(activeRatings), [activeRatings]);
  const beats = useMemo(() => detectBeats(screenplay), [screenplay]);
  const charGraph = useMemo(() => buildCharacterGraph(screenplay), [screenplay]);

  const rec = REC_STYLE[result.recommendation] || REC_STYLE.Consider;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-darkest)' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: 8, borderRadius: 10, background: 'rgba(234,179,8,0.1)' }}>
            <BarChart3 size={20} style={{ color: '#eab308' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Coverage</h1>
            <p style={{ fontSize: 12, color: '#666', margin: 0 }}>{currentProject?.title} · {screenplay.length} elementos</p>
          </div>
        </div>
        <button
          onClick={() => { setManualMode(!manualMode); if (manualMode) setRatings(null); }}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', color: '#aaa', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {manualMode ? <RefreshCw size={14} /> : <Sliders size={14} />}
          {manualMode ? 'Auto' : 'Ajustar notas'}
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Score card */}
          <div style={{ background: rec.bg, border: `1px solid ${rec.border}20`, borderRadius: 16, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 32, marginBottom: 4 }}>{rec.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: rec.color }}>{rec.label}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{manualMode ? 'Manual' : 'Automático'} · Score ponderado</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: rec.color, lineHeight: 1 }}>{result.weightedAverage.toFixed(1)}</div>
              <div style={{ fontSize: 12, color: '#666' }}>/ 10</div>
            </div>
          </div>
          <HelpTip>
            <b>Score geral</b> = média ponderada dos 6 critérios. Pesos: Plot e Personagens (5), Diálogo e Estrutura (4), Pot. Comercial (3), Formatação (2). <b>Recommend</b> (&gt;7) = pronto pra mercado · <b>Consider</b> (4-7) = precisa de ajustes · <b>Pass</b> (&lt;4) = reestruturar.
          </HelpTip>

          {/* Metrics vs Benchmark */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <FileText size={16} style={{ color: '#60a5fa' }} />
              <h2 style={{ fontSize: 13, fontWeight: 700, color: '#ccc', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Métricas vs Indústria</h2>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                <select value={selectedGenre} onChange={e => setSelectedGenre(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '4px 8px', color: '#ccc', fontSize: 11, cursor: 'pointer' }}>
                  {GENRES.map(g => <option key={g.key} value={g.key}>{g.label}</option>)}
                </select>
                <select value={selectedLanguage} onChange={e => setSelectedLanguage(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '4px 8px', color: '#ccc', fontSize: 11, cursor: 'pointer' }}>
                  {LANGUAGES.map(l => <option key={l.key} value={l.key}>{l.label}</option>)}
                </select>
                <span style={{ fontSize: 11, color: '#555', whiteSpace: 'nowrap' }}>base: {benchmark.count} roteiros</span>
              </div>
            </div>
            <HelpTip>
              Filtre por gênero e idioma para comparar seu roteiro contra o subconjunto mais relevante. A barra verde = próximo do benchmark · amarela = aceitável · vermelha = fora. <b>Ratio A:D</b>: palavras de ação pra cada de diálogo. <b>INT · EXT</b>: proporção de cenas internas vs externas.
            </HelpTip>
            <MetricRow label="Ratio Ação:Diálogo" value={metrics.ratioAD} benchmark={benchmark.avg_ratio_ad} unit=":1" color="#a78bfa" />
            <MetricRow label="Palavras/fala" value={metrics.avgDialogueWords} benchmark={benchmark.avg_dialogue_words} unit="" color="#34d399" />
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: 12, color: '#ccc', width: 130, flexShrink: 0 }}>INT / I/E / EXT</span>
              <span style={{ fontSize: 12, color: '#fbbf24', fontFamily: 'monospace', width: 60, textAlign: 'right' }}>{metrics.pctInt}%</span>
              <span style={{ fontSize: 11, color: '#888', width: 16, textAlign: 'center' }}>/</span>
              <span style={{ fontSize: 12, color: '#a78bfa', fontFamily: 'monospace', width: 50, textAlign: 'center' }}>{metrics.ieScenes || 0}</span>
              <span style={{ fontSize: 11, color: '#888', width: 16, textAlign: 'center' }}>/</span>
              <span style={{ fontSize: 12, color: '#fb923c', fontFamily: 'monospace', width: 60 }}>{metrics.pctExt}%</span>
              <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(metrics.pctInt, 100)}%`, height: '100%', background: '#fbbf24', borderRadius: 2, opacity: 0.6 }} />
              </div>
              <span style={{ fontSize: 11, color: '#666', width: 110, textAlign: 'right' }}>bench {benchmark.avg_pct_int}% / {Math.round(100 - benchmark.avg_pct_int)}%</span>
            </div>
            <MetricRow label="Cenas" value={metrics.scenes} benchmark={benchmark.avg_scenes} unit="" color="#f472b6" />
            <MetricRow label="Pers. (80% diálogo)" value={metrics.charsFor80pct} benchmark={6.5} unit="" color="#34d399" />
            <MetricRow label="Páginas est." value={metrics.estimatedPages} benchmark={benchmark.avg_pages} unit="" color="#60a5fa" />
          </div>

          {/* Rating Grid */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Award size={16} style={{ color: '#eab308' }} />
              <h2 style={{ fontSize: 13, fontWeight: 700, color: '#ccc', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rating Grid</h2>
              {!manualMode && <span style={{ fontSize: 11, color: '#22c55e', marginLeft: 'auto' }}>automático</span>}
              {manualMode && <span style={{ fontSize: 11, color: '#eab308', marginLeft: 'auto' }}>arraste para ajustar</span>}
            </div>
            <HelpTip>
              Notas de 1 a 10 em cada critério. <b>Automático</b> (padrão): derivado das métricas vs benchmark. Clique "Ajustar notas" no topo para sobrepor com sua avaliação. O score geral e a recomendação se atualizam em tempo real.
            </HelpTip>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {CRITERIA.map((c, i) => {
                const val = activeRatings[c.key] || 5;
                const color = CRITERIA_COLORS[i % CRITERIA_COLORS.length];
                return (
                  <div key={c.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{c.label}</span>
                        <span style={{ fontSize: 12, color: '#555' }}>{c.desc}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ProgressBar value={val} max={10} color={color} />
                        <span style={{ fontSize: 12, color: '#555', width: 40, textAlign: 'right' }}>peso {c.weight}</span>
                      </div>
                    </div>
                    {manualMode && (
                      <input
                        type="range" min={1} max={10} value={val}
                        onChange={e => setRatings(prev => ({ ...(prev || autoRatings), [c.key]: Number(e.target.value) }))}
                        style={{ width: '100%', accentColor: color, height: 4 }}
                      />
                    )}
                    {!manualMode && (
                      <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${(val / 10) * 100}%`, height: '100%', background: `linear-gradient(90deg, ${color}66, ${color})`, borderRadius: 2 }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Beat Sheet */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <TrendingUp size={16} style={{ color: '#a78bfa' }} />
              <h2 style={{ fontSize: 13, fontWeight: 700, color: '#ccc', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Beat Sheet</h2>
              <span style={{ fontSize: 11, color: '#555', marginLeft: 'auto' }}>✅ bom · ⚠️ médio · ❌ detectado</span>
            </div>
            <HelpTip>
              Os <b>15 beats do Save the Cat</b> — estrutura padrão de Hollywood. A barra colorida mostra onde cada beat <b>deveria</b> estar (teórico). A linha branca | mostra onde o sistema <b>detectou</b> no seu texto. ✅ = batendo certo · ⚠️ = próximo · ❌ = fora do lugar esperado.
            </HelpTip>
            <div style={{ position: 'relative', height: 40, background: 'rgba(255,255,255,0.03)', borderRadius: 8, marginBottom: 16, overflow: 'hidden' }}>
              {beats.map((beat, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${Math.min(beat.pct, 99)}%`,
                    top: 0,
                    width: 2,
                    height: '100%',
                    background: beat.score === '✅' ? '#22c55e88' : beat.score === '⚠️' ? '#eab30888' : '#ef444488',
                    transition: 'all 0.2s',
                  }}
                  title={`${beat.name} (${beat.pct}%)`}
                />
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {beats.map((beat, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ fontSize: 12, width: 20, textAlign: 'center' }}>{beat.score}</span>
                  <span style={{ fontSize: 11, color: '#555', fontFamily: 'monospace', width: 36, textAlign: 'right' }}>{beat.pct}%</span>
                  <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(beat.pct, 100)}%`, height: '100%',
                      background: `linear-gradient(90deg, ${beat.score === '✅' ? '#22c55e' : beat.score === '⚠️' ? '#eab308' : '#ef4444'}44, ${beat.score === '✅' ? '#22c55e' : beat.score === '⚠️' ? '#eab308' : '#ef4444'})`,
                      borderRadius: 3,
                    }} />
                    <div style={{
                      position: 'absolute', left: `${Math.min((beat.detectedLine / Math.max(screenplay.length, 1)) * 100, 100)}%`,
                      width: 2, height: '100%', background: '#fff', opacity: 0.5,
                    }} />
                  </div>
                  <span style={{ fontSize: 12, color: '#ddd', flex: 1 }}>{beat.name}</span>
                  <span style={{ fontSize: 10, color: '#555', fontFamily: 'monospace', width: 70, textAlign: 'right' }}>
                    {beat.confidence > 0 ? `L${beat.detectedLine}` : '—'}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, fontSize: 11, color: '#666', display: 'flex', gap: 16 }}>
              <span>● linha <span style={{ color: '#888' }}>esperada (teórica)</span></span>
              <span>| linha <span style={{ color: '#fff' }}>detectada (real)</span></span>
            </div>
          </div>

          {/* Character Graph */}
          {charGraph.edges.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Users size={16} style={{ color: '#34d399' }} />
                <h2 style={{ fontSize: 13, fontWeight: 700, color: '#ccc', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Character Graph</h2>
                <span style={{ fontSize: 12, color: '#555' }}>{charGraph.edges.length} arestas, {Object.keys(charGraph.centrality).length} personagens</span>
                <span style={{ fontSize: 11, color: '#555', marginLeft: 'auto' }}>80% diálogo: ~{metrics.charsFor80pct} personagens</span>
              </div>
              <HelpTip>
                Bolhas = personagens. Tamanho = centralidade (quanto mais fala, maior). <b>80% diálogo: ~N</b> = quantos personagens carregam 80% de toda a fala do roteiro. Ideal: 5-8. Se for muitos (&gt;12), o roteiro pode estar disperso.
              </HelpTip>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {Object.entries(charGraph.centrality)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 20)
                  .map(([name, weight]) => {
                    const maxW = Math.max(...Object.values(charGraph.centrality));
                    return (
                      <div key={name} style={{
                        padding: '6px 12px', borderRadius: 20,
                        background: `rgba(52,211,153,${0.05 + (weight / maxW) * 0.2})`,
                        border: `1px solid rgba(52,211,153,${0.1 + (weight / maxW) * 0.3})`,
                        fontSize: 11, color: '#fff', display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        <span>{name.replace(/^char-(\d+)/, 'P$1')}</span>
                        <span style={{ fontSize: 12, color: '#34d399' }}>{weight}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
