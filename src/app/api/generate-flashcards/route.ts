import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { chunkText, estimateTokenCount, getOptimalChunkingStrategy, distributeFlashcardsAcrossChunks } from '@/lib/text-chunker';

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
    const { content, count = 10 } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      );
    }

    const cardCount = Number(count) || 10;

    // Check if content needs chunking
    const tokenCount = estimateTokenCount(content);
    const needsChunking = tokenCount > 25000; // Conservative limit for Gemini prompts

    interface GeminiFlashcard {
      front: string;
      back: string;
      difficulty: string;
    }

    let allFlashcards: GeminiFlashcard[] = [];

    if (needsChunking) {
      console.log(`Large document detected (${tokenCount} tokens). Using chunking strategy.`);
      
      // Get optimal chunking strategy and create chunks
      const strategy = getOptimalChunkingStrategy(content.length);
      const chunks = chunkText(content, strategy);
      
      // Distribute flashcard count across chunks
      const cardCounts = distributeFlashcardsAcrossChunks(chunks, cardCount);
      
      console.log(`Processing ${chunks.length} chunks with card distribution:`, cardCounts);

      // Process each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkCardCount = cardCounts[i];
        
        if (chunkCardCount === 0) continue;

        const prompt = `You are an expert educational content creator. You specialize in biomedical physiology, and cognitive science. Generate exactly ${chunkCardCount} flashcards from the following content chunk. Each flashcard should have a clear question (front) and answer (back). Focus on key concepts, definitions, and important facts. Vary the difficulty levels between "easy", "medium", and "hard".

This is chunk ${i + 1} of ${chunks.length} from a larger document. Focus on the content in this chunk specifically.

Content:
${chunk.content}

Respond ONLY with valid JSON in this exact format (no other text before or after):
{
  "flashcards": [
    {
      "front": "Question text here",
      "back": "Answer text here", 
      "difficulty": "easy"
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

          // Parse and add flashcards from this chunk
          const parsedResponse = JSON.parse(output);
          if (parsedResponse.flashcards && Array.isArray(parsedResponse.flashcards)) {
            allFlashcards.push(...parsedResponse.flashcards);
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
      const prompt = `You are an expert educational content creator. You specialize in biomedical physiology, and cognitive science. Generate exactly ${cardCount} flashcards from the following content. Each flashcard should have a clear question (front) and answer (back). Focus on key concepts, definitions, and important facts. Vary the difficulty levels between "easy", "medium", and "hard".

Content:
${content}

Respond ONLY with valid JSON in this exact format (no other text before or after):
{
  "flashcards": [
    {
      "front": "Question text here",
      "back": "Answer text here", 
      "difficulty": "easy"
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
      if (parsedResponse.flashcards && Array.isArray(parsedResponse.flashcards)) {
        allFlashcards = parsedResponse.flashcards;
      }
    }

    // Add IDs to flashcards and ensure we don't exceed requested count
    const flashcardsWithIds = allFlashcards
      .slice(0, cardCount) // Ensure we don't exceed requested count
      .map((card: GeminiFlashcard) => ({
        id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
        front: card.front || '',
        back: card.back || '',
        difficulty: card.difficulty || 'medium',
        created: new Date(),
        reviewCount: 0,
        correctCount: 0,
      }));

    console.log(`Generated ${flashcardsWithIds.length} flashcards from ${needsChunking ? 'chunked' : 'single'} content`);
    return NextResponse.json({ flashcards: flashcardsWithIds });

  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate flashcards. Please try again.' },
      { status: 500 }
    );
  }
}
