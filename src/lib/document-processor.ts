import { DocumentProcessingResult } from '@/types';

export async function extractTextFromFile(file: File): Promise<DocumentProcessingResult> {
  try {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      return await extractTextFromTxt(file);
    } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return await extractTextFromPdf(file);
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      return await extractTextFromDocx(file);
    } else {
      return {
        success: false,
        error: 'Unsupported file type. Please upload a TXT, PDF, or DOCX file.',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

async function extractTextFromTxt(file: File): Promise<DocumentProcessingResult> {
  try {
    const text = await file.text();
    return {
      success: true,
      content: text,
    };
  } catch (error) {
    return {
      success: false,
      error: `Error reading text file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

async function extractTextFromPdf(file: File): Promise<DocumentProcessingResult> {
  try {
    // Note: In a real implementation, you'd use pdf-parse or a similar library
    // For now, we'll return a placeholder
    await file.arrayBuffer(); // Convert file to arrayBuffer for future PDF processing
    
    // This is a placeholder - in a real implementation you would use:
    // const pdf = await pdfParse(Buffer.from(arrayBuffer));
    // return { success: true, content: pdf.text };
    
    return {
      success: false,
      error: 'PDF processing not yet implemented. Please use TXT or DOCX files for now.',
    };
  } catch (error) {
    return {
      success: false,
      error: `Error reading PDF file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

async function extractTextFromDocx(file: File): Promise<DocumentProcessingResult> {
  try {
    // Note: In a real implementation, you'd use mammoth or a similar library
    // For now, we'll return a placeholder
    await file.arrayBuffer(); // Convert file to arrayBuffer for future DOCX processing
    
    // This is a placeholder - in a real implementation you would use:
    // const result = await mammoth.extractRawText({ arrayBuffer });
    // return { success: true, content: result.value };
    
    return {
      success: false,
      error: 'DOCX processing not yet implemented. Please use TXT files for now.',
    };
  } catch (error) {
    return {
      success: false,
      error: `Error reading DOCX file: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
