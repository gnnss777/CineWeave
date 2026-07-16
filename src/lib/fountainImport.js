const SCENE_HEADING_RE = /^(?:INT\.|EXT\.|INT\.\/EXT\.|I\/E\.|INT\/EXT\.|EST\.)/i;
const SCENE_HEADING_RE_LEADING_DIGITS = /^\d+\s+(?:INT\.|EXT\.|INT\.\/EXT\.|I\/E\.|INT\/EXT\.|EST\.)/i;
const BLANK_RE = /^$/;
const TRANSITION_RE = /^(FADE IN|FADE OUT|CUT TO|DISSOLVE TO|SMASH CUT TO|MATCH CUT TO|JUMP CUT TO|FADE TO BLACK|FADE TO WHITE|IRIS IN|IRIS OUT|WIPE TO|FADE IN:|FADE OUT:|CUT TO:|DISSOLVE TO:|SMASH CUT TO:|MATCH CUT TO:|JUMP CUT TO:)$/i;

function isBlank(text) {
  return !text || text.trim() === '';
}

function isAllCaps(text) {
  if (!text || text.length < 2) return false;
  const cleaned = text.replace(/[\(\)]/g, '').trim();
  if (cleaned.length < 2) return false;
  return cleaned === cleaned.toUpperCase() && /[A-ZÀ-Ú]/.test(cleaned);
}

export function parseFountain(text) {
  const elements = [];
  const lines = text.split('\n');

  // Only check first 20 lines for metadata separator
  const firstLines = lines.slice(0, 20).join('\n');
  const hasMetadataSeparator = /^===/m.test(firstLines);
  let inMetadata = hasMetadataSeparator;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';

    if (/^===/.test(trimmed)) {
      inMetadata = false;
      continue;
    }

    if (inMetadata) continue;

    // Section (starts with #)
    if (trimmed.startsWith('#')) {
      const match = trimmed.match(/^(#+)\s*(.*)$/);
      const level = match ? match[1].length : 1;
      const text = match ? match[2].trim() : trimmed;
      elements.push({
        id: `sc-import-${i}`,
        type: 'section',
        level,
        text,
      });
      continue;
    }

    // Synopsis (starts with = or ==)
    if (/^={1,2}\s/.test(trimmed)) {
      elements.push({
        id: `sc-import-${i}`,
        type: 'synopsis',
        text: trimmed.replace(/^={1,2}\s*/, ''),
      });
      continue;
    }

    // Scene heading (with optional leading scene number e.g. "1 EXT. ...")
    if (SCENE_HEADING_RE.test(trimmed) || SCENE_HEADING_RE_LEADING_DIGITS.test(trimmed)) {
      elements.push({
        id: `sc-import-${i}`,
        type: 'scene-heading',
        text: trimmed,
      });
      continue;
    }

    // Forced character cue (@ prefix)
    if (trimmed.startsWith('@') && trimmed.length > 1) {
      elements.push({
        id: `sc-import-${i}`,
        type: 'character',
        text: trimmed.slice(1).trim(),
      });
      continue;
    }

    // Character (all-caps, preceded by blank, followed by non-blank)
    const prevLine = i > 0 ? lines[i - 1].trim() : '';
    if (
      isAllCaps(trimmed) &&
      isBlank(prevLine) &&
      !isBlank(nextLine) &&
      !isBlank(trimmed) &&
      trimmed.length >= 2
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

    // Transition (> prefix or all-caps known transition)
    if (trimmed.startsWith('>')) {
      elements.push({
        id: `sc-import-${i}`,
        type: 'transition',
        text: trimmed.replace(/^>/, '').trim(),
      });
      continue;
    }
    if (
      isAllCaps(trimmed) &&
      trimmed.length >= 4 &&
      isBlank(prevLine) &&
      TRANSITION_RE.test(trimmed)
    ) {
      elements.push({
        id: `sc-import-${i}`,
        type: 'transition',
        text: trimmed.replace(/:$/, ''),
      });
      continue;
    }

    // Action (default) or Dialogue
    if (!isBlank(trimmed)) {
      const lastEl = elements[elements.length - 1];
      const prevLineRaw = i > 0 ? lines[i - 1] : '';
      const isPrevLineBlank = isBlank(prevLineRaw);
      
      const isDialogue = lastEl && 
                         (lastEl.type === 'character' || lastEl.type === 'parenthetical' || lastEl.type === 'dialogue') && 
                         !isPrevLineBlank;
      
      if (isDialogue) {
        elements.push({
          id: `sc-import-${i}`,
          type: 'dialogue',
          text: trimmed,
        });
      } else {
        elements.push({
          id: `sc-import-${i}`,
          type: 'action',
          text: trimmed,
        });
      }
    }
  }

  return elements;
}
