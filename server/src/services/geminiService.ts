import { GoogleGenAI, Type } from '@google/genai';
import { ProductInfo, NoteOutline, GenerateNoteResponse } from '../../../shared/types/index';

const OUTLINE_INSTRUCTION = `
你是一个专业的小红书运营专家。根据产品信息生成一个笔记大纲。
输出必须是 JSON，字段：
- titleSuggestions: 3个爆款标题
- hook: 开头钩子
- mainPoints: 3-5个要点
- imagePrompts: 3-4张图的英文描述

风格要求：大量 Emoji，语气亲切，制造焦虑或向往感。
`;

const NOTE_INSTRUCTION = `
你是专业小红书文案写手。根据大纲创作完整笔记。
要求：选最好标题、Emoji分隔段落、引导评论、5-8个热门标签。
输出 JSON：title, content, tags (数组)。
`;

const ANALYSIS_INSTRUCTION = `
你是小红书内容分析专家。分析给定的笔记内容，提取写作模式和风格。
输出 JSON，包含：
- name: 模板名称（基于内容主题）
- category: 分类（如：美妆、美食、旅行、生活等）
- titlePattern: 标题模式（用 {placeholder} 表示可变部分）
- contentStructure: { sections: [{type, placeholder, guidelines}], estimatedLength }
- styleGuide: { tone, emojiFrequency, emojiPlacement, paragraphStyle, keywords }
- hashtagStrategy: 推荐标签数组
- analysis: { titlePattern, contentFlow, emojiUsage, hashtagStrategy, writingStyle }
`;

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateOutline(info: ProductInfo): Promise<NoteOutline> {
    const prompt = `产品名称: ${info.name}\n目标受众: ${info.audience}\n产品描述: ${info.description}\n核心功能: ${info.features}\n风格: ${info.style}`;
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        systemInstruction: OUTLINE_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            titleSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            hook: { type: Type.STRING },
            mainPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            imagePrompts: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['titleSuggestions', 'hook', 'mainPoints', 'imagePrompts'],
        },
      },
    });
    return JSON.parse(response.text || '{}');
  }

  async generateFullNote(outline: NoteOutline, info: ProductInfo): Promise<GenerateNoteResponse> {
    const prompt = `大纲: ${JSON.stringify(outline)}\n基础信息: ${JSON.stringify(info)}`;
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        systemInstruction: NOTE_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['title', 'content', 'tags'],
        },
      },
    });
    return JSON.parse(response.text || '{}');
  }

  async generateImage(prompt: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.0-flash-preview-image-generation',
      contents: { parts: [{ text: `High quality Xiaohongshu style aesthetic photo: ${prompt}` }] },
      config: { responseModalities: ['IMAGE', 'TEXT'] },
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error('Failed to generate image');
  }

  async analyzeNote(content: string): Promise<unknown> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `请分析这篇小红书笔记的写作风格和结构模式：\n\n${content}`,
      config: { systemInstruction: ANALYSIS_INSTRUCTION, responseMimeType: 'application/json' },
    });
    return JSON.parse(response.text || '{}');
  }
}

export const geminiService = new GeminiService();
