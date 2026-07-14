export function diffScreenplay(oldElements, newElements) {
  const changes = [];
  const maxLen = Math.max(oldElements.length, newElements.length);
  for (let i = 0; i < maxLen; i++) {
    const oldEl = oldElements[i];
    const newEl = newElements[i];
    if (!oldEl && newEl) {
      changes.push({ type: 'added', index: i, element: newEl });
    } else if (oldEl && !newEl) {
      changes.push({ type: 'removed', index: i, element: oldEl });
    } else if (oldEl.text !== newEl.text || oldEl.type !== newEl.type) {
      changes.push({ type: 'modified', index: i, old: oldEl, new: newEl });
    }
  }
  return changes;
}

export function groupChanges(changes) {
  const groups = [];
  let currentGroup = null;
  changes.forEach((change, i) => {
    if (!currentGroup || change.index !== changes[i - 1]?.index + 1) {
      currentGroup = { startIndex: change.index, changes: [] };
      groups.push(currentGroup);
    }
    currentGroup.changes.push(change);
  });
  return groups;
}
