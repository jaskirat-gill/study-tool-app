export interface Flashcard {
  id: string;
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
  created: Date;
  lastReviewed?: Date;
  reviewCount: number;
  correctCount: number;
}

export interface StudySet {
  id: string;
  title: string;
  description?: string;
  flashcards: Flashcard[];
  created: Date;
  lastModified: Date;
  sourceDocument?: {
    name: string;
    type: string;
    size: number;
  };
}

export interface PracticeExam {
  id: string;
  title: string;
  questions: ExamQuestion[];
  duration: number; // in minutes
  created: Date;
  studySetId: string;
}

export interface ExamQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'fill-in-blank' | 'short-answer';
  options?: string[]; // Only for multiple-choice
  correctAnswer?: number | string; // index for multiple-choice, string for others
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface StudySession {
  id: string;
  studySetId: string;
  startTime: Date;
  endTime?: Date;
  flashcardsReviewed: number;
  correctAnswers: number;
  completedFlashcards: string[]; // flashcard IDs
}

export interface DocumentProcessingResult {
  success: boolean;
  content?: string;
  error?: string;
}

export interface GeminiResponse {
  flashcards?: Flashcard[];
  examQuestions?: ExamQuestion[];
  error?: string;
}
