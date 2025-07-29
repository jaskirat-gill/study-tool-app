import { GeminiResponse } from '@/types';

export async function generateFlashcards(content: string, count: number = 10): Promise<GeminiResponse> {
  try {
    const response = await fetch('/api/generate-flashcards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, count }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate flashcards');
    }

    const data = await response.json();
    return { flashcards: data.flashcards };

  } catch (error) {
    return { 
      error: `Error generating flashcards: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

export async function generateExamQuestions(content: string, count: number = 5): Promise<GeminiResponse> {
  try {
    const response = await fetch('/api/generate-exam', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, count }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate exam questions');
    }

    const data = await response.json();
    return { examQuestions: data.examQuestions };

  } catch (error) {
    return { 
      error: `Error generating exam questions: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}
