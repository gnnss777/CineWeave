export function initMergedScreenplay(baseScreenplay) {
  return (baseScreenplay || []).map((b, i) => ({
    ...b,
    _mergeSource: 'base',
    _mergeIndex: i,
    _selected: true
  }));
}

export function toggleBlock(merged, index) {
  if (!merged[index]) return merged;
  const updated = [...merged];
  updated[index] = { ...updated[index], _selected: !updated[index]._selected };
  return updated;
}

export function replaceBlockFromVersion(merged, index, replacementBlock) {
  if (!merged[index]) return merged;
  const updated = [...merged];
  updated[index] = {
    ...replacementBlock,
    _mergeSource: 'replacement',
    _mergeIndex: index,
    _selected: true
  };
  return updated;
}

export function insertBlockFromVersion(merged, index, blockToInsert) {
  const updated = [...merged];
  updated.splice(index, 0, {
    ...blockToInsert,
    _mergeSource: 'inserted',
    _mergeIndex: index,
    _selected: true
  });
  return updated;
}

export function removeBlock(merged, index) {
  const updated = [...merged];
  updated.splice(index, 1);
  return updated;
}

export function finalizeMerge(merged) {
  return merged.filter(b => b._selected).map(b => {
    const clean = { id: b.id, type: b.type, text: b.text };
    if (b.entityId) clean.entityId = b.entityId;
    return clean;
  });
}

export function compareBlockContent(blockA, blockB) {
  if (!blockA || !blockB) return false;
  return blockA.type === blockB.type && blockA.text === blockB.text;
}

export function findMatchingBlockIndex(merged, block) {
  return merged.findIndex(b => compareBlockContent(b, block));
}
