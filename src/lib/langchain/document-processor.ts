import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { Document } from '@langchain/core/documents';
import { DocumentProcessingResult } from '@/types';
import { splitTextIntoDocuments } from './index';

export async function extractTextFromBuffer(
  buffer: Buffer, 
  fileType: string, 
  fileName: string
): Promise<DocumentProcessingResult> {
  try {
    let content = '';
    
    if (fileType === 'text/plain' || fileName.toLowerCase().endsWith('.txt')) {
      // Process text files
      const text = buffer.toString('utf-8');
      content = text;
    } 
    else if (fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
      // Process PDF files
      const loader = new PDFLoader(new Blob([buffer]), {
        splitPages: false,
      });
      const docs = await loader.load();
      content = docs.map(doc => doc.pageContent).join('\n\n');
    } 
    else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.toLowerCase().endsWith('.docx')
    ) {
      // Process DOCX files
      const loader = new DocxLoader(new Blob([buffer]));
      const docs = await loader.load();
      content = docs.map(doc => doc.pageContent).join('\n\n');
    } 
    else {
      return {
        success: false,
        error: 'Unsupported file type. Please upload a TXT, PDF, or DOCX file.',
      };
    }

    // Validate that we extracted some content
    if (!content || content.trim().length === 0) {
      return {
        success: false,
        error: 'No readable content found in the file',
      };
    }

    return {
      success: true,
      content: content.trim(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Client-side document extraction (mostly unchanged from original)
export async function extractTextFromFile(file: File): Promise<DocumentProcessingResult> {
  try {
    // Validate file type
    if (!validateFileType(file)) {
      return {
        success: false,
        error: 'Unsupported file type. Please upload a TXT, PDF, or DOCX file.',
      };
    }

    // Validate file size (10MB limit)
    if (!validateFileSize(file, 10)) {
      return {
        success: false,
        error: 'File size must be less than 10MB',
      };
    }

    // Create form data and send to API
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/process-document', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to process document',
      };
    }

    return {
      success: true,
      content: result.content,
    };
  } catch (error) {
    return {
      success: false,
      error: `Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function textToDocuments(
  text: string, 
  metadata: Record<string, unknown> = {}
): Promise<Document[]> {
  return splitTextIntoDocuments(text, metadata);
}

export function validateFileSize(file: File, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

export function validateFileType(file: File): boolean {
  const allowedTypes = [
    'text/plain',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  
  const allowedExtensions = ['.txt', '.pdf', '.docx'];
  const fileName = file.name.toLowerCase();
  
  return allowedTypes.includes(file.type) || 
         allowedExtensions.some(ext => fileName.endsWith(ext));
}
