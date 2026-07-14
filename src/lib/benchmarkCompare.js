const INDUSTRY_BENCHMARKS = {
  feature_film: {
    avg_ratio_ad: 1.2,
    avg_dialogue_words: 28,
    avg_action_words: 18,
    avg_pct_int: 55,
  },
  tv_episode: {
    avg_ratio_ad: 0.9,
    avg_dialogue_words: 22,
    avg_action_words: 14,
    avg_pct_int: 65,
  },
};

function compareMetric(user, benchmark, highRatio, lowRatio, label) {
  const ratio = user / benchmark;
  let status = '✅';
  let suggestion = '';
  if (ratio > highRatio) {
    status = '⚠️';
    suggestion = `Muito alto (${user.toFixed(1)} vs ${benchmark} benchmark).`;
  } else if (ratio < lowRatio) {
    status = '⚠️';
    suggestion = `Muito baixo (${user.toFixed(1)} vs ${benchmark} benchmark).`;
  } else {
    suggestion = 'Dentro do padrão.';
  }
  return { label, user, benchmark, ratio: ratio.toFixed(2), status, suggestion };
}

export function compareToIndustry(metrics, genre = 'feature_film') {
  const ind = INDUSTRY_BENCHMARKS[genre];
  if (!ind) return null;

  return {
    ratio_ad: compareMetric(metrics.ratio_ad, ind.avg_ratio_ad, 1.5, 0.5, 'Ratio Ação:Diálogo'),
    dialogue_words: compareMetric(metrics.avg_dialogue_words, ind.avg_dialogue_words, 1.3, 0.7, 'Palavras por fala'),
    action_words: compareMetric(metrics.avg_action_words, ind.avg_action_words, 1.3, 0.7, 'Palavras por ação'),
    pct_int: compareMetric(metrics.pct_int, ind.avg_pct_int, 1.2, 0.8, '% INT'),
  };
}

export function computeScreenplayMetrics(screenplay) {
  const dialogueBlocks = screenplay.filter(e => e.type === 'dialogue');
  const actionBlocks = screenplay.filter(e => e.type === 'action');
  const sceneHeadings = screenplay.filter(e => e.type === 'scene-heading');

  const totalDialogueWords = dialogueBlocks.reduce((s, e) => s + e.text.split(/\s+/).filter(w => w.length > 0).length, 0);
  const totalActionWords = actionBlocks.reduce((s, e) => s + e.text.split(/\s+/).filter(w => w.length > 0).length, 0);
  const intScenes = sceneHeadings.filter(e => /^INT\./i.test(e.text)).length;

  return {
    ratio_ad: totalActionWords > 0 ? totalDialogueWords / totalActionWords : 0,
    avg_dialogue_words: dialogueBlocks.length > 0 ? totalDialogueWords / dialogueBlocks.length : 0,
    avg_action_words: actionBlocks.length > 0 ? totalActionWords / actionBlocks.length : 0,
    pct_int: sceneHeadings.length > 0 ? (intScenes / sceneHeadings.length) * 100 : 0,
  };
}
