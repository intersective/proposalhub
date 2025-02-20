import mammoth from 'mammoth';
import XLSX from 'xlsx';
import * as pdfjs from 'pdfjs-dist';
import { JSDOM } from 'jsdom';
import TurndownService from 'turndown';
import { Buffer } from 'buffer';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const turndownService = new TurndownService();

export type SupportedMimeType =
  // Office Documents
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // docx
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // xlsx
  | 'application/vnd.openxmlformats-officedocument.presentationml.presentation' // pptx
  // PDF
  | 'application/pdf'
  // Web Documents
  | 'text/html'
  | 'application/xml'
  | 'text/xml'
  // Data Formats
  | 'application/json'
  | 'text/csv'
  // Text Formats
  | 'text/plain'
  | 'text/markdown';

export interface ConversionResult {
  content: string;
  format: 'markdown' | 'csv';
  metadata?: Record<string, unknown>;
}

interface TextItem {
  str: string;
  dir?: string;
}

interface TextContent {
  items: Array<TextItem>;
}

export async function convertToMarkdown(file: Blob, mimeType: string): Promise<ConversionResult> {
  try {
    switch (mimeType) {
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const docxResult = await mammoth.convertToHtml({ buffer });
        return { 
          content: turndownService.turndown(docxResult.value),
          format: 'markdown'
        };

      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
        const csvContent = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
        return { content: csvContent, format: 'csv' };

      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        const pptxWorkbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
        const slides = Object.keys(pptxWorkbook.Sheets)
          .map(sheetName => {
            const text = XLSX.utils.sheet_to_txt(pptxWorkbook.Sheets[sheetName]);
            return `## Slide: ${sheetName}\n\n${text}\n`;
          })
          .join('\n');
        return { content: slides, format: 'markdown' };

      case 'application/pdf':
        const pdfData = new Uint8Array(await file.arrayBuffer());
        const loadingTask = pdfjs.getDocument({ data: pdfData });
        const pdf = await loadingTask.promise;
        
        let textContent = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent() as TextContent;
          textContent += content.items
            .map(item => item.str)
            .join(' ') + '\n\n';
        }
        return { content: textContent, format: 'markdown' };

      case 'text/html':
      case 'application/xml':
      case 'text/xml':
        const dom = new JSDOM(await file.text());
        const markdown = turndownService.turndown(dom.window.document.body.innerHTML);
        return { content: markdown, format: 'markdown' };

      case 'application/json':
        const jsonData = JSON.parse(await file.text());
        // Convert JSON to markdown table if it's an array of objects
        if (Array.isArray(jsonData) && jsonData.length > 0 && typeof jsonData[0] === 'object') {
          const headers = Object.keys(jsonData[0]);
          const csvContent = [
            headers.join(','),
            ...jsonData.map(row => headers.map(header => JSON.stringify(row[header] ?? '')).join(','))
          ].join('\n');
          return { content: csvContent, format: 'csv' };
        }
        // Otherwise, return pretty-printed JSON as markdown code block
        return { 
          content: '```json\n' + JSON.stringify(jsonData, null, 2) + '\n```',
          format: 'markdown'
        };

      case 'text/plain':
      case 'text/markdown':
      case 'text/csv':
        // Return as-is for text formats
        return { 
          content: await file.text(), 
          format: mimeType === 'text/csv' ? 'csv' : 'markdown'
        };

      default:
        // For unknown types, try to detect if it's text and return as-is
        if (mimeType.startsWith('text/')) {
          return { content: await file.text(), format: 'markdown' };
        }
        throw new Error(`Unsupported MIME type: ${mimeType}`);
    }
  } catch (error) {
    console.error('Error converting file:', error);
    throw new Error(`Failed to convert file of type ${mimeType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to detect MIME type from File/Blob
export function getMimeType(file: File): SupportedMimeType {
  const mimeType = file.type.toLowerCase();
  
  // Handle cases where the browser doesn't recognize the MIME type
  if (!mimeType || mimeType === 'application/octet-stream') {
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      case 'pdf': return 'application/pdf';
      case 'html': return 'text/html';
      case 'xml': return 'application/xml';
      case 'json': return 'application/json';
      case 'csv': return 'text/csv';
      case 'md':
      case 'markdown': return 'text/markdown';
      case 'txt':
      default: return 'text/plain';
    }
  }

  // Validate that the MIME type is supported
  if (isSupportedMimeType(mimeType)) {
    return mimeType;
  }

  // Default to plain text for unknown types
  return 'text/plain';
}

// Type guard for supported MIME types
function isSupportedMimeType(mimeType: string): mimeType is SupportedMimeType {
  const supportedTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/pdf',
    'text/html',
    'application/xml',
    'text/xml',
    'application/json',
    'text/csv',
    'text/plain',
    'text/markdown'
  ];
  return supportedTypes.includes(mimeType);
}