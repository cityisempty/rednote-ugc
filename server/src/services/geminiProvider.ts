// server/src/services/geminiProvider.ts
import { GoogleGenAI, Type } from '@google/genai';
import { ProductInfo, NoteOutline, GenerateNoteResponse } from '../../../shared/types/index';
import { AIProvider } from './aiProvider';
import axios from 'axios';
import { PromptManager } from '../utils/promptManager';
import * as fs from 'fs';
import * as path from 'path';

const ANALYSIS_INSTRUCTION = `你是小红书内容分析专家。分析笔记风格并输出 JSON。`;

const PROMPTS_DIR = path.join(__dirname, '..', 'prompts');

function loadFallbackPrompt(filename: string): string {
  try {
    return fs.readFileSync(path.join(PROMPTS_DIR, filename), 'utf-8');
  } catch {
    return '';
  }
}

/** 将 AI 返回的不确定结构映射为 GenerateNoteResponse */
function normalizeNoteResponse(raw: Record<string, any>): GenerateNoteResponse {
  return {
    title: raw.title || (Array.isArray(raw.titles) ? raw.titles[0] : '') || '',
    content: raw.content || raw.copywriting || '',
    tags: raw.tags || [],
  };
}

export class GeminiProvider implements AIProvider {
  private ai: GoogleGenAI;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY not configured');
    this.ai = new GoogleGenAI({ apiKey: key });
    this.model = model || 'gemini-3-flash-preview';
  }

  async generateOutline(info: ProductInfo & { pageCount?: number }): Promise<NoteOutline> {
    const topic = `产品名称: ${info.name}\n目标受众: ${info.audience || '小红书用户'}\n产品描述: ${info.description}\n核心功能: ${info.features || '无'}\n风格: ${info.style || '通用'}\n期望页数: ${info.pageCount || '标准 (6-9页)'}`;

    // 获取数据库中的大纲提示词，回退到文件
    let systemInstruction = await PromptManager.getPrompt('outline-default', { topic });
    if (!systemInstruction) {
      systemInstruction = loadFallbackPrompt('outline_prompt.txt').replace(/{topic}/g, topic);
    }
    const isJsonRequested = systemInstruction.toLowerCase().includes('json');

    const result = await this.ai.models.generateContent({
      model: this.model,
      contents: [{ role: 'user', parts: [{ text: topic }] }],
      config: {
        systemInstruction: { parts: [{ text: systemInstruction }] },
        responseMimeType: isJsonRequested ? 'application/json' : 'text/plain',
      },
    });

    const text = (result as any).text || '';

    if (isJsonRequested) {
      try {
        return JSON.parse(text);
      } catch (e) {
        console.warn('JSON 解析失败，尝试标签解析...');
      }
    }

    // 针对非 JSON 或解析失败的情况，使用标签解析
    const pages = PromptManager.parseTaggedPages(text);
    return {
      titleSuggestions: pages.slice(0, 3).map(p => p.title),
      pages
    };
  }

  async generateFullNote(outline: NoteOutline, info: ProductInfo): Promise<GenerateNoteResponse> {
    const topic = info.name || '小红书笔记';
    const outlineText = outline.pages.map(p => `[${p.type === 'cover' ? '封面' : p.type === 'summary' ? '总结' : '内容'}]\n${p.title}\n${p.content}`).join('\n\n');

    // 获取数据库中的文案提示词，回退到文件
    let systemInstruction = await PromptManager.getPrompt('content-default', {
      topic,
      outline: outlineText
    });
    if (!systemInstruction) {
      systemInstruction = loadFallbackPrompt('content_prompt.txt')
        .replace(/{topic}/g, topic)
        .replace(/{outline}/g, outlineText);
    }

    const result = await this.ai.models.generateContent({
      model: this.model,
      contents: [{ role: 'user', parts: [{ text: `根据以下大纲生成小红书文案。\n\n用户主题：${topic}\n\n大纲内容：\n${outlineText}` }] }],
      config: {
        systemInstruction: { parts: [{ text: systemInstruction }] },
        responseMimeType: 'application/json',
      },
    });
    const text = (result as any).text;
    const raw = JSON.parse(text || '{}');
    return normalizeNoteResponse(raw);
  }

  async generateImage(prompt: string): Promise<string> {
    // 默认使用 Pollinations.ai 作为 Gemini 的备选生图方式
    const encoded = encodeURIComponent(`Xiaohongshu style aesthetic photo, ${prompt}`);
    return `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true`;
  }

  async analyzeNote(content: string): Promise<unknown> {
    const result = await this.ai.models.generateContent({
      model: this.model,
      contents: [{ role: 'user', parts: [{ text: `请分析这篇小红书笔记：\n\n${content}` }] }],
      config: {
        systemInstruction: { parts: [{ text: ANALYSIS_INSTRUCTION }] },
        responseMimeType: 'application/json'
      },
    });
    const text = (result as any).text;
    return JSON.parse(text || '{}');
  }
}
