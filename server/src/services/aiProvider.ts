// server/src/services/aiProvider.ts
import { ProductInfo, NoteOutline, GenerateNoteResponse } from '../../../shared/types/index';
import prisma from '../utils/prisma';

export interface AIProvider {
  generateOutline(info: ProductInfo & { pageCount?: number }): Promise<NoteOutline>;
  generateFullNote(outline: NoteOutline, info: ProductInfo): Promise<GenerateNoteResponse>;
  generateImage(prompt: string): Promise<string>;
  analyzeNote(content: string): Promise<unknown>;
}

// Internal cache for provider instances
const providerCache: Record<string, AIProvider> = {};

export async function getProvider(type: 'TEXT' | 'IMAGE'): Promise<AIProvider> {
  // 1. Try to get the active config from DB
  const activeConfig = await prisma.aIProviderConfig.findFirst({
    where: { type, isActive: true },
  });

  let config;
  if (activeConfig) {
    config = {
      provider: activeConfig.provider,
      apiKey: activeConfig.apiKey,
      baseUrl: activeConfig.baseUrl,
      model: activeConfig.model,
    };
  } else {
    // 2. Fallback to Env vars if no active config in DB
    config = {
      provider: process.env[`${type}_PROVIDER`] || (type === 'TEXT' ? 'gemini' : 'openai'),
      apiKey: process.env[`${type}_API_KEY`] || process.env[type === 'TEXT' ? 'GEMINI_API_KEY' : 'OPENAI_API_KEY'],
      baseUrl: process.env[`${type}_BASE_URL`] || (type === 'IMAGE' ? process.env.OPENAI_BASE_URL : undefined),
      model: process.env[`${type}_MODEL`] || (type === 'IMAGE' ? process.env.OPENAI_MODEL : undefined),
    };
  }

  // Create cache key based on config to reuse instances
  const cacheKey = JSON.stringify(config);
  if (providerCache[cacheKey]) return providerCache[cacheKey];

  let instance: AIProvider;
  if (config.provider === 'openai') {
    const { OpenAICompatibleProvider } = require('./openaiProvider');
    instance = new OpenAICompatibleProvider(config.apiKey, config.baseUrl, config.model);
  } else if (config.provider === 'nanobanana') {
    const { NanoBananaProvider } = require('./nanoBananaProvider');
    instance = new NanoBananaProvider(config.apiKey, config.baseUrl);
  } else {
    const { GeminiProvider } = require('./geminiProvider');
    instance = new GeminiProvider(config.apiKey, config.model);
  }

  providerCache[cacheKey] = instance;
  console.log(`[AIProvider] 为类型 ${type} 加载提供商: ${config.provider} (模型: ${config.model}) [来源: ${activeConfig ? '数据库' : '环境变量'}]`);
  return instance;
}

// Wrapper to keep the same interface but dynamic
export const textProvider: AIProvider = {
  generateOutline: async (info) => (await getProvider('TEXT')).generateOutline(info),
  generateFullNote: async (outline, info) => (await getProvider('TEXT')).generateFullNote(outline, info),
  generateImage: async (prompt) => (await getProvider('TEXT')).generateImage(prompt),
  analyzeNote: async (content) => (await getProvider('TEXT')).analyzeNote(content),
};

export const imageProvider: AIProvider = {
  generateOutline: async (info) => (await getProvider('IMAGE')).generateOutline(info),
  generateFullNote: async (outline, info) => (await getProvider('IMAGE')).generateFullNote(outline, info),
  generateImage: async (prompt) => (await getProvider('IMAGE')).generateImage(prompt),
  analyzeNote: async (content) => (await getProvider('IMAGE')).analyzeNote(content),
};
