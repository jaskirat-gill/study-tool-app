import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { estimateTokenCount, getOptimalChunkingStrategy, chunkText } from '@/lib/text-chunker';
import { TextChunk } from '@/types';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
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

// Helper function to distribute content processing across chunks
function distributeNotesAcrossChunks(chunks: TextChunk[], totalSections: number): number[] {
  const distribution = new Array(chunks.length).fill(0);
  
  // Simple distribution: try to give each chunk roughly equal sections
  const baseCount = Math.floor(totalSections / chunks.length);
  const remainder = totalSections % chunks.length;
  
  for (let i = 0; i < chunks.length; i++) {
    distribution[i] = baseCount + (i < remainder ? 1 : 0);
  }
  
  return distribution;
}

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      );
    }

    // Check if content needs chunking
    const tokenCount = estimateTokenCount(content);
    const needsChunking = tokenCount > 25000; // Conservative limit for Gemini prompts

    const allNotes: string[] = [];

    if (needsChunking) {
      console.log(`Large document detected (${tokenCount} tokens). Using chunking strategy.`);
      
      // Get optimal chunking strategy and create chunks
      const strategy = getOptimalChunkingStrategy(content.length);
      const chunks = chunkText(content, strategy);
      
      // Distribute note sections across chunks
      const noteSections = Math.max(chunks.length, 3); // At least 3 sections
      const sectionCounts = distributeNotesAcrossChunks(chunks, noteSections);
      
      console.log(`Processing ${chunks.length} chunks with section distribution:`, sectionCounts);

      // Process each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkSectionCount = sectionCounts[i];
        
        if (chunkSectionCount === 0) continue;

        const prompt = `You are an expert educational content summarizer. Create comprehensive review notes from the following content chunk. Focus on key concepts, important facts, definitions, and relationships between ideas.

This is chunk ${i + 1} of ${chunks.length} from a larger document. Focus on the content in this chunk specifically and create ${chunkSectionCount} well-organized section(s).

Structure your notes with:
- Clear headings for different topics/concepts
- Bullet points for key facts and details
- Important definitions highlighted
- Relationships between concepts explained
- Examples where relevant

Make the notes comprehensive yet concise, suitable for review and study.

Content:
${chunk.content}

Respond with well-formatted markdown notes:`;

        try {
          // Call Gemini API directly
          const apiResponse = await callGeminiAPI(prompt);
          
          if (apiResponse && apiResponse.trim()) {
            allNotes.push(apiResponse.trim());
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
      const prompt = `You are an expert educational content summarizer. Create comprehensive review notes from the following content. Focus on key concepts, important facts, definitions, and relationships between ideas.

Structure your notes with:
- Clear headings for different topics/concepts
- Bullet points for key facts and details
- Important definitions highlighted
- Relationships between concepts explained
- Examples where relevant

Make the notes comprehensive yet concise, suitable for review and study.

Content:
${content}

Respond with well-formatted markdown notes:`;

      try {
        // Call Gemini API directly
        const apiResponse = await callGeminiAPI(prompt);
        
        if (apiResponse && apiResponse.trim()) {
          allNotes.push(apiResponse.trim());
        }
      } catch (error) {
        console.error('Gemini API Error:', error);
        return NextResponse.json(
          { error: 'Failed to generate notes. Please try again.' },
          { status: 500 }
        );
      }
    }

    // Combine all notes into a single document
    const combinedNotes = allNotes.join('\n\n---\n\n');

    if (!combinedNotes) {
      return NextResponse.json(
        { error: 'Failed to generate notes from the provided content.' },
        { status: 500 }
      );
    }

    console.log(`Generated comprehensive notes from ${needsChunking ? 'chunked' : 'single'} content`);
    return NextResponse.json({ notes: combinedNotes });

  } catch (error) {
    console.error('Notes Generation API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate notes. Please try again.' },
      { status: 500 }
    );
  }
}
