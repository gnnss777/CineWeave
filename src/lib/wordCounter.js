export function countWords(screenplay) {
  return (screenplay || [])
    .filter(el => el.type === 'action' || el.type === 'dialogue')
    .reduce((sum, el) => sum + (el.text || '').split(/\s+/).filter(w => w.length > 0).length, 0);
}

export function getDailyStats(projectId) {
  const key = `cineweave_stats_${projectId}`;
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : { wordsToday: 0, streak: 0, lastDate: null };
}

export function updateDailyStats(projectId, wordCount) {
  const stats = getDailyStats(projectId);
  const today = new Date().toISOString().split('T')[0];

  if (stats.lastDate === today) {
    stats.wordsToday = wordCount;
  } else {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (stats.lastDate === yesterday && wordCount > 0) {
      stats.streak++;
    } else if (stats.lastDate !== today) {
      stats.streak = wordCount > 0 ? 1 : 0;
    }
    stats.wordsToday = wordCount;
    stats.lastDate = today;
  }

  localStorage.setItem(`cineweave_stats_${projectId}`, JSON.stringify(stats));
  return stats;
}

export function getStreak(projectId) {
  return getDailyStats(projectId).streak;
}
