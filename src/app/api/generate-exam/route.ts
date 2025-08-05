import { NextRequest, NextResponse } from 'next/server';
import { generateExamQuestions } from '@/lib/langchain/service';

export async function POST(request: NextRequest) {
  try {
    const { content, multipleChoice = 5, fillInBlank = 0, shortAnswer = 0, fillInBlankWordBank, difficulty = 3 } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      );
    }

    const mcCount = Number(multipleChoice) || 0;
    const fibCount = Number(fillInBlank) || 0;
    const saCount = Number(shortAnswer) || 0;
    const totalQuestions = mcCount + fibCount + saCount;

    if (totalQuestions === 0) {
      return NextResponse.json(
        { error: 'At least one question must be requested' },
        { status: 400 }
      );
    }

    // Process the word bank if provided
    const wordBank = fillInBlankWordBank && Array.isArray(fillInBlankWordBank) 
      ? fillInBlankWordBank.filter((word: string) => typeof word === 'string' && word.trim() !== '')
      : undefined;

    const result = await generateExamQuestions(
      content, 
      mcCount, 
      fibCount, 
      saCount,
      wordBank,
      Number(difficulty) || 3
    );

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    console.log(`Generated ${result.examQuestions?.length || 0} exam questions using LangChain`);
    return NextResponse.json({ examQuestions: result.examQuestions });

  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate exam questions. Please try again.' },
      { status: 500 }
    );
  }
}
