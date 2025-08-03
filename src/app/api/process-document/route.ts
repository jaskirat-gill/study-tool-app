import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromBuffer } from '@/lib/langchain/document-processor';

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

    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const result = await extractTextFromBuffer(buffer, file.type, file.name);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        content: result.content,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          contentLength: result.content?.length || 0,
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
