const FOUNTAIN_PATTERNS = {
  sceneHeading: /^(INT\.|EXT\.|INT\.\/EXT\.|I\/E\.)/i,
  character: /^[A-Z\s\.\'\-]+$/,
  parenthetical: /^\(/,
  transition: /^TO:$/i,
  blank: /^$/,
};

export function parseFountain(text) {
  const elements = [];
  const lines = text.split('\n');

  let inMetadata = true;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';

    if (trimmed === '===') {
      inMetadata = false;
      continue;
    }

    if (inMetadata) continue;

    // Scene heading
    if (FOUNTAIN_PATTERNS.sceneHeading.test(trimmed)) {
      elements.push({
        id: `sc-import-${i}`,
        type: 'scene-heading',
        text: trimmed,
      });
      continue;
    }

    // Character (all-caps, preceded by blank, followed by non-blank)
    const prevLine = i > 0 ? lines[i - 1].trim() : '';
    if (
      trimmed.length >= 2 &&
      trimmed === trimmed.toUpperCase() &&
      trimmed === trimmed.replace(/[\(\)]/g, '').trim() &&
      FOUNTAIN_PATTERNS.blank.test(prevLine) &&
      !FOUNTAIN_PATTERNS.blank.test(nextLine) &&
      !FOUNTAIN_PATTERNS.blank.test(trimmed)
    ) {
      elements.push({
        id: `sc-import-${i}`,
        type: 'character',
        text: trimmed,
      });
      continue;
    }

    // Parenthetical
    if (trimmed.startsWith('(')) {
      elements.push({
        id: `sc-import-${i}`,
        type: 'parenthetical',
        text: trimmed,
      });
      continue;
    }

    // Transition
    if (trimmed.endsWith('TO:') || trimmed.startsWith('>')) {
      elements.push({
        id: `sc-import-${i}`,
        type: 'transition',
        text: trimmed.replace(/^>/, ''),
      });
      continue;
    }

    // Action (default)
    if (!FOUNTAIN_PATTERNS.blank.test(trimmed)) {
      elements.push({
        id: `sc-import-${i}`,
        type: 'action',
        text: trimmed,
      });
    }
  }

  return elements;
}
