import { z } from 'zod';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { Flashcard, ExamQuestion } from '@/types';

// Define Zod schema for Flashcards
const FlashcardSchema = z.object({
  front: z.string().describe("The question or prompt on the front of the flashcard"),
  back: z.string().describe("The answer on the back of the flashcard"),
  difficulty: z.enum(["easy", "medium", "hard"]).describe("The difficulty level of the flashcard")
});

const FlashcardsSchema = z.object({
  flashcards: z.array(FlashcardSchema).describe("Array of flashcards generated from the content")
});

// Define Zod schema for Exam Questions
const MultipleChoiceQuestionSchema = z.object({
  type: z.literal("multiple-choice"),
  question: z.string().describe("The multiple choice question text"),
  options: z.array(z.string()).describe("Array of 4 possible answer options"),
  correctAnswer: z.number().describe("Index of the correct answer (0-3)"),
  explanation: z.string().describe("Explanation of why the answer is correct"),
  difficulty: z.enum(["easy", "medium", "hard"]).describe("The difficulty level of the question")
});

const FillInBlankQuestionSchema = z.object({
  type: z.literal("fill-in-blank"),
  question: z.string().describe("The fill-in-the-blank question with a blank indicated by _____"),
  correctAnswer: z.string().describe("The correct word or phrase for the blank"),
  explanation: z.string().describe("Explanation of why the answer is correct"),
  difficulty: z.enum(["easy", "medium", "hard"]).describe("The difficulty level of the question")
});

const ShortAnswerQuestionSchema = z.object({
  type: z.literal("short-answer"),
  question: z.string().describe("The short answer question text"),
  correctAnswer: z.string().describe("The expected short answer response"),
  explanation: z.string().describe("Explanation of the correct answer"),
  difficulty: z.enum(["easy", "medium", "hard"]).describe("The difficulty level of the question")
});

const ExamQuestionSchema = z.discriminatedUnion("type", [
  MultipleChoiceQuestionSchema,
  FillInBlankQuestionSchema,
  ShortAnswerQuestionSchema
]);

const ExamQuestionsSchema = z.object({
  examQuestions: z.array(ExamQuestionSchema).describe("Array of exam questions generated from the content")
});

// Create output parsers
export const flashcardsParser = StructuredOutputParser.fromZodSchema(FlashcardsSchema);
export const examQuestionsParser = StructuredOutputParser.fromZodSchema(ExamQuestionsSchema);

// Add IDs to parsed flashcards for database storage
export function addIdsToFlashcards(flashcards: z.infer<typeof FlashcardSchema>[]): Flashcard[] {
  return flashcards.map(card => ({
    id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
    front: card.front,
    back: card.back,
    difficulty: card.difficulty,
    created: new Date(),
    reviewCount: 0,
    correctCount: 0,
  }));
}

// Add IDs to parsed exam questions for database storage
export function addIdsToExamQuestions(
  questions: z.infer<typeof ExamQuestionSchema>[]
): ExamQuestion[] {
  return questions.map(question => ({
    id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
    ...question,
  }));
}
