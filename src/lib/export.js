// Funções de exportação para Storyboard Board
import { jsPDF } from 'jspdf';

export async function exportFrameToPNG(canvasElement, filename) {
  try {
    const dataURL = canvasElement.toDataURL('image/png', 1.0);

    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = dataURL;
    link.click();

    return { success: true, message: 'Frame exported successfully' };
  } catch (error) {
    console.error('Error exporting PNG:', error);
    return { success: false, message: error.message };
  }
}

export async function exportFrameToPDF(canvasElement, filename) {
  try {
    const dataURL = canvasElement.toDataURL('image/png', 1.0);
    const img = await loadImage(dataURL);

    // Calcular dimensions para manter aspect ratio
    const aspectRatio = img.height / img.width;
    const pageWidth = 11; // landscape (inches)
    const pageHeight = pageWidth * aspectRatio;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'in',
      format: [pageWidth, pageHeight],
    });

    doc.addImage(dataURL, 'PNG', 0, 0, pageWidth, pageHeight);
    doc.save(`${filename}.pdf`);

    return { success: true, message: 'Frame exported as PDF successfully' };
  } catch (error) {
    console.error('Error exporting PDF:', error);
    return { success: false, message: error.message };
  }
}

function loadImage(dataURL) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataURL;
  });
}
