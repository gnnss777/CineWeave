// Funções de exportação para Storyboard Board
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function exportFrameToPNG(canvasElement, filename) {
  try {
    // Usando Konva's toDataURL para melhor qualidade
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

export async function exportAllFramesToPNG(frames) {
  try {
    const zip = new JSZip();
    const folder = zip.folder('storyboard-frames');

    frames.forEach((frame) => {
      if (frame.canvas) {
        const dataURL = frame.canvas.toDataURL('image/png', 1.0);
        folder.file(`${String(frame.order + 1).padStart(3, '0')}-${frame.sceneTitle}.png`, dataURL);
      }
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.download = 'storyboard-frames.zip';
    link.href = URL.createObjectURL(content);
    link.click();

    return { success: true, message: 'All frames exported successfully' };
  } catch (error) {
    console.error('Error exporting all frames:', error);
    return { success: false, message: error.message };
  }
}

export async function exportFrameToPDF(canvasElement, filename) {
  try {
    const dataURL = canvasElement.toDataURL('image/png', 1.0);
    const img = await loadImage(dataURL);

    // Calcular dimensions para manter aspect ratio
    const aspectRatio = img.height / img.width;
    const pageWidth = 11; // landscape
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

export async function exportAllFramesToPDF(frames) {
  try {
    const zip = new JSZip();
    const folder = zip.folder('storyboard-frames-pdf');

    frames.forEach((frame) => {
      if (frame.canvas) {
        const dataURL = frame.canvas.toDataURL('image/png', 1.0);
        folder.file(`${String(frame.order + 1).padStart(3, '0')}-${frame.sceneTitle}.pdf`, dataURL);
      }
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.download = 'storyboard-frames-pdf.zip';
    link.href = URL.createObjectURL(content);
    link.click();

    return { success: true, message: 'All frames exported as PDFs successfully' };
  } catch (error) {
    console.error('Error exporting all frames to PDF:', error);
    return { success: false, message: error.message };
  }
}

export async function exportFrameToSVG(canvasElement, filename) {
  try {
    const dataURL = canvasElement.toDataURL('image/svg+xml', 1.0);
    const link = document.createElement('a');
    link.download = `${filename}.svg`;
    link.href = dataURL;
    link.click();

    return { success: true, message: 'Frame exported as SVG successfully' };
  } catch (error) {
    console.error('Error exporting SVG:', error);
    return { success: false, message: error.message };
  }
}

export async function exportToWebP(canvasElement, filename) {
  try {
    // Converter para WebP com qualidade 0.9
    const dataURL = canvasElement.toDataURL('image/webp', 0.9);

    const link = document.createElement('a');
    link.download = `${filename}.webp`;
    link.href = dataURL;
    link.click();

    return { success: true, message: 'Frame exported as WebP successfully' };
  } catch (error) {
    console.error('Error exporting WebP:', error);
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
