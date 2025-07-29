import { NextRequest, NextResponse } from 'next/server';

// Helper function to safely import and use pdf-parse
async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    console.log('Attempting to parse PDF buffer of size:', buffer.length);
    
    // Import pdf-parse dynamically
    const pdfParse = await import('pdf-parse');
    
    // Handle different export formats and call the parser
    const parseFunction = pdfParse.default;
    const pdfData = await parseFunction(buffer);
    
    if (!pdfData || !pdfData.text) {
      throw new Error('No text content found in PDF');
    }
    
    console.log('Successfully parsed PDF, extracted text length:', pdfData.text.length);
    return pdfData.text;
  } catch (error) {
    console.error('PDF parsing error:', error);
    // Provide more specific error information
    if (error instanceof Error) {
      throw new Error(`Failed to parse PDF file: ${error.message}`);
    }
    throw new Error('Failed to parse PDF file: Unknown error');
  }
}

// Helper function to safely import and use mammoth
async function parseDocx(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('DOCX parsing error:', error);
    throw new Error('Failed to parse DOCX file');
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    const fileType = file.type;

    try {
      let content = '';

      if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
        // Process TXT files
        content = await file.text();
      } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        // Process PDF files using helper function
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        content = await parsePDF(buffer);
      } else if (
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileName.endsWith('.docx')
      ) {
        // Process DOCX files using helper function
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        content = await parseDocx(buffer);
      } else {
        return NextResponse.json(
          { error: 'Unsupported file type. Please upload a TXT, PDF, or DOCX file.' },
          { status: 400 }
        );
      }

      // Validate that we extracted some content
      if (!content || content.trim().length === 0) {
        return NextResponse.json(
          { error: 'No readable content found in the file' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        content: content.trim(),
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          contentLength: content.length,
        },
      });

    } catch (processingError) {
      console.error('File processing error:', processingError);
      return NextResponse.json(
        { 
          error: `Error processing file: ${processingError instanceof Error ? processingError.message : 'Unknown error'}` 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
