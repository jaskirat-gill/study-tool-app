import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from '@langchain/core/documents';

// Initialize model
export const getGeminiModel = (modelName: string = 'gemini-2.5-flash') => {
  return new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY || '',
    model: modelName,
  });
};

// Text splitter for document chunking
export const getTextSplitter = (chunkSize: number = 10000, chunkOverlap: number = 200) => {
  return new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    separators: ["\n\n", "\n", ". ", " ", ""],
    keepSeparator: false,
  });
};

// Helper to split text into documents
export async function splitTextIntoDocuments(text: string, metadata: Record<string, unknown> = {}) {
  const splitter = getTextSplitter();
  const documents = await splitter.createDocuments([text], [metadata]);
  return documents;
}

// Convert Documents to TextChunks for backward compatibility
export function documentsToTextChunks(documents: Document[]) {
  return documents.map((doc, index) => ({
    content: doc.pageContent,
    index,
    estimatedTokens: estimateTokenCount(doc.pageContent),
    metadata: doc.metadata,
  }));
}

// Token estimation (for backward compatibility)
export function estimateTokenCount(text: string): number {
  const charCount = text.length;
  const roughTokens = charCount / 4;
  return Math.ceil(roughTokens * 1.1); // 10% buffer
}

// Helper to distribute items across chunks proportionally
export function distributeItemsAcrossChunks(chunks: Document[], totalItems: number): number[] {
  const totalTokens = chunks.reduce((sum, chunk) => sum + estimateTokenCount(chunk.pageContent), 0);
  
  return chunks.map(chunk => {
    const ratio = estimateTokenCount(chunk.pageContent) / totalTokens;
    const itemsForChunk = Math.max(1, Math.round(totalItems * ratio));
    return Math.min(itemsForChunk, 15); // Cap at 15 per chunk for quality
  });
}
