export function groupByScene(changes) {
  const sceneGroups = [];
  let currentScene = null;
  let currentGroup = null;
  for (const change of changes) {
    const block = change.block || (change.oldBlock || change.newBlock);
    if (block && block.type === 'scene-heading') {
      currentScene = block.text;
      currentGroup = { scene: currentScene, changes: [], added: 0, removed: 0, modified: 0 };
      sceneGroups.push(currentGroup);
      currentGroup.changes.push(change);
      if (change.type === 'added') currentGroup.added++;
      else if (change.type === 'removed') currentGroup.removed++;
      else if (change.type === 'modified') currentGroup.modified++;
    } else if (currentGroup) {
      currentGroup.changes.push(change);
      if (change.type === 'added') currentGroup.added++;
      else if (change.type === 'removed') currentGroup.removed++;
      else if (change.type === 'modified') currentGroup.modified++;
    } else {
      currentGroup = { scene: '(antes da primeira cena)', changes: [], added: 0, removed: 0, modified: 0 };
      sceneGroups.push(currentGroup);
      currentGroup.changes.push(change);
      if (change.type === 'added') currentGroup.added++;
      else if (change.type === 'removed') currentGroup.removed++;
      else if (change.type === 'modified') currentGroup.modified++;
    }
  }
  return sceneGroups;
}

export function getSceneList(screenplay) {
  const scenes = [];
  let currentScene = null;
  let currentBlocks = [];
  for (const block of screenplay || []) {
    if (block.type === 'scene-heading') {
      if (currentScene) {
        scenes.push({ heading: currentScene, blocks: currentBlocks });
      }
      currentScene = block.text;
      currentBlocks = [block];
    } else {
      currentBlocks.push(block);
    }
  }
  if (currentScene) {
    scenes.push({ heading: currentScene, blocks: currentBlocks });
  }
  return scenes;
}

export function getStats(screenplay) {
  const text = (screenplay || []).map(b => b.text || '').join(' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  const scenes = (screenplay || []).filter(b => b.type === 'scene-heading').length;
  const characters = (screenplay || []).filter(b => b.type === 'character').length;
  const dialogues = (screenplay || []).filter(b => b.type === 'dialogue').length;
  const actions = (screenplay || []).filter(b => b.type === 'action').length;
  return { words, scenes, characters, dialogues, actions, blocks: (screenplay || []).length };
}
