import { NextRequest, NextResponse } from 'next/server';
import { generateFlashcards } from '@/lib/langchain/gemini-client';

export async function POST(request: NextRequest) {
  try {
    const { content, count = 10 } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      );
    }

    const cardCount = Number(count) || 10;
    const result = await generateFlashcards(content, cardCount);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
    console.log('Generated flashcards:', result.flashcards);
    return NextResponse.json({ flashcards: result.flashcards });

  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate flashcards. Please try again.' },
      { status: 500 }
    );
  }
}
