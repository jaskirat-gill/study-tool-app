import { ChatPromptTemplate } from '@langchain/core/prompts';
import { getGeminiModel } from './index';
import { flashcardsParser, examQuestionsParser, addIdsToFlashcards, addIdsToExamQuestions } from './output-parsers';
import { GeminiResponse } from '@/types';
import { splitTextIntoDocuments, documentsToTextChunks, distributeItemsAcrossChunks } from './index';
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
    // Set thresholds for chunking
    const chunkingThreshold = 8000; // Lower threshold for more manageable chunks
    const needsChunking = content.length > chunkingThreshold;
    let allFlashcards: z.infer<typeof flashcardsParser.schema>['flashcards'] = [];

    if (needsChunking) {
      // Split into chunks with enhanced metadata
      const documents = await splitTextIntoDocuments(content, { source: 'user_content', timestamp: new Date().toISOString() });
      const chunks = documentsToTextChunks(documents);
      
      // Distribute flashcard count across chunks proportionally to content size
      const cardCounts = distributeItemsAcrossChunks(documents, count);
      
      // Process each chunk with appropriate context
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkCardCount = cardCounts[i];
        
        if (chunkCardCount === 0) continue;

        // Generate flashcards for this chunk
        const chunkInfo = `This is chunk ${i + 1} of ${chunks.length} from a larger document. Focus on the content in this chunk specifically.`;
        
        const model = getGeminiModel();
        const formattedPrompt = await flashcardTemplate.format({
          count: chunkCardCount,
          content: chunk.content,
          chunk_info: chunkInfo,
          format_instructions: flashcardsParser.getFormatInstructions()
        });

        const response = await model.invoke(formattedPrompt);
        const responseText = extractTextFromAIMessage(response);
        const parsedOutput = await flashcardsParser.parse(responseText);
        
        if (parsedOutput.flashcards && Array.isArray(parsedOutput.flashcards)) {
          allFlashcards.push(...parsedOutput.flashcards);
        }
        
        // Add adaptive delay between API calls based on content size
        if (i < chunks.length - 1) {
          const delayMs = Math.min(1500, Math.max(500, chunk.estimatedTokens / 10));
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    } else {
      // Process small content directly
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
      
      if (parsedOutput.flashcards && Array.isArray(parsedOutput.flashcards)) {
        allFlashcards = parsedOutput.flashcards;
      }
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

    // Check if content needs chunking
    const needsChunking = content.length > 10000;
    let allQuestions: z.infer<typeof examQuestionsParser.schema>['examQuestions'] = [];

    if (needsChunking) {
      // Split into chunks
      const documents = await splitTextIntoDocuments(content);
      
      // Distribute questions across chunks
      const mcCounts = distributeItemsAcrossChunks(documents, mcCount);
      const fibCounts = distributeItemsAcrossChunks(documents, fibCount);
      const saCounts = distributeItemsAcrossChunks(documents, saCount);
      
      // Process each chunk
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        const chunkMcCount = mcCounts[i];
        const chunkFibCount = fibCounts[i];
        const chunkSaCount = saCounts[i];
        
        if (chunkMcCount + chunkFibCount + chunkSaCount === 0) continue;

        // Build question specs for this chunk
        const chunkQuestionSpecs = [];
        if (chunkMcCount > 0) {
          chunkQuestionSpecs.push(`${chunkMcCount} multiple choice questions (each with exactly 4 options)`);
        }
        if (chunkFibCount > 0) {
          chunkQuestionSpecs.push(`${chunkFibCount} fill-in-the-blank questions`);
        }
        if (chunkSaCount > 0) {
          chunkQuestionSpecs.push(`${chunkSaCount} short answer questions`);
        }

        const chunkInfo = `This is chunk ${i + 1} of ${documents.length} from a larger document. Focus on the content in this chunk specifically.`;
        
        const model = getGeminiModel();
        const formattedPrompt = await examTemplate.format({
          question_specs: chunkQuestionSpecs.join(', '),
          content: doc.pageContent,
          chunk_info: chunkInfo,
          word_bank_instruction: wordBankInstruction,
          format_instructions: examQuestionsParser.getFormatInstructions()
        });

        const response = await model.invoke(formattedPrompt);
        const responseText = extractTextFromAIMessage(response);
        const parsedOutput = await examQuestionsParser.parse(responseText);
        
        if (parsedOutput.examQuestions && Array.isArray(parsedOutput.examQuestions)) {
          allQuestions.push(...parsedOutput.examQuestions);
        }
        
        // Add delay between API calls
        if (i < documents.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } else {
      // Process small content directly
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
      
      if (parsedOutput.examQuestions && Array.isArray(parsedOutput.examQuestions)) {
        allQuestions = parsedOutput.examQuestions;
      }
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
    // Check if content needs chunking
    const needsChunking = content.length > 10000;
    const allNotes: string[] = [];

    if (needsChunking) {
      // Split into chunks
      const documents = await splitTextIntoDocuments(content);
      
      // Process each chunk
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        const chunkText = ` for chunk ${i + 1} of ${documents.length} from a larger document. Focus on the content in this chunk specifically`;
        
        const model = getGeminiModel();
        const formattedPrompt = await notesTemplate.format({
          content: doc.pageContent,
          chunk_text: chunkText
        });

        const response = await model.invoke(formattedPrompt);
        const responseText = extractTextFromAIMessage(response);
        
        if (responseText && responseText.trim()) {
          allNotes.push(responseText.trim());
        }
        
        // Add delay between API calls
        if (i < documents.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } else {
      // Process small content directly
      const model = getGeminiModel();
      const formattedPrompt = await notesTemplate.format({
        content,
        chunk_text: ""
      });

      const response = await model.invoke(formattedPrompt);
      const responseText = extractTextFromAIMessage(response);
      
      if (responseText && responseText.trim()) {
        allNotes.push(responseText.trim());
      }
    }

    // Combine all notes into a single document
    const combinedNotes = allNotes.join('\n\n---\n\n');

    if (!combinedNotes) {
      return { error: 'Failed to generate notes from the provided content.' };
    }

    return { notes: combinedNotes };
  } catch (error) {
    return { 
      error: `Error generating notes: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
