import { DocumentProcessingResult, GeminiResponse } from '@/types';
import { validateFileSize, validateFileType } from './utils';

export async function generateFlashcards(content: string, count: number = 10, difficulty: number = 3): Promise<GeminiResponse> {
  try {
    const response = await fetch('/api/generate-flashcards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, count, difficulty }),
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

export async function generateExamQuestions(
  content: string, 
  multipleChoice: number = 5,
  fillInBlank: number = 0,
  shortAnswer: number = 0,
  fillInBlankWordBank?: string[],
  difficulty: number = 3
): Promise<GeminiResponse> {
  try {
    const response = await fetch('/api/generate-exam', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        content, 
        multipleChoice,
        fillInBlank,
        shortAnswer,
        fillInBlankWordBank,
        difficulty
      }),
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

export async function generateStudyNotes(content: string): Promise<{ notes?: string; error?: string }> {
  try {
    const response = await fetch('/api/generate-notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate notes');
    }

    const data = await response.json();
    return { notes: data.notes };

  } catch (error) {
    return { 
      error: `Error generating notes: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

export async function extractTextFromFile(file: File): Promise<DocumentProcessingResult> {
  try {
    // Validate file type
    if (!validateFileType(file)) {
      return {
        success: false,
        error: 'Unsupported file type. Please upload a TXT, PDF, or DOCX file.',
      };
    }

    // Validate file size (10MB limit)
    if (!validateFileSize(file, 10)) {
      return {
        success: false,
        error: 'File size must be less than 10MB',
      };
    }

    // Create form data and send to API
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/process-document', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to process document',
      };
    }

    return {
      success: true,
      content: result.content,
    };

  } catch (error) {
    return {
      success: false,
      error: `Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}