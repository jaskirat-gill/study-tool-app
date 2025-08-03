import { NextRequest, NextResponse } from 'next/server';
import { generateStudyNotes } from '@/lib/langchain/gemini-client';

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      );
    }

    const result = await generateStudyNotes(content);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    console.log('Generated comprehensive notes using LangChain');
    return NextResponse.json({ notes: result.notes });

  } catch (error) {
    console.error('Notes Generation API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate notes. Please try again.' },
      { status: 500 }
    );
  }
}
