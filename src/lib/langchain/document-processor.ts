import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { DocumentProcessingResult } from '@/types';


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