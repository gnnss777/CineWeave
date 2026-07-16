export function lcsTable(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp;
}

export function backtrackLcs(a, b, dp) {
  const result = [];
  let i = a.length;
  let j = b.length;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      result.unshift({ type: 'equal', aIndex: i - 1, bIndex: j - 1, value: a[i - 1] });
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      result.unshift({ type: 'removed', aIndex: i - 1, bIndex: null, value: a[i - 1] });
      i--;
    } else {
      result.unshift({ type: 'added', aIndex: null, bIndex: j - 1, value: b[j - 1] });
      j--;
    }
  }
  while (i > 0) {
    result.unshift({ type: 'removed', aIndex: i - 1, bIndex: null, value: a[i - 1] });
    i--;
  }
  while (j > 0) {
    result.unshift({ type: 'added', aIndex: null, bIndex: j - 1, value: b[j - 1] });
    j--;
  }
  return result;
}

export function diffBlockOrders(orderA, orderB) {
  const hashA = orderA.map(([, h]) => h);
  const hashB = orderB.map(([, h]) => h);
  const dp = lcsTable(hashA, hashB);
  const raw = backtrackLcs(hashA, hashB, dp);
  const changes = [];
  let displayIndex = 0;
  for (const op of raw) {
    if (op.type === 'equal') {
      displayIndex++;
    } else if (op.type === 'added') {
      const [blockId, hash] = orderB[op.bIndex];
      changes.push({
        type: 'added',
        index: op.bIndex,
        displayIndex,
        blockId,
        hash,
        block: null
      });
      displayIndex++;
    } else if (op.type === 'removed') {
      const [blockId, hash] = orderA[op.aIndex];
      changes.push({
        type: 'removed',
        index: op.aIndex,
        displayIndex,
        blockId,
        hash,
        block: null
      });
    }
  }
  const stats = {
    added: changes.filter(c => c.type === 'added').length,
    removed: changes.filter(c => c.type === 'removed').length,
    modified: 0,
    unchanged: raw.filter(r => r.type === 'equal').length
  };
  return { changes, stats, raw };
}

export function enrichChanges(changes, blockStoreA, blockStoreB) {
  for (const c of changes) {
    if (c.type === 'removed' && blockStoreA) {
      const content = blockStoreA[c.hash];
      if (content) c.block = { id: c.blockId, type: content.type, text: content.text, entityId: content.entityId };
    } else if (c.type === 'added' && blockStoreB) {
      const content = blockStoreB[c.hash];
      if (content) c.block = { id: c.blockId, type: content.type, text: content.text, entityId: content.entityId };
    }
  }
  return changes;
}

export function detectModifications(changes) {
  const result = [];
  let i = 0;
  while (i < changes.length) {
    const c = changes[i];
    const next = changes[i + 1];
    if (c.type === 'removed' && next && next.type === 'added' && next.displayIndex === c.displayIndex) {
      result.push({
        type: 'modified',
        index: c.index,
        displayIndex: c.displayIndex,
        oldBlockId: c.blockId,
        oldHash: c.hash,
        oldBlock: c.block,
        newBlockId: next.blockId,
        newHash: next.hash,
        newBlock: next.block
      });
      i += 2;
    } else {
      result.push(c);
      i++;
    }
  }
  return result;
}
