import React, { useState, useMemo } from 'react';
import { useProject } from '../context/ProjectContext';
import { CRITERIA, calculateScore, analyzeBeats, buildCharacterGraph } from '../lib/scriptCoverage';
import { BarChart3, Award, Users, TrendingUp, FileText } from 'lucide-react';

const REC_STYLE = {
  Recommend: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: '#22c55e', label: 'Recomendado', icon: '★' },
  Consider: { color: '#eab308', bg: 'rgba(234,179,8,0.08)', border: '#eab308', label: 'Considerar', icon: '◆' },
  Pass: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: '#ef4444', label: 'Passar', icon: '▼' },
};

const CRITERIA_COLORS = ['#a78bfa', '#60a5fa', '#34d399', '#f472b6', '#fbbf24', '#fb923c'];

function ProgressBar({ value, max, color, label }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})`, transition: 'width 0.3s ease' }}
          className="h-full rounded-full"
        />
      </div>
      <span className="text-xs font-mono text-gray-400 w-10 text-right">{value}/{max}</span>
    </div>
  );
}

export default function CoverageReport() {
  const { currentProject } = useProject();
  const screenplay = currentProject?.screenplay || [];
  const entities = currentProject?.entities || {};

  const [ratings, setRatings] = useState(() => {
    const r = {};
    CRITERIA.forEach(c => { r[c.key] = 5; });
    return r;
  });

  const result = useMemo(() => calculateScore(ratings), [ratings]);
  const beats = useMemo(() => analyzeBeats(screenplay), [screenplay]);
  const charGraph = useMemo(() => buildCharacterGraph(screenplay), [screenplay]);

  const rec = REC_STYLE[result.recommendation] || REC_STYLE.Consider;

  const totalDialogue = screenplay.filter(e => e.type === 'dialogue').length;
  const totalAction = screenplay.filter(e => e.type === 'action').length;
  const totalSceneHeadings = screenplay.filter(e => e.type === 'scene-heading').length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-darkest)' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ padding: 8, borderRadius: 10, background: 'rgba(234,179,8,0.1)' }}>
          <BarChart3 size={20} style={{ color: '#eab308' }} />
        </div>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Coverage</h1>
          <p style={{ fontSize: 12, color: '#666', margin: 0 }}>{currentProject?.title} · {screenplay.length} elementos</p>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Score card */}
          <div style={{ background: rec.bg, border: `1px solid ${rec.border}20`, borderRadius: 16, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 32, marginBottom: 4 }}>{rec.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: rec.color }}>{rec.label}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Score geral ponderado</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: rec.color, lineHeight: 1 }}>{result.weightedAverage.toFixed(1)}</div>
              <div style={{ fontSize: 12, color: '#666' }}>/ 10</div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'Cenas', value: totalSceneHeadings, color: '#60a5fa' },
              { label: 'Diálogos', value: totalDialogue, color: '#34d399' },
              { label: 'Ações', value: totalAction, color: '#a78bfa' },
              { label: 'Personagens', value: Object.keys(charGraph.centrality).length, color: '#f472b6' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Rating Grid */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Award size={16} style={{ color: '#eab308' }} />
              <h2 style={{ fontSize: 13, fontWeight: 700, color: '#ccc', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rating Grid</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {CRITERIA.map((c, i) => {
                const val = ratings[c.key] || 5;
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
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={val}
                      onChange={e => setRatings(prev => ({ ...prev, [c.key]: Number(e.target.value) }))}
                      style={{ width: '100%', accentColor: color, height: 4 }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Beat Sheet */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <TrendingUp size={16} style={{ color: '#a78bfa' }} />
              <h2 style={{ fontSize: 13, fontWeight: 700, color: '#ccc', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Beat Sheet</h2>
            </div>
            <div style={{ position: 'relative', height: 40, background: 'rgba(255,255,255,0.03)', borderRadius: 8, marginBottom: 16, overflow: 'hidden' }}>
              {beats.map((beat, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${beat.pct}%`,
                    top: 0,
                    width: 2,
                    height: '100%',
                    background: i % 2 === 0 ? '#a78bfa88' : '#60a5fa88',
                    transition: 'all 0.2s',
                  }}
                  title={`${beat.name} (${beat.pct}%)`}
                />
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {beats.map((beat, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ fontSize: 12, color: '#555', fontFamily: 'monospace', width: 40, textAlign: 'right' }}>{beat.pct}%</span>
                  <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ width: `${beat.pct}%`, height: '100%', background: `linear-gradient(90deg, ${i % 2 === 0 ? '#a78bfa' : '#60a5fa'}44, ${i % 2 === 0 ? '#a78bfa' : '#60a5fa'})`, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 12, color: '#ddd', flex: 1 }}>{beat.name}</span>
                  <span style={{ fontSize: 12, color: '#555', fontFamily: 'monospace' }}>~{beat.expectedLine}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Character Graph */}
          {charGraph.edges.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <Users size={16} style={{ color: '#34d399' }} />
                <h2 style={{ fontSize: 13, fontWeight: 700, color: '#ccc', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Character Graph</h2>
                <span style={{ fontSize: 12, color: '#555' }}>{charGraph.edges.length} arestas, {Object.keys(charGraph.centrality).length} personagens</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {Object.entries(charGraph.centrality)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 20)
                  .map(([name, weight]) => {
                    const maxW = Math.max(...Object.values(charGraph.centrality));
                    const size = 30 + (weight / maxW) * 40;
                    return (
                      <div
                        key={name}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 20,
                          background: `rgba(52,211,153,${0.05 + (weight / maxW) * 0.2})`,
                          border: `1px solid rgba(52,211,153,${0.1 + (weight / maxW) * 0.3})`,
                          fontSize: 11,
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
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
