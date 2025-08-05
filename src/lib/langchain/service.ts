import { ChatPromptTemplate } from '@langchain/core/prompts';
import { getGeminiModel } from './index';
import { flashcardsParser, examQuestionsParser, addIdsToFlashcards, addIdsToExamQuestions } from './output-parsers';
import { GeminiResponse } from '@/types';
import { z } from 'zod';
import { AIMessage } from '@langchain/core/messages';

// Template for flashcard generation
const flashcardTemplate = ChatPromptTemplate.fromTemplate(`
You are an expert educational content creator specialized in creating high-quality flashcards. Generate exactly {count} flashcards from the following content.

Flashcard Creation Guidelines:
- Focus on core concepts, definitions, and important facts
- Ensure questions are specific and unambiguous
- Create concise answers that fully address the question
- Distribute difficulty levels ("easy", "medium", "hard") evenly
- Write questions that test understanding rather than simple recall
- Avoid overly complex or compound questions

{chunk_info}

Content:
{content}

{format_instructions}
`);

// Template for exam question generation
const examTemplate = ChatPromptTemplate.fromTemplate(`
You are an expert educational assessment designer specializing in creating challenging but fair exam questions. Generate exactly {question_specs} from the following content.

Question Design Guidelines:
- Create clear, unambiguous questions that test understanding
- For multiple-choice: ensure exactly 4 options with one clearly correct answer
- For fill-in-blank: ensure the blank targets a key concept from the content
- For short answer: define a clear scope for acceptable answers
- Include detailed explanations that reinforce learning
- Distribute difficulty levels ("easy", "medium", "hard") evenly
- Ensure questions cover different aspects of the content

{chunk_info}
{word_bank_instruction}

Content:
{content}

{format_instructions}
`);

// Template for study notes generation
const notesTemplate = ChatPromptTemplate.fromTemplate(`
You are an expert educational content summarizer. Create comprehensive yet concise review notes from the following content{chunk_text}. 

Notes Creation Guidelines:
- Organize content with clear hierarchical structure (headings, subheadings)
- Use bullet points for key facts, nested when appropriate
- Bold important terms and definitions
- Include visual cues like numbered lists where appropriate
- Create connections between related concepts
- Maintain academic tone and precision
- Summarize complex ideas without oversimplification
- Include concise examples when they clarify difficult concepts

Content:
{content}

Respond with well-formatted markdown notes:
`);

// Helper to extract text from AI message
function extractTextFromAIMessage(message: AIMessage): string {
  if (typeof message.content === 'string') {
    return message.content;
  }
  
  // Handle complex message types
  if (Array.isArray(message.content)) {
    return message.content
      .map(part => {
        if (typeof part === 'string') {
          return part;
        } else if (part.type === 'text') {
          return part.text;
        }
        return '';
      })
      .join('');
  }
  
  return '';
}

export async function generateFlashcards(content: string, count: number = 10): Promise<GeminiResponse> {
  try {
    const model = getGeminiModel();
    const formattedPrompt = await flashcardTemplate.format({
      count,
      content,
      chunk_info: "",
      format_instructions: flashcardsParser.getFormatInstructions()
    });

    const response = await model.invoke(formattedPrompt);
    const responseText = extractTextFromAIMessage(response);
    const parsedOutput = await flashcardsParser.parse(responseText);
    
    let allFlashcards: z.infer<typeof flashcardsParser.schema>['flashcards'] = [];
    if (parsedOutput.flashcards && Array.isArray(parsedOutput.flashcards)) {
      allFlashcards = parsedOutput.flashcards;
    }

    // Add IDs to flashcards and ensure we don't exceed requested count
    const flashcardsWithIds = addIdsToFlashcards(allFlashcards.slice(0, count));

    return { flashcards: flashcardsWithIds };
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
  fillInBlankWordBank?: string[]
): Promise<GeminiResponse> {
  try {
    const mcCount = Number(multipleChoice) || 0;
    const fibCount = Number(fillInBlank) || 0;
    const saCount = Number(shortAnswer) || 0;
    const totalQuestions = mcCount + fibCount + saCount;

    if (totalQuestions === 0) {
      return { error: 'At least one question must be requested' };
    }

    // Build question specs string
    const questionSpecs = [];
    if (mcCount > 0) {
      questionSpecs.push(`${mcCount} multiple choice questions (each with exactly 4 options)`);
    }
    if (fibCount > 0) {
      questionSpecs.push(`${fibCount} fill-in-the-blank questions`);
    }
    if (saCount > 0) {
      questionSpecs.push(`${saCount} short answer questions`);
    }
    
    // Word bank instructions
    const wordBankInstruction = fillInBlankWordBank && fillInBlankWordBank.length > 0 && fibCount > 0
      ? `IMPORTANT: For fill-in-the-blank questions, you MUST create questions that test the specific words provided in the word bank: [${fillInBlankWordBank.join(', ')}]. Each fill-in-the-blank question should have one of these words as the correct answer.`
      : '';

    const model = getGeminiModel();
    const formattedPrompt = await examTemplate.format({
      question_specs: questionSpecs.join(', '),
      content,
      chunk_info: "",
      word_bank_instruction: wordBankInstruction,
      format_instructions: examQuestionsParser.getFormatInstructions()
    });

    const response = await model.invoke(formattedPrompt);
    const responseText = extractTextFromAIMessage(response);
    const parsedOutput = await examQuestionsParser.parse(responseText);
    
    let allQuestions: z.infer<typeof examQuestionsParser.schema>['examQuestions'] = [];
    if (parsedOutput.examQuestions && Array.isArray(parsedOutput.examQuestions)) {
      allQuestions = parsedOutput.examQuestions;
    }

    // Add IDs to questions and ensure we don't exceed requested count
    const questionsWithIds = addIdsToExamQuestions(allQuestions.slice(0, totalQuestions));

    return { examQuestions: questionsWithIds };
  } catch (error) {
    return { 
      error: `Error generating exam questions: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export async function generateStudyNotes(content: string): Promise<{ notes?: string; error?: string }> {
  try {
    const model = getGeminiModel();
    const formattedPrompt = await notesTemplate.format({
      content,
      chunk_text: ""
    });

    const response = await model.invoke(formattedPrompt);
    const responseText = extractTextFromAIMessage(response);
    
    if (!responseText || !responseText.trim()) {
      return { error: 'Failed to generate notes from the provided content.' };
    }

    return { notes: responseText.trim() };
  } catch (error) {
    return { 
      error: `Error generating notes: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
