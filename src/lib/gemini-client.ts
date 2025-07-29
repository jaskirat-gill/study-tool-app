import { Flashcard, ExamQuestion, GeminiResponse } from '@/types';

interface Card {
    front: string;
    back: string;
    difficulty: 'easy' | 'medium' | 'hard';
}

interface Question {
    question: string,
    options: string[],
    correctAnswer: number,
    explanation: string,
    difficulty: string
}

export async function generateFlashcards(content: string, count: number = 10): Promise<GeminiResponse> {
  try {
    const prompt = `
Generate ${count} flashcards from the following content. 
Each flashcard should have a clear question (front) and answer (back).
Focus on key concepts, definitions, and important facts.
Vary the difficulty levels (easy, medium, hard).

Content:
${content}

Please respond with a JSON array of flashcards in this format:
{
  "flashcards": [
    {
      "front": "Question text",
      "back": "Answer text",
      "difficulty": "medium"
    }
  ]
}
`;

    const result = await callGeminiCLI(prompt);
    
    if (!result.success) {
      return { error: result.error };
    }

    // Parse the response and create flashcards with IDs
    const response = JSON.parse(result.content || '{}');
    const flashcards: Flashcard[] = response.flashcards?.map((card: Card) => ({
      id: generateId(),
      front: card.front || '',
      back: card.back || '',
      difficulty: card.difficulty || 'medium',
      created: new Date(),
      reviewCount: 0,
      correctCount: 0,
    })) || [];

    return { flashcards };
  } catch (error) {
    return { 
      error: `Error generating flashcards: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

export async function generateExamQuestions(content: string, count: number = 5): Promise<GeminiResponse> {
  try {
    const prompt = `
Generate ${count} multiple choice exam questions from the following content.
Each question should have 4 options with one correct answer.
Include an explanation for the correct answer.
Vary the difficulty levels (easy, medium, hard).

Content:
${content}

Please respond with a JSON array of questions in this format:
{
  "examQuestions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Explanation of correct answer",
      "difficulty": "medium"
    }
  ]
}
`;

    const result = await callGeminiCLI(prompt);
    
    if (!result.success) {
      return { error: result.error };
    }

    // Parse the response and create exam questions with IDs
    const response = JSON.parse(result.content || '{}');
    const examQuestions: ExamQuestion[] = response.examQuestions?.map((question: Question) => ({
      id: generateId(),
      question: question.question || '',
      options: question.options || [],
      correctAnswer: question.correctAnswer || 0,
      explanation: question.explanation || '',
      difficulty: question.difficulty || 'medium',
    })) || [];

    return { examQuestions };
  } catch (error) {
    return { 
      error: `Error generating exam questions: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

async function callGeminiCLI(prompt: string): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    // Note: This is a placeholder for the actual Gemini CLI subprocess call
    // In a real implementation, you would use Node.js child_process to call the Gemini CLI
    // For now, we'll simulate the API call
    
    // Simulated response for development
    if (prompt.includes('flashcards')) {
      const mockFlashcards = {
        flashcards: [
          {
            front: "What is the main topic of this document?",
            back: "The main topic is determined from the uploaded content",
            difficulty: "easy"
          },
          {
            front: "What are the key concepts mentioned?",
            back: "Key concepts are extracted from the document content",
            difficulty: "medium"
          }
        ]
      };
      
      return {
        success: true,
        content: JSON.stringify(mockFlashcards)
      };
    } else {
      const mockQuestions = {
        examQuestions: [
          {
            question: "Which of the following is a key concept from the document?",
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: 1,
            explanation: "This is extracted from the document content",
            difficulty: "medium"
          }
        ]
      };
      
      return {
        success: true,
        content: JSON.stringify(mockQuestions)
      };
    }
    
    // TODO: Implement actual Gemini CLI subprocess call
    // Example implementation:
    // const { spawn } = require('child_process');
    // const gemini = spawn('gemini', ['--prompt', prompt]);
    // ... handle response
    
  } catch (error) {
    return {
      success: false,
      error: `Gemini CLI error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}
