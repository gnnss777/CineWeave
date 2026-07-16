import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { convert } from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export async function parseFile(file) {
  const type = file.type || getTypeFromExtension(file.name);
  
  switch (type) {
    case 'application/pdf':
      return parsePDF(file);
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return parseDOCX(file);
    case 'text/plain':
    case 'text/markdown':
    case 'text/csv':
      return parseText(file);
    default:
      throw new Error(`Tipo de arquivo não suportado: ${type}`);
  }
}

function getTypeFromExtension(name) {
  const ext = name.split('.').pop().toLowerCase();
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'txt': return 'text/plain';
    case 'md': return 'text/markdown';
    case 'csv': return 'text/csv';
    default: return 'unknown';
  }
}

async function parsePDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const pagesData = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const items = textContent.items;
    
    // Group items by y-coordinate (transform[5])
    const linesMap = {};
    items.forEach(item => {
      if (!item.transform) return;
      const y = item.transform[5];
      // Find an existing line with y close to item's y (tolerance of 5 units)
      let foundY = Object.keys(linesMap).find(existingY => Math.abs(parseFloat(existingY) - y) < 5);
      if (foundY) {
        linesMap[foundY].push(item);
      } else {
        linesMap[y] = [item];
      }
    });
    
    // Sort lines by y-coordinate descending (top to bottom)
    const sortedYKeys = Object.keys(linesMap).sort((a, b) => parseFloat(b) - parseFloat(a));
    
    const lines = sortedYKeys.map(y => {
      const lineItems = linesMap[y];
      // Sort items in the line by x-coordinate (transform[4]) ascending (left to right)
      lineItems.sort((a, b) => a.transform[4] - b.transform[4]);
      const minX = lineItems[0].transform[4];
      const text = lineItems.map(item => item.str).join(' ');
      return { text, x: minX, y: parseFloat(y) };
    });
    
    pagesData.push({ page: i, lines });
  }
  
  // Convert lines with coordinates into standard Fountain format
  let fountainText = '';
  pagesData.forEach((page) => {
    let lastType = 'action';
    
    page.lines.forEach((line, lIdx) => {
      const text = line.text.trim();
      if (!text) return;
      
      // Filter out page numbers, copyright headers, repetitive page markers
      if (/^\d+$/.test(text)) return;
      if (/^(page|pág\.|-\s*\d+\s*-)/i.test(text)) return;
      if (/^copyright/i.test(text)) return;
      if (/^[\d.]+\s*$/.test(text)) return;
      
      const x = line.x;
      const y = line.y;
      const prevLine = lIdx > 0 ? page.lines[lIdx - 1] : null;
      
      // Detect vertical spacing (double spacing) — relative to median line height
      let isDoubleSpaced = false;
      if (prevLine) {
        const yDiff = prevLine.y - y;
        if (yDiff > 18) {
          isDoubleSpaced = true;
        }
      }

      // Skip repetitive headers (Copyright, draft info) that appear mid-page
      const isHeaderLine = /^(copyright|draft|tratamento|roteiro|script)/i.test(text);
      const isPageXofY = x > 400 && /^\d+\s+of\s+\d+$/i.test(text);
      if ((isHeaderLine || isPageXofY) && line.y < 100) return;
      
      let type = 'action';
      // Strip Beat color tags [[color]] for detection
      const cleanText = text.replace(/\[\[.*?\]\]/g, '').trim();
      const isSectionHeader = /^(ATO\b|ACT\b|SEQUÊNCIA\b|SEQUENCE\b|EPISÓDIO\b|EPISODE\b|PRÓLOGO\b|PROLOGUE\b|APRESENTAÇÃO\b|INTRODUÇÃO\b|CLÍMAX\b|RESOLUÇÃO\b|DESFECHO\b|PART\b|CHAPTER\b)/i.test(cleanText);
      const isAllCaps = cleanText.replace(/\(.*\)/g, '').trim() === cleanText.replace(/\(.*\)/g, '').trim().toUpperCase();
      
      // Screenplay margins heuristics (US Letter 612 units total width)
      if (isSectionHeader) {
        type = 'section';
      } else if (/^(INT\.|EXT\.|INT\/EXT\.|INT\.\/EXT\.|EST\.|I\/E\.)/i.test(cleanText)) {
        type = 'scene-heading';
      } else if (/^(FADE IN|FADE OUT|CUT TO|DISSOLVE TO|SMASH CUT TO|MATCH CUT TO|FADE TO BLACK|FADE TO WHITE)[:\s]?$/i.test(cleanText) || (cleanText === cleanText.toUpperCase() && / TO:$/i.test(cleanText))) {
        type = 'transition';
      } else if (cleanText.length >= 2 && cleanText.length < 50 && isAllCaps && !cleanText.startsWith('(') && !cleanText.endsWith(':') && type === 'action') {
        // Character: ALL-CAPS, short text — independent of x-position (handles Beat PDFs with custom margins)
        type = 'character';
      } else if (cleanText.startsWith('(')) {
        type = 'parenthetical';
      } else if ((lastType === 'character' || lastType === 'parenthetical' || lastType === 'dialogue') && !isDoubleSpaced) {
        // Dialogue follows a character/parenthetical without blank line
        type = 'dialogue';
      }
      
      // Render to Fountain syntax
      if (type === 'section') {
        fountainText += `\n\n# ${text}\n`;
      } else if (type === 'scene-heading') {
        fountainText += `\n\n${text.toUpperCase()}\n`;
      } else if (type === 'character') {
        fountainText += `\n\n${text.toUpperCase()}\n`;
      } else if (type === 'parenthetical') {
        fountainText += `${text}\n`;
      } else if (type === 'dialogue') {
        fountainText += `${text}\n`;
      } else if (type === 'transition') {
        fountainText += `\n>${text.toUpperCase()}\n`;
      } else {
        // Action
        if (lastType === 'action' && !isDoubleSpaced) {
          fountainText += ` ${text}`;
        } else {
          fountainText += `\n\n${text}`;
        }
      }
      
      lastType = type;
    });
  });
  
  const finalFountain = `Title: ${file.name.replace(/\.pdf$/i, '')}\nAuthor:\nDraft date:\n===\n\n` + fountainText.trim();
  
  return {
    text: finalFountain,
    metadata: {
      fileName: file.name,
      fileType: 'pdf',
      fileSize: file.size,
      pages: pdf.numPages,
      wordCount: finalFountain.split(/\s+/).filter(Boolean).length
    }
  };
  } catch (e) {
    if (e.message?.toLowerCase().includes('password')) {
      throw new Error('PDF protegido por senha. Abra o arquivo e remova a senha antes de importar.');
    }
    if (e.message?.toLowerCase().includes('corrupt') || e.message?.toLowerCase().includes('invalid')) {
      throw new Error('PDF corrompido ou inválido. Verifique se o arquivo pode ser aberto em outro leitor.');
    }
    throw new Error(`Erro ao ler PDF: ${e.message}`);
  }
}

