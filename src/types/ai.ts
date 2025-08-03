import { ExamQuestion, Flashcard } from "@/types";

export interface TextChunk {
  content: string;
  index: number;
  estimatedTokens: number;
}

export interface ChunkingOptions {
  maxTokensPerChunk: number;
  overlapSize: number; // Number of words to overlap between chunks
  preserveSentences: boolean; // Try to break at sentence boundaries
}

export interface GeminiResponse {
  flashcards?: Flashcard[];
  examQuestions?: ExamQuestion[];
  error?: string;
}

export interface DocumentProcessingResult {
  success: boolean;
  content?: string;
  error?: string;
}