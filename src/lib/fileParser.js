import * as pdfjsLib from 'pdfjs-dist';
import { convert } from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  const pageTexts = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map(item => item.str)
      .join(' ');
    pageTexts.push({ page: i, text: pageText });
    fullText += `\n--- PÁGINA ${i} ---\n${pageText}`;
  }
  
  return {
    text: fullText.trim(),
    metadata: {
      fileName: file.name,
      fileType: 'pdf',
      fileSize: file.size,
      pages: pdf.numPages,
      wordCount: fullText.split(/\s+/).filter(Boolean).length,
      pageTexts
    }
  };
}

async function parseDOCX(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await convert({ arrayBuffer });
  
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