async function parseDOCX(file) {
  let arrayBuffer;
  try {
    arrayBuffer = await file.arrayBuffer();
  } catch (e) {
    throw new Error(`Erro ao ler arquivo DOCX: ${e.message}`);
  }
  let result;
  try {
    result = await convert({ arrayBuffer });
  } catch (e) {
    throw new Error(`Erro ao converter DOCX: Verifique se o arquivo não está corrompido. Detalhes: ${e.message}`);
  }
  
  const text = result.value;
  const messages = result.messages;
  
  return {
    text: text.trim(),
    metadata: {
      fileName: file.name,
      fileType: 'docx',
      fileSize: file.size,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      messages: messages.map(m => ({ type: m.type, message: m.message }))
    }
  };
}

async function parseText(file) {
  const text = await file.text();
  
  return {
    text: text.trim(),
    metadata: {
      fileName: file.name,
      fileType: file.type.includes('markdown') ? 'md' : 'txt',
      fileSize: file.size,
      wordCount: text.split(/\s+/).filter(Boolean).length
    }
  };
}

export async function parseFiles(files, onProgress) {
  const results = [];
  const fileArray = Array.from(files);
  
  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i];
    onProgress?.({
      file: file.name,
      current: i + 1,
      total: fileArray.length,
      status: 'parsing'
    });
    
    try {
      const parsed = await parseFile(file);
      results.push({ ...parsed, status: 'parsed', file });
      onProgress?.({
        file: file.name,
        current: i + 1,
        total: fileArray.length,
        status: 'parsed',
        result: parsed
      });
    } catch (error) {
      results.push({ 
        fileName: file.name, 
        fileType: getTypeFromExtension(file.name),
        fileSize: file.size,
        status: 'error', 
        error: error.message,
        file 
      });
      onProgress?.({
        file: file.name,
        current: i + 1,
        total: fileArray.length,
        status: 'error',
        error: error.message
      });
    }
  }
  
  return results;
}

export function getSupportedTypes() {
  return [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'text/csv'
  ];
}

export function isSupportedType(file) {
  const type = file.type || getTypeFromExtension(file.name);
  return getSupportedTypes().includes(type);
}