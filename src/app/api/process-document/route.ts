import { NextRequest, NextResponse } from 'next/server';

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
        // Process PDF files with dynamic import
        const pdfParse = await import('pdf-parse');
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const pdfData = await pdfParse.default(buffer);
        content = pdfData.text;
      } else if (
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileName.endsWith('.docx')
      ) {
        // Process DOCX files with dynamic import
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const result = await mammoth.extractRawText({ buffer });
        content = result.value;
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
