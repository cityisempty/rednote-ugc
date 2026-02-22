// server/src/services/openaiProvider.ts
import axios from 'axios';
import { ProductInfo, NoteOutline, GenerateNoteResponse } from '../../../shared/types/index';
import { AIProvider } from './aiProvider';
import { PromptManager } from '../utils/promptManager';
import * as fs from 'fs';
import * as path from 'path';

function parseJSON(text: string): unknown {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return JSON.parse(match ? match[1].trim() : text.trim());
}

const PROMPTS_DIR = path.join(__dirname, '..', 'prompts');

function loadFallbackPrompt(filename: string): string {
  try {
    return fs.readFileSync(path.join(PROMPTS_DIR, filename), 'utf-8');
  } catch {
    return '';
  }
}

export class OpenAICompatibleProvider implements AIProvider {
  private model: string;
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey?: string, baseURL?: string, model?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
    this.baseURL = baseURL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    this.model = model || 'gpt-4o-mini';
  }

  private async chatCompletion(content: string): Promise<string> {
    const res = await axios.post(
      `${this.baseURL}/chat/completions`,
      { model: this.model, messages: [{ role: 'user', content }] },
      {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
        timeout: 120000,
      }
    );
    return res.data.choices[0].message.content || '';
  }

  async generateOutline(info: ProductInfo & { pageCount?: number }): Promise<NoteOutline> {
    const prompt = `你是小红书运营专家。生成大纲JSON。
    需包含：titleSuggestions(5个标题), pages(数组, 包含pageNumber, type["cover"|"content"|"summary"], title, content, imagePrompt)。
    产品:${info.name} 受众:${info.audience} 描述:${info.description} 页数:${info.pageCount || 6}`;
    const text = await this.chatCompletion(prompt);
    return parseJSON(text) as NoteOutline;
  }

  async generateFullNote(outline: NoteOutline, info: ProductInfo): Promise<GenerateNoteResponse> {
    const outlineText = outline.pages.map(p => `[${p.type === 'cover' ? '封面' : p.type === 'summary' ? '总结' : '内容'}]\n${p.title}\n${p.content}`).join('\n\n');
    const prompt = `你是小红书爆款内容专家。根据大纲生成标题、文案和标签。严格按JSON格式输出：{"titles":["标题1","标题2","标题3"],"copywriting":"完整文案...","tags":["标签1","标签2"]}。\n\n用户主题：${info.name}\n大纲：\n${outlineText}`;
    const text = await this.chatCompletion(prompt);
    const raw = parseJSON(text) as Record<string, any>;
    return {
      title: raw.title || (Array.isArray(raw.titles) ? raw.titles[0] : '') || '',
      content: raw.content || raw.copywriting || '',
      tags: raw.tags || [],
    };
  }

  private async getImagePrompt(pageContent: string, pageType: string): Promise<string> {
    let prompt = await PromptManager.getPrompt('image-default', {
      page_content: pageContent,
      page_type: pageType,
    });
    if (!prompt) {
      prompt = loadFallbackPrompt('image_prompt.txt')
        .replace(/{page_content}/g, pageContent)
        .replace(/{page_type}/g, pageType);
    }
    return prompt || pageContent;
  }

  async generateImage(prompt: string): Promise<string> {
    // 用完整的中文 image prompt 模板
    const enhancedPrompt = await this.getImagePrompt(prompt, '内容');

    try {
      // 1. 尝试标准 DALL-E 接口
      const response = await axios.post(`${this.baseURL}/images/generations`, {
        model: this.model,
        prompt: enhancedPrompt,
        n: 1,
        size: '1024x1024',
        response_format: 'b64_json'
      }, {
        headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
        timeout: 120000,
      });

      const b64 = response.data.data?.[0]?.b64_json;
      if (b64) return `data:image/png;base64,${b64}`;
      if (response.data.data?.[0]?.url) return response.data.data[0].url;
      throw new Error('No image data');
    } catch (error: any) {
      try {
        // 2. 尝试 Chat 回退 (适用于某些混合模型)
        const chatRes = await this.chatCompletion(enhancedPrompt);
        const urlMatch = chatRes.match(/!\[.*\]\((https?:\/\/.*?)\)/) || chatRes.match(/(https?:\/\/.*?\.(?:png|jpg|jpeg|webp))/);
        if (urlMatch) return urlMatch[1];
      } catch (chatErr) {
        console.error('Chat fallback failed:', chatErr);
      }

      // 3. 终极备选：Pollinations
      const encoded = encodeURIComponent(`Xiaohongshu style, simplified Chinese text, ${prompt}`);
      return `https://image.pollinations.ai/prompt/${encoded}?width=768&height=1024&nologo=true`;
    }
  }

  async analyzeNote(content: string): Promise<unknown> {
    const text = await this.chatCompletion(`分析文章风格JSON：${content}`);
    return parseJSON(text);
  }
}
