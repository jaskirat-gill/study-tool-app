// Utility functions for handling large text content and token limits

import { ChunkingOptions, TextChunk } from "@/types";

const DEFAULT_CHUNKING_OPTIONS: ChunkingOptions = {
  maxTokensPerChunk: 15000, // Conservative limit for Gemini
  overlapSize: 100, // 100 words overlap
  preserveSentences: true,
};

/**
 * Rough token estimation (OpenAI's rule: ~4 chars per token for English)
 * This is approximate but good enough for chunking decisions
 */
export function estimateTokenCount(text: string): number {
  // More accurate estimation considering:
  // - Average 4 characters per token
  // - Whitespace and punctuation
  // - Add 10% buffer for safety
  const charCount = text.length;
  const roughTokens = charCount / 4;
  return Math.ceil(roughTokens * 1.1); // 10% buffer
}

/**
 * Split text into chunks that fit within token limits
 */
export function chunkText(text: string, options: Partial<ChunkingOptions> = {}): TextChunk[] {
  const opts = { ...DEFAULT_CHUNKING_OPTIONS, ...options };
  const totalTokens = estimateTokenCount(text);
  
  // If text is small enough, return as single chunk
  if (totalTokens <= opts.maxTokensPerChunk) {
    return [{
      content: text,
      index: 0,
      estimatedTokens: totalTokens,
    }];
  }

  const chunks: TextChunk[] = [];
  const words = text.split(/\s+/);
  const totalWords = words.length;
  
  // Calculate approximate words per chunk based on token limit
  const avgWordsPerToken = totalWords / totalTokens;
  const wordsPerChunk = Math.floor(opts.maxTokensPerChunk * avgWordsPerToken);
  
  let currentIndex = 0;
  let chunkIndex = 0;
  
  while (currentIndex < totalWords) {
    let endIndex = Math.min(currentIndex + wordsPerChunk, totalWords);
    
    // Try to break at sentence boundaries if enabled
    if (opts.preserveSentences && endIndex < totalWords) {
      const chunkText = words.slice(currentIndex, endIndex).join(' ');
      const lastSentenceEnd = findLastSentenceEnd(chunkText);
      
      if (lastSentenceEnd > chunkText.length * 0.7) { // Only if we don't lose too much content
        const sentenceEndIndex = currentIndex + countWordsUpToPosition(words.slice(currentIndex, endIndex), lastSentenceEnd);
        endIndex = Math.min(sentenceEndIndex, totalWords);
      }
    }
    
    const chunkWords = words.slice(currentIndex, endIndex);
    const chunkContent = chunkWords.join(' ');
    const chunkTokens = estimateTokenCount(chunkContent);
    
    chunks.push({
      content: chunkContent,
      index: chunkIndex,
      estimatedTokens: chunkTokens,
    });
    
    // Move to next chunk with overlap
    currentIndex = Math.max(endIndex - opts.overlapSize, endIndex);
    chunkIndex++;
  }
  
  return chunks;
}

/**
 * Find the last sentence ending position in text
 */
function findLastSentenceEnd(text: string): number {
  const sentenceEnders = /[.!?]+/g;
  let lastMatch = -1;
  let match;
  
  while ((match = sentenceEnders.exec(text)) !== null) {
    lastMatch = match.index + match[0].length;
  }
  
  return lastMatch;
}

/**
 * Count words up to a specific character position
 */
function countWordsUpToPosition(words: string[], charPosition: number): number {
  let currentPos = 0;
  let wordCount = 0;
  
  for (const word of words) {
    if (currentPos + word.length > charPosition) {
      break;
    }
    currentPos += word.length + 1; // +1 for space
    wordCount++;
  }
  
  return wordCount;
}

/**
 * Determine optimal chunk size based on content length
 */
export function getOptimalChunkingStrategy(contentLength: number): ChunkingOptions {
  const totalTokens = estimateTokenCount(' '.repeat(contentLength)); // Rough estimation
  
  if (totalTokens <= 15000) {
    // Small document - process as single chunk
    return {
      maxTokensPerChunk: 15000,
      overlapSize: 0,
      preserveSentences: true,
    };
  } else if (totalTokens <= 50000) {
    // Medium document - 2-3 chunks with good overlap
    return {
      maxTokensPerChunk: 12000,
      overlapSize: 150,
      preserveSentences: true,
    };
  } else {
    // Large document - more chunks with strategic overlap
    return {
      maxTokensPerChunk: 10000,
      overlapSize: 200,
      preserveSentences: true,
    };
  }
}

/**
 * Calculate how many flashcards to generate per chunk
 */
export function distributeFlashcardsAcrossChunks(
  chunks: TextChunk[], 
  totalDesiredFlashcards: number
): number[] {
  const totalTokens = chunks.reduce((sum, chunk) => sum + chunk.estimatedTokens, 0);
  
  return chunks.map(chunk => {
    const ratio = chunk.estimatedTokens / totalTokens;
    const flashcardsForChunk = Math.max(1, Math.round(totalDesiredFlashcards * ratio));
    return Math.min(flashcardsForChunk, 15); // Cap at 15 per chunk for quality
  });
}
