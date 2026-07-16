import { jsPDF } from 'jspdf';

export function exportScreenplayPDF(project) {
  const doc = new jsPDF({ unit: 'in', format: 'letter' });
  const screenplay = project.screenplay || [];
  const pageWidth = 8.5;
  const pageHeight = 11;
  const marginLeft = 1.5;
  const marginRight = 1;
  const marginTop = 1;
  const contentWidth = pageWidth - marginLeft - marginRight;

  let y = marginTop;
  let page = 1;
  let sceneCount = 0;

  const addPage = () => {
    doc.addPage();
    y = marginTop;
    page++;
    doc.setFontSize(10);
    doc.text(`${project.title} - ${page}`, pageWidth / 2, 0.5, { align: 'center' });
    y = marginTop;
  };

  const writeLine = (text, indent = 0, fontSize = 12, bold = false) => {
    const x = marginLeft + indent;
    if (y > pageHeight - 1) addPage();
    doc.setFontSize(fontSize);
    doc.setFont('Courier', bold ? 'bold' : 'normal');
    doc.text(text, x, y);
    y += fontSize * 0.08;
  };

  screenplay.forEach(el => {
    switch (el.type) {
      case 'scene-heading':
        sceneCount++;
        const cleanText = (el.text || '').replace(/\[\[.*?\]\]/g, '').replace(/#([^#]+)#/g, '').trim();
        writeLine(`${sceneCount}. ${cleanText.toUpperCase()}`, 0, 12, true);
        y += 0.05;
        break;
      case 'action':
        writeLine(el.text, 0, 12);
        y += 0.05;
        break;
      case 'character':
        writeLine(el.text.toUpperCase(), 2.5, 12, true);
        break;
      case 'parenthetical':
        writeLine(el.text, 2, 11);
        break;
      case 'dialogue':
        writeLine(el.text, 1.5, 12);
        y += 0.05;
        break;
      case 'transition':
        writeLine(el.text, 3.5, 12, true);
        y += 0.05;
        break;
    }
  });

  doc.save(`${project.title}-roteiro.pdf`);
}
