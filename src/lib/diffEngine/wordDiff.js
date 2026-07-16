export function tokenize(text) {
  if (!text) return [];
  return text.split(/(\s+)/).filter(t => t.length > 0);
}

export function wordDiff(oldText, newText) {
  const oldTokens = tokenize(oldText);
  const newTokens = tokenize(newText);
  const m = oldTokens.length;
  const n = newTokens.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldTokens[i - 1] === newTokens[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const segments = [];
  let i = m;
  let j = n;
  const temp = [];
  while (i > 0 && j > 0) {
    if (oldTokens[i - 1] === newTokens[j - 1]) {
      temp.unshift({ type: 'equal', text: oldTokens[i - 1] });
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      temp.unshift({ type: 'removed', text: oldTokens[i - 1] });
      i--;
    } else {
      temp.unshift({ type: 'added', text: newTokens[j - 1] });
      j--;
    }
  }
  while (i > 0) {
    temp.unshift({ type: 'removed', text: oldTokens[i - 1] });
    i--;
  }
  while (j > 0) {
    temp.unshift({ type: 'added', text: newTokens[j - 1] });
    j--;
  }
  for (const seg of temp) {
    const last = segments[segments.length - 1];
    if (last && last.type === seg.type) {
      last.text += seg.text;
    } else {
      segments.push({ ...seg });
    }
  }
  return segments;
}

export function wordDiffHtml(oldText, newText) {
  const segments = wordDiff(oldText || '', newText || '');
  return segments.map(seg => {
    const escaped = seg.text.replace(/</g, '<').replace(/>/g, '>');
    if (seg.type === 'equal') return escaped;
    if (seg.type === 'added') return `<ins style="color:#10b981;background:rgba(16,185,129,0.1);text-decoration:none">${escaped}</ins>`;
    if (seg.type === 'removed') return `<del style="color:#f87171;background:rgba(239,68,68,0.1);">${escaped}</del>`;
    return escaped;
  }).join('');
}

export function hasWordChanges(oldText, newText) {
  if (!oldText && !newText) return false;
  if (!oldText || !newText) return true;
  return oldText !== newText;
}
