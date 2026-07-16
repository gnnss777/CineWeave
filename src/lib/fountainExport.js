export function exportFountain(project) {
  const lines = [];
  const screenplay = project.screenplay || [];

  lines.push(`Title: ${project.title}`);
  lines.push(`Author: ${project.author || ''}`);
  lines.push(`Draft date: ${new Date().toLocaleDateString('pt-BR')}`);
  lines.push('===');
  lines.push('');

  let sceneCount = 0;
  screenplay.forEach(el => {
    switch (el.type) {
      case 'scene-heading':
        sceneCount++;
        const cleanText = (el.text || '').replace(/\[\[.*?\]\]/g, '').replace(/#([^#]+)#/g, '').trim();
        lines.push('');
        lines.push(`${cleanText} #${sceneCount}#`);
        lines.push('');
        break;
      case 'action':
        lines.push(el.text);
        lines.push('');
        break;
      case 'character':
        lines.push(el.text.toUpperCase());
        break;
      case 'parenthetical':
        lines.push(el.text);
        break;
      case 'dialogue':
        lines.push(el.text);
        lines.push('');
        break;
      case 'transition':
        lines.push(el.text);
        lines.push('');
        break;
    }
  });

  return lines.join('\n');
}

export function downloadFountain(content, filename) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.fountain`;
  a.click();
  URL.revokeObjectURL(url);
}
