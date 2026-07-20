const TYPE_MAP = {
  'Scene Heading': 'scene-heading',
  'Action': 'action',
  'Character': 'character',
  'Parenthetical': 'parenthetical',
  'Dialogue': 'dialogue',
  'Transition': 'transition',
  'Shot': 'transition',
  'General': 'action',
  'Cast List': 'action',
  'Note': 'action',
};

function decodeXmlEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#xA0;/g, ' ')
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(c));
}

export function parseFdx(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'text/xml');
  const paragraphs = doc.querySelectorAll('Paragraph');
  const elements = [];

  paragraphs.forEach((p, i) => {
    const fdxType = p.getAttribute('Type');
    const internalType = TYPE_MAP[fdxType];
    if (!internalType || fdxType === 'Script') return;

    const textNodes = p.querySelectorAll('Text');
    if (!textNodes.length) return;

    const text = Array.from(textNodes)
      .map(n => n.textContent)
      .join('')
      .trim();
    if (!text) return;

    elements.push({
      id: `fdx-${i}`,
      type: internalType,
      text: decodeXmlEntities(text),
    });
  });

  // Extract script notes
  const scriptNotes = doc.querySelectorAll('ScriptNote');
  scriptNotes.forEach((note, i) => {
    const text = note.textContent?.trim();
    if (!text) return;
    elements.push({
      id: `fdx-note-${i}`,
      type: 'action',
      text: `[[NOTE]] ${text}`,
    });
  });

  return elements;
}
