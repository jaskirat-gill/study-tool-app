import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

    const prompt = `You are an expert educational content creator. You specialize in biomedical physiology, and cognitive science. Generate exactly ${cardCount} flashcards from the following content. Each flashcard should have a clear question (front) and answer (back). Focus on key concepts, definitions, and important facts. Vary the difficulty levels between "easy", "medium", and "hard".

Content:
${content}

Respond ONLY with valid JSON in this exact format (no other text before or after):
{
  "flashcards": [
    {
      "front": "Question text here",
      "back": "Answer text here", 
      "difficulty": "easy"
    }
  ]
}`;

    // Escape the prompt for shell execution
    const escapedPrompt = prompt.replace(/"/g, '\\"');
    const command = `gemini -p "${escapedPrompt}"`;

    // Execute the Gemini CLI command
    const result = await execAsync(command, {
      timeout: 60000, // 60 second timeout
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    });

    let output = result.stdout.trim();

    // Remove any non-JSON content (like "Loaded cached credentials.")
    const jsonStart = output.indexOf('{');
    const jsonEnd = output.lastIndexOf('}');

    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      output = output.substring(jsonStart, jsonEnd + 1);
    }

    // Validate that we have valid JSON
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(output);
    } catch {
      throw new Error('Invalid JSON response from Gemini CLI');
    }

    // Add IDs to flashcards
    interface GeminiFlashcard {
      front: string;
      back: string;
      difficulty: string;
    }
    
    const flashcardsWithIds = parsedResponse.flashcards?.map((card: GeminiFlashcard) => ({
      id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
      front: card.front || '',
      back: card.back || '',
      difficulty: card.difficulty || 'medium',
      created: new Date(),
      reviewCount: 0,
      correctCount: 0,
    })) || [];

    return NextResponse.json({ flashcards: flashcardsWithIds });

  } catch (error) {
    console.error('Gemini CLI Error:', error);
    
    const { count = 10 } = await request.json().catch(() => ({ count: 10 }));
    const cardCount = Number(count) || 10;
    
    // Fallback to mock responses if CLI fails
    const mockFlashcards = Array.from({ length: Math.min(cardCount, 10) }, (_, i) => ({
      id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
      front: `Sample Question ${i + 1} based on the content`,
      back: `Sample Answer ${i + 1} extracted from the provided material`,
      difficulty: ['easy', 'medium', 'hard'][i % 3] as 'easy' | 'medium' | 'hard',
      created: new Date(),
      reviewCount: 0,
      correctCount: 0,
    }));

    return NextResponse.json({ flashcards: mockFlashcards });
  }
}
