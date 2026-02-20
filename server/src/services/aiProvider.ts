// server/src/services/aiProvider.ts
import { ProductInfo, NoteOutline, GenerateNoteResponse } from '../../../shared/types/index';

export interface AIProvider {
  generateOutline(info: ProductInfo): Promise<NoteOutline>;
  generateFullNote(outline: NoteOutline, info: ProductInfo): Promise<GenerateNoteResponse>;
  generateImage(prompt: string): Promise<string>;
  analyzeNote(content: string): Promise<unknown>;
}

export function createAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'gemini';

  if (provider === 'openai') {
    const { OpenAICompatibleProvider } = require('./openaiProvider');
    return new OpenAICompatibleProvider();
  }

  const { GeminiProvider } = require('./geminiProvider');
  return new GeminiProvider();
}

export const aiProvider: AIProvider = createAIProvider();
