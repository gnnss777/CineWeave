export function contentKey(type, text, entityId) {
  return `${type || ''}\x00${text || ''}\x00${entityId || ''}`;
}

function cleanBlockContent(block) {
  const obj = { type: block.type, text: block.text };
  if (block.entityId) obj.entityId = block.entityId;
  return obj;
}

export function screenplayToBlocks(screenplay) {
  const blockStore = {};
  const blockOrder = [];
  for (const block of (screenplay || [])) {
    const content = cleanBlockContent(block);
    const key = contentKey(content.type, content.text, content.entityId);
    if (!blockStore[key]) blockStore[key] = content;
    blockOrder.push([block.id, key]);
  }
  return { blockStore, blockOrder };
}

export function blocksToScreenplay(blockOrder, blockStore) {
  return blockOrder.map(([blockId, key]) => {
    const content = blockStore[key];
    if (!content) return { id: blockId, type: 'action', text: '[conteúdo perdido]' };
    const block = { id: blockId, type: content.type, text: content.text };
    if (content.entityId) block.entityId = content.entityId;
    return block;
  });
}

export function mergeBlockStores(target, source) {
  for (const key in source) {
    if (!target[key]) target[key] = source[key];
  }
  return target;
}
