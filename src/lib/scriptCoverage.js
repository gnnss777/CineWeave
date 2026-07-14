export const CRITERIA = [
  { key: 'plot', label: 'Plot', weight: 5, desc: 'Estrutura, originalidade, lógica' },
  { key: 'character', label: 'Personagens', weight: 5, desc: 'Profundidade, arco, motivação' },
  { key: 'dialogue', label: 'Diálogo', weight: 4, desc: 'Naturalidade, subtexto, voz única' },
  { key: 'structure', label: 'Estrutura', weight: 4, desc: 'Atos, beats, pacing' },
  { key: 'commercial', label: 'Potencial Comercial', weight: 3, desc: 'Mercado, público-alvo' },
  { key: 'format', label: 'Formatação', weight: 2, desc: 'Formato correto, erros' },
];

export function calculateScore(ratings) {
  const totalWeight = CRITERIA.reduce((s, c) => s + c.weight, 0);
  const weighted = CRITERIA.reduce((s, c) => s + (ratings[c.key] || 5) * c.weight, 0);
  const final = weighted / totalWeight;
  return {
    scores: ratings,
    weightedAverage: Math.round(final * 10) / 10,
    recommendation: final < 4 ? 'Pass' : final < 7 ? 'Consider' : 'Recommend',
  };
}

export const SAVE_THE_CAT = [
  { name: 'Opening Image', pct: 1 },
  { name: 'Theme Stated', pct: 5 },
  { name: 'Catalyst', pct: 10 },
  { name: 'Debate', pct: 10 },
  { name: 'Break into Two', pct: 20 },
  { name: 'B Story', pct: 22 },
  { name: 'Fun & Games', pct: 20 },
  { name: 'Midpoint', pct: 55 },
  { name: 'Bad Guys Close In', pct: 55 },
  { name: 'All Is Lost', pct: 75 },
  { name: 'Dark Night of the Soul', pct: 75 },
  { name: 'Break into Three', pct: 85 },
  { name: 'Finale', pct: 85 },
  { name: 'Final Image', pct: 99 },
];

export function analyzeBeats(screenplay) {
  const total = screenplay.length;
  return SAVE_THE_CAT.map(beat => ({
    ...beat,
    expectedLine: Math.floor(total * beat.pct / 100),
  }));
}

export function buildCharacterGraph(screenplay) {
  const edges = {};
  let last = null;

  screenplay.forEach(el => {
    if (el.type === 'character') {
      if (last && last !== (el.entityId || el.text)) {
        const k = [last, el.entityId || el.text].sort().join('::');
        edges[k] = (edges[k] || 0) + 1;
      }
      last = el.entityId || el.text;
    }
  });

  const centrality = {};
  Object.entries(edges).forEach(([k, w]) => {
    const [a, b] = k.split('::');
    centrality[a] = (centrality[a] || 0) + w;
    centrality[b] = (centrality[b] || 0) + w;
  });

  return {
    edges: Object.entries(edges).map(([k, w]) => {
      const [s, t] = k.split('::');
      return { source: s, target: t, weight: w };
    }),
    centrality,
  };
}
