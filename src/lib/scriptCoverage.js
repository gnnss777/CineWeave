import benchmarkData from '../../ROTEIROS/benchmark_data.json';

export const CRITERIA = [
  { key: 'plot', label: 'Plot', weight: 5, desc: 'Estrutura, originalidade, lógica' },
  { key: 'character', label: 'Personagens', weight: 5, desc: 'Profundidade, arco, motivação' },
  { key: 'dialogue', label: 'Diálogo', weight: 4, desc: 'Naturalidade, subtexto, voz única' },
  { key: 'structure', label: 'Estrutura', weight: 4, desc: 'Atos, beats, pacing' },
  { key: 'commercial', label: 'Potencial Comercial', weight: 3, desc: 'Mercado, público-alvo' },
  { key: 'format', label: 'Formatação', weight: 2, desc: 'Formato correto, erros' },
];

export const GENRES = [
  { key: 'all', label: 'Todos os gêneros' },
  ...Object.entries(benchmarkData.genres || {}).map(([k, v]) => ({ key: k, label: v.label, color: v.color })),
];

export const LANGUAGES = [
  { key: 'all', label: 'Todos os idiomas' },
  ...Object.entries(benchmarkData.languages || {}).map(([k, v]) => ({ key: k, label: v.label })),
];

export function getFilteredBenchmark(genre = 'all', language = 'all') {
  const entries = Object.values(benchmarkData.screenplays).filter(s => {
    if (genre !== 'all' && s.genre !== genre) return false;
    if (language !== 'all' && s.language !== language) return false;
    return true;
  });

  if (entries.length === 0) {
    return { avg_ratio_ad: 4.37, avg_dialogue_words: 5.82, avg_action_words: 6.99, avg_pct_int: 62, avg_scenes: 140, avg_unique_characters: 75, avg_pages: 127, count: 0 };
  }

  const avg = key => Math.round(entries.reduce((s, e) => s + (e[key] || 0), 0) / entries.length * 100) / 100;

  return {
    avg_ratio_ad: avg('ratio_ad'),
    avg_dialogue_words: avg('avg_dialogue_words'),
    avg_action_words: avg('avg_action_words'),
    avg_pct_int: avg('pct_int'),
    avg_scenes: avg('scenes'),
    avg_unique_characters: avg('unique_chars'),
    avg_pages: avg('pages'),
    count: entries.length,
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

function scoreProximity(value, target, tolerance) {
  if (!value || target <= 0) return 5;
  const diff = Math.abs(value - target);
  if (diff <= tolerance) return 10;
  return Math.max(1, Math.round((10 - (diff - tolerance) / (target * 0.5) * 9) * 10) / 10);
}

export function extractMetrics(screenplay) {
  let actionWords = 0, dialogueWords = 0;
  let actionLines = 0, dialogueLines = 0;
  let sceneHeadings = 0, intScenes = 0, extScenes = 0, ieScenes = 0;
  const chars = new Set();
  const charDialogue = {};
  let lastChar = null;
  let transitions = 0, parentheticals = 0;
  let dialogueChars = 0;
  let uppercaseErrors = 0, totalCharCues = 0;
  let totalWords = 0;

  screenplay.forEach(el => {
    const words = el.text.split(/\s+/).filter(w => w.length > 0);
    totalWords += words.length;

    switch (el.type) {
      case 'scene-heading': {
        sceneHeadings++;
        if (/^(?:I\/E|INT\.\/EXT)\./i.test(el.text)) ieScenes++;
        else if (/^INT\./i.test(el.text) && !/^EXT\./i.test(el.text)) intScenes++;
        else if (/^EXT\./i.test(el.text) && !/^INT\./i.test(el.text)) extScenes++;
        const validPrefix = /^(INT\.|EXT\.|INT\.\/EXT\.|I\/E\.)\s/i;
        if (!validPrefix.test(el.text.trim())) uppercaseErrors++;
        break;
      }
      case 'action':
        actionLines++;
        actionWords += words.length;
        break;
      case 'character': {
        const name = el.text.trim();
        chars.add(name.toLowerCase());
        totalCharCues++;
        if (name !== name.toUpperCase() && name.length > 1) uppercaseErrors++;
        lastChar = name;
        break;
      }
      case 'dialogue':
        dialogueLines++;
        dialogueWords += words.length;
        if (lastChar) {
          charDialogue[lastChar] = (charDialogue[lastChar] || 0) + words.length;
          dialogueChars++;
        }
        break;
      case 'parenthetical':
        parentheticals++;
        break;
      case 'transition':
        transitions++;
        break;
    }
  });

  const totalScenes = intScenes + extScenes + ieScenes;
  const ratioAD = dialogueWords > 0 ? actionWords / dialogueWords : 0;
  const avgDialogueWords = dialogueLines > 0 ? dialogueWords / dialogueLines : 0;
  const avgActionWords = actionLines > 0 ? actionWords / actionLines : 0;
  const charDialogueSorted = Object.entries(charDialogue).sort(([, a], [, b]) => b - a);
  const totalCharWords = charDialogueSorted.reduce((s, [, w]) => s + w, 0);
  let charsFor80 = 0, accumulated = 0;
  for (const [, w] of charDialogueSorted) {
    accumulated += w;
    charsFor80++;
    if (totalCharWords > 0 && accumulated / totalCharWords >= 0.8) break;
  }

  const pctInt = totalScenes > 0 ? (intScenes / totalScenes) * 100 : 0;
  const pctExt = totalScenes > 0 ? (extScenes / totalScenes) * 100 : 0;

  return {
    scenes: sceneHeadings,
    intScenes, extScenes, ieScenes,
    actionLines, actionWords,
    dialogueLines, dialogueWords,
    totalWords,
    estimatedPages: Math.round(totalWords / 188),
    ratioAD: Math.round(ratioAD * 100) / 100,
    avgDialogueWords: Math.round(avgDialogueWords * 10) / 10,
    avgActionWords: Math.round(avgActionWords * 10) / 10,
    pctInt: Math.round(pctInt * 10) / 10,
    pctExt: Math.round(pctExt * 10) / 10,
    uniqueChars: chars.size,
    charsFor80pct: charsFor80,
    transitions, parentheticals,
    totalElements: screenplay.length,
    formatErrors: uppercaseErrors,
    parentheticalPct: dialogueLines > 0 ? Math.round((parentheticals / dialogueLines) * 100) : 0,
  };
}

export function autoRate(metrics, benchmark) {
  const b = benchmark || getFilteredBenchmark();
  const plotScore = Math.round((
    scoreProximity(metrics.ratioAD, b.avg_ratio_ad, 2) +
    scoreProximity(metrics.scenes, b.avg_scenes, 60)
  ) / 2 * 10) / 10;

  const charCoverage = metrics.uniqueChars > 0 && metrics.charsFor80pct > 0
    ? Math.min(10, Math.max(0, (1 - metrics.charsFor80pct / Math.max(metrics.uniqueChars, 1)) * 12 + 2))
    : 5;
  const charScore = Math.round((
    Math.min(10, (metrics.uniqueChars / 10) * 6) + charCoverage
  ) / 2 * 10) / 10;

  const dialogueScore = scoreProximity(metrics.avgDialogueWords, b.avg_dialogue_words, 2);

  const structureScore = Math.round((
    scoreProximity(metrics.pctInt, b.avg_pct_int, 15) +
    (metrics.transitions <= Math.max(metrics.scenes, 1) ? 10 : Math.max(1, 10 - (metrics.transitions - metrics.scenes)))
  ) / 2 * 10) / 10;

  const commercialScore = metrics.ratioAD >= 2 && metrics.ratioAD <= 8 ? 8 : 5;

  const formatScore = Math.round(Math.max(1, 10 - metrics.formatErrors / 2) * 10) / 10;

  const clamp = v => Math.max(1, Math.min(10, v));

  return {
    plot: clamp(plotScore),
    character: clamp(charScore),
    dialogue: clamp(dialogueScore),
    structure: clamp(structureScore),
    commercial: commercialScore,
    format: clamp(formatScore),
  };
}

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

function getSceneRanges(screenplay) {
  const ranges = [];
  let start = null;
  screenplay.forEach((el, i) => {
    if (el.type === 'scene-heading') {
      if (start !== null) ranges[ranges.length - 1].end = i - 1;
      start = i;
      ranges.push({ start, end: i, headingText: el.text });
    }
  });
  if (ranges.length && ranges[ranges.length - 1].end === undefined) {
    ranges[ranges.length - 1].end = screenplay.length - 1;
  }
  return ranges;
}

function getSceneIntensity(screenplay, sceneRange) {
  const slice = screenplay.slice(sceneRange.start, sceneRange.end + 1);
  const actionW = slice.filter(e => e.type === 'action').reduce((s, e) => s + e.text.split(/\s+/).filter(w => w.length).length, 0);
  const dialogueW = slice.filter(e => e.type === 'dialogue').reduce((s, e) => s + e.text.split(/\s+/).filter(w => w.length).length, 0);
  const chars = slice.filter(e => e.type === 'character').length;
  return { actionWords: actionW, dialogueWords: dialogueW, totalWords: actionW + dialogueW, chars };
}

export function detectBeats(screenplay) {
  const total = screenplay.length;
  if (total === 0) return SAVE_THE_CAT.map(b => ({ ...b, expectedLine: 0, detectedLine: 0, confidence: 0, score: '❌' }));

  const scenes = getSceneRanges(screenplay);
  const sceneIntensities = scenes.map(s => ({ ...s, ...getSceneIntensity(screenplay, s) }));
  const avgIntensity = sceneIntensities.reduce((s, sc) => s + sc.totalWords, 0) / Math.max(sceneIntensities.length, 1);

  return SAVE_THE_CAT.map((beat, idx) => {
    const expectedLine = Math.floor(total * beat.pct / 100);
    let detectedLine = expectedLine;
    let confidence = 5;

    const sceneAtPct = scenes.find(s => s.start <= expectedLine && s.end >= expectedLine);

    if (scenes.length > 0 && sceneAtPct) detectedLine = sceneAtPct.start;

    if (beat.name === 'Opening Image') {
      detectedLine = 0;
      confidence = 10;
    } else if (beat.name === 'Final Image') {
      const lastScene = scenes[scenes.length - 1];
      detectedLine = lastScene ? lastScene.start : total - 1;
      confidence = 10;
    } else if (beat.name === 'Catalyst') {
      const firstBig = sceneIntensities.find(s => s.totalWords > avgIntensity * 1.3 && s.start > 0);
      if (firstBig) { detectedLine = firstBig.start; confidence = 7; }
    } else if (beat.name === 'Midpoint') {
      const mid = [...sceneIntensities].filter(s => s.start / total > 0.4 && s.start / total < 0.7)
        .sort((a, b) => b.totalWords - a.totalWords);
      if (mid.length) { detectedLine = mid[0].start; confidence = 7; }
    } else if (beat.name === 'All Is Lost') {
      const low = [...sceneIntensities].filter(s => s.start / total > 0.6 && s.start / total < 0.85)
        .sort((a, b) => a.dialogueWords - b.dialogueWords);
      if (low.length) { detectedLine = low[0].start; confidence = 6; }
    } else if (beat.name === 'Finale') {
      const lastThird = [...sceneIntensities].filter(s => s.start / total > 0.8)
        .sort((a, b) => b.totalWords - a.totalWords);
      if (lastThird.length) { detectedLine = lastThird[0].start; confidence = 7; }
    } else if (beat.name === 'Break into Two' || beat.name === 'Break into Three') {
      const range = beat.name === 'Break into Two' ? [0.15, 0.3] : [0.75, 0.9];
      const candidates = sceneIntensities.filter(s => {
        const pct = s.start / total;
        return pct >= range[0] && pct <= range[1];
      }).sort((a, b) => b.totalWords - a.totalWords);
      if (candidates.length && sceneAtPct) {
        const closest = candidates.reduce((best, c) =>
          Math.abs(c.start - expectedLine) < Math.abs(best.start - expectedLine) ? c : best
        );
        detectedLine = closest.start;
        confidence = 6;
      }
    } else if (beat.name === 'B Story') {
      const newChars = [];
      const seen = new Set();
      screenplay.forEach((el, i) => {
        if (el.type === 'character' && !seen.has(el.text.trim().toLowerCase())) {
          seen.add(el.text.trim().toLowerCase());
          newChars.push({ name: el.text, line: i });
        }
      });
      const midIntro = newChars.find(c => c.line > total * 0.15 && c.line < total * 0.35);
      if (midIntro) { detectedLine = midIntro.line; confidence = 6; }
    } else if (beat.name === 'Debate') {
      const debate = sceneIntensities.find(s => {
        const pct = s.start / total;
        return pct > 0.05 && pct < 0.2 && s.dialogueWords > s.actionWords && s.dialogueWords > 0;
      });
      if (debate) { detectedLine = debate.start; confidence = 6; }
    }

    return {
      ...beat,
      expectedLine,
      detectedLine,
      confidence: Math.round(Math.min(10, Math.max(0, confidence)) * 10) / 10,
      score: confidence >= 7 ? '✅' : confidence >= 4 ? '⚠️' : '❌',
    };
  });
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
