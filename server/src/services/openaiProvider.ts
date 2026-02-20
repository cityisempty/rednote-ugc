// server/src/services/openaiProvider.ts
import OpenAI from 'openai';
import { ProductInfo, NoteOutline, GenerateNoteResponse } from '../../../shared/types/index';
import { AIProvider } from './aiProvider';

const OUTLINE_SYSTEM = `你是一个专业的小红书运营专家。根据产品信息生成一个笔记大纲。
输出必须是合法 JSON，字段：
- titleSuggestions: array of 3 strings（爆款标题）
- hook: string（开头钩子）
- mainPoints: array of 3-5 strings（要点）
- imagePrompts: array of 3-4 strings（图片英文描述）
风格要求：大量 Emoji，语气亲切，制造焦虑或向往感。只输出 JSON，不要任何其他文字。`;

const NOTE_SYSTEM = `你是专业小红书文案写手。根据大纲创作完整笔记。
要求：选最好标题、Emoji分隔段落、引导评论、5-8个热门标签。
输出合法 JSON：{ "title": string, "content": string, "tags": string[] }。只输出 JSON，不要任何其他文字。`;

const ANALYSIS_SYSTEM = `你是小红书内容分析专家。分析给定的笔记内容，提取写作模式和风格。
输出合法 JSON，包含：name, category, titlePattern, contentStructure, styleGuide, hashtagStrategy, analysis。只输出 JSON，不要任何其他文字。`;

function parseJSON(text: string): unknown {
  // 尝试提取 markdown code block 中的 JSON
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return JSON.parse(match ? match[1].trim() : text.trim());
}

export class OpenAICompatibleProvider implements AIProvider {
  private client: OpenAI;
  private model: string;
  private imageModel: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

    this.client = new OpenAI({
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    });
    this.model = process.env.OPENAI_MODEL || 'gpt-4o';
    this.imageModel = process.env.OPENAI_IMAGE_MODEL || 'dall-e-3';
  }

  async generateOutline(info: ProductInfo): Promise<NoteOutline> {
    const userPrompt = `产品名称: ${info.name}\n目标受众: ${info.audience}\n产品描述: ${info.description}\n核心功能: ${info.features}\n风格: ${info.style}`;
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: OUTLINE_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    });
    return parseJSON(response.choices[0].message.content || '{}') as NoteOutline;
  }

  async generateFullNote(outline: NoteOutline, info: ProductInfo): Promise<GenerateNoteResponse> {
    const userPrompt = `大纲: ${JSON.stringify(outline)}\n基础信息: ${JSON.stringify(info)}`;
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: NOTE_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    });
    return parseJSON(response.choices[0].message.content || '{}') as GenerateNoteResponse;
  }

  async generateImage(prompt: string): Promise<string> {
    const response = await this.client.images.generate({
      model: this.imageModel,
      prompt: `High quality Xiaohongshu style aesthetic photo: ${prompt}`,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json',
    });
    const b64 = response.data[0]?.b64_json;
    if (!b64) throw new Error('Failed to generate image');
    return `data:image/png;base64,${b64}`;
  }

  async analyzeNote(content: string): Promise<unknown> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: ANALYSIS_SYSTEM },
        { role: 'user', content: `请分析这篇小红书笔记的写作风格和结构模式：\n\n${content}` },
      ],
      response_format: { type: 'json_object' },
    });
    return parseJSON(response.choices[0].message.content || '{}');
  }
}
