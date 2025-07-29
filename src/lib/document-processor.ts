import { DocumentProcessingResult } from '@/types';

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
