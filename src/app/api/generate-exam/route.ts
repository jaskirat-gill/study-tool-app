import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  estimateTokenCount, 
  chunkText, 
  getOptimalChunkingStrategy,
  distributeFlashcardsAcrossChunks
} from '../../../lib/text-chunker';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

async function callGeminiAPI(prompt: string): Promise<string> {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function generatePromptForQuestionTypes(
  content: string, 
  mcCount: number, 
  fibCount: number, 
  saCount: number, 
  chunkIndex?: number, 
  totalChunks?: number
): string {
  const questionSpecs = [];
  
  if (mcCount > 0) {
    questionSpecs.push(`${mcCount} multiple choice questions (each with exactly 4 options)`);
  }
  if (fibCount > 0) {
    questionSpecs.push(`${fibCount} fill-in-the-blank questions (statements with one word or phrase missing)`);
  }
  if (saCount > 0) {
    questionSpecs.push(`${saCount} short answer questions (requiring 1-2 sentence responses)`);
  }

  const chunkInfo = chunkIndex && totalChunks 
    ? `This is chunk ${chunkIndex} of ${totalChunks} from a larger document. Focus on the content in this chunk specifically.\n\n`
    : '';

  return `You are an expert educational content creator. Generate exactly ${questionSpecs.join(', ')} from the following content. Include an explanation for each correct answer. Vary the difficulty levels between "easy", "medium", and "hard".

${chunkInfo}Content:
${content}

Respond ONLY with valid JSON in this exact format (no other text before or after):
{
  "examQuestions": [
    {
      "type": "multiple-choice",
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Explanation of correct answer here",
      "difficulty": "medium"
    },
    {
      "type": "fill-in-blank",
      "question": "Statement with _____ missing word or phrase",
      "correctAnswer": "missing word or phrase",
      "explanation": "Explanation here",
      "difficulty": "medium"
    },
    {
      "type": "short-answer",
      "question": "Question requiring explanation",
      "correctAnswer": "Expected answer content",
      "explanation": "Explanation here",
      "difficulty": "medium"
    }
  ]
}`;
}

export async function POST(request: NextRequest) {
  try {
    const { content, multipleChoice = 5, fillInBlank = 0, shortAnswer = 0 } = await request.json();

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

    // Check if content needs chunking
    const tokenCount = estimateTokenCount(content);
    const needsChunking = tokenCount > 25000; // Conservative limit for Gemini prompts

    interface GeminiExamQuestion {
      question: string;
      type: 'multiple-choice' | 'fill-in-blank' | 'short-answer';
      options?: string[];
      correctAnswer: number | string;
      explanation: string;
      difficulty: string;
    }

    let allQuestions: GeminiExamQuestion[] = [];

    if (needsChunking) {
      console.log(`Large document detected (${tokenCount} tokens). Using chunking strategy for exam generation.`);
      
      // Get optimal chunking strategy and create chunks
      const strategy = getOptimalChunkingStrategy(content.length);
      const chunks = chunkText(content, strategy);
      
      // Distribute question counts across chunks proportionally
      const mcCounts = distributeFlashcardsAcrossChunks(chunks, mcCount);
      const fibCounts = distributeFlashcardsAcrossChunks(chunks, fibCount);
      const saCounts = distributeFlashcardsAcrossChunks(chunks, saCount);
      
      console.log(`Processing ${chunks.length} chunks with question distribution:`, 
        { multipleChoice: mcCounts, fillInBlank: fibCounts, shortAnswer: saCounts });

      // Process each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkMcCount = mcCounts[i];
        const chunkFibCount = fibCounts[i];
        const chunkSaCount = saCounts[i];
        
        if (chunkMcCount + chunkFibCount + chunkSaCount === 0) continue;

        const prompt = generatePromptForQuestionTypes(chunk.content, chunkMcCount, chunkFibCount, chunkSaCount, i + 1, chunks.length);

        try {
          // Call Gemini API directly instead of using CLI
          const apiResponse = await callGeminiAPI(prompt);

          let output = apiResponse.trim();

          // More robust JSON extraction - handle Gemini API output
          // Remove common non-JSON prefixes
          output = output.replace(/^```json\s*/i, '');
          output = output.replace(/^```\s*/i, '');
          output = output.replace(/```\s*$/i, '');
          
          // Find JSON boundaries more reliably
          const jsonStart = output.indexOf('{');
          const jsonEnd = output.lastIndexOf('}');

          if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
            throw new Error(`No valid JSON found in Gemini response for chunk ${i + 1}`);
          }
          
          output = output.substring(jsonStart, jsonEnd + 1);

          // Parse and add questions from this chunk
          const parsedResponse = JSON.parse(output);
          if (parsedResponse.examQuestions && Array.isArray(parsedResponse.examQuestions)) {
            allQuestions.push(...parsedResponse.examQuestions);
          }
          
          // Add small delay between API calls to be respectful
          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (chunkError) {
          console.error(`Error processing chunk ${i + 1}:`, chunkError);
          // Continue with other chunks even if one fails
        }
      }
    } else {
      // Process normally for smaller content
      const prompt = generatePromptForQuestionTypes(content, mcCount, fibCount, saCount);

      // Call Gemini API directly instead of using CLI
      const apiResponse = await callGeminiAPI(prompt);

      let output = apiResponse.trim();

      // More robust JSON extraction - handle Gemini API output
      // Remove common non-JSON prefixes
      output = output.replace(/^```json\s*/i, '');
      output = output.replace(/^```\s*/i, '');
      output = output.replace(/```\s*$/i, '');
      
      // Find JSON boundaries more reliably
      const jsonStart = output.indexOf('{');
      const jsonEnd = output.lastIndexOf('}');

      if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
        throw new Error('No valid JSON found in Gemini response');
      }
      
      output = output.substring(jsonStart, jsonEnd + 1);

      // Validate that we have valid JSON
      const parsedResponse = JSON.parse(output);
      if (parsedResponse.examQuestions && Array.isArray(parsedResponse.examQuestions)) {
        allQuestions = parsedResponse.examQuestions;
      }
    }

    // Add IDs to exam questions and ensure we don't exceed requested count
    const questionsWithIds = allQuestions
      .slice(0, totalQuestions) // Ensure we don't exceed requested count
      .map((question: GeminiExamQuestion) => ({
        id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
        question: question.question || '',
        type: question.type || 'multiple-choice',
        options: question.options || undefined,
        correctAnswer: question.correctAnswer || (question.type === 'multiple-choice' ? 0 : ''),
        explanation: question.explanation || '',
        difficulty: question.difficulty || 'medium',
      }));

    console.log(`Generated ${questionsWithIds.length} exam questions from ${needsChunking ? 'chunked' : 'single'} content`);
    return NextResponse.json({ examQuestions: questionsWithIds });

  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate exam questions. Please try again.' },
      { status: 500 }
    );
  }
}
