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

export async function POST(request: NextRequest) {
  try {
    const { content, count = 5 } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      );
    }

    const questionCount = Number(count) || 5;

    // Check if content needs chunking
    const tokenCount = estimateTokenCount(content);
    const needsChunking = tokenCount > 25000; // Conservative limit for Gemini prompts

    interface GeminiExamQuestion {
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
      difficulty: string;
    }

    let allQuestions: GeminiExamQuestion[] = [];

    if (needsChunking) {
      console.log(`Large document detected (${tokenCount} tokens). Using chunking strategy for exam generation.`);
      
      // Get optimal chunking strategy and create chunks
      const strategy = getOptimalChunkingStrategy(content.length);
      const chunks = chunkText(content, strategy);
      
      // Distribute question count across chunks (reusing the flashcard distribution function)
      const questionCounts = distributeFlashcardsAcrossChunks(chunks, questionCount);
      
      console.log(`Processing ${chunks.length} chunks with question distribution:`, questionCounts);

      // Process each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkQuestionCount = questionCounts[i];
        
        if (chunkQuestionCount === 0) continue;

        const prompt = `You are an expert educational content creator. Generate exactly ${chunkQuestionCount} multiple choice exam questions from the following content chunk. Each question should have exactly 4 options with one correct answer. Include an explanation for the correct answer. Vary the difficulty levels between "easy", "medium", and "hard".

This is chunk ${i + 1} of ${chunks.length} from a larger document. Focus on the content in this chunk specifically.

Content:
${chunk.content}

Respond ONLY with valid JSON in this exact format (no other text before or after):
{
  "examQuestions": [
    {
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Explanation of correct answer here",
      "difficulty": "medium"
    }
  ]
}`;

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
      const prompt = `You are an expert educational content creator. Generate exactly ${questionCount} multiple choice exam questions from the following content. Each question should have exactly 4 options with one correct answer. Include an explanation for the correct answer. Vary the difficulty levels between "easy", "medium", and "hard".

Content:
${content}

Respond ONLY with valid JSON in this exact format (no other text before or after):
{
  "examQuestions": [
    {
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Explanation of correct answer here",
      "difficulty": "medium"
    }
  ]
}`;

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
      .slice(0, questionCount) // Ensure we don't exceed requested count
      .map((question: GeminiExamQuestion) => ({
        id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
        question: question.question || '',
        options: question.options || [],
        correctAnswer: question.correctAnswer || 0,
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
