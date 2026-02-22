# Multi-AI Provider Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在服务端引入可插拔的 AI Provider 抽象层，支持 Gemini 和任意 OpenAI 兼容服务（DeepSeek、Qwen、Ollama 等），通过 `.env` 中的 `AI_PROVIDER` 变量切换。

**Architecture:** 定义统一的 `AIProvider` 接口，将现有 `geminiService.ts` 重构为 `GeminiProvider`，新增 `OpenAICompatibleProvider`，通过工厂函数按环境变量返回对应实例。`generateService.ts` 只依赖接口，无需感知具体 provider。

**Tech Stack:** `openai` npm 包（同时支持 OpenAI 和所有兼容接口），现有 `@google/genai` 保留。

---

### Task 1: 安装 openai 依赖

**Files:**
- Modify: `server/package.json`

**Step 1: 安装 openai 包**

```bash
cd /Users/sunlice/Documents/Code/rednote-ugc/server
npm install openai
```

Expected: `openai` 出现在 `package.json` dependencies 中。

**Step 2: Commit**

```bash
git add server/package.json server/package-lock.json
git commit -m "chore: add openai package for multi-provider support"
```

---

### Task 2: 定义 AIProvider 接口和工厂函数

**Files:**
- Create: `server/src/services/aiProvider.ts`

**Step 1: 创建文件**

```typescript
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
```

**Step 2: Commit**

```bash
git add server/src/services/aiProvider.ts
git commit -m "feat: add AIProvider interface and factory"
```

---

### Task 3: 将 geminiService 重构为 GeminiProvider

**Files:**
- Create: `server/src/services/geminiProvider.ts`（内容来自现有 `geminiService.ts`，实现 `AIProvider` 接口）
- Keep: `server/src/services/geminiService.ts`（暂时保留，Task 5 再处理）

**Step 1: 创建 `geminiProvider.ts`**

```typescript
// server/src/services/geminiProvider.ts
import { GoogleGenAI, Type } from '@google/genai';
import { ProductInfo, NoteOutline, GenerateNoteResponse } from '../../../shared/types/index';
import { AIProvider } from './aiProvider';

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

export class GeminiProvider implements AIProvider {
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
```

**Step 2: Commit**

```bash
git add server/src/services/geminiProvider.ts
git commit -m "feat: extract GeminiProvider implementing AIProvider interface"
```

---

### Task 4: 创建 OpenAICompatibleProvider

**Files:**
- Create: `server/src/services/openaiProvider.ts`

**Step 1: 创建文件**

```typescript
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
```

**Step 2: Commit**

```bash
git add server/src/services/openaiProvider.ts
git commit -m "feat: add OpenAICompatibleProvider for OpenAI and compatible APIs"
```

---

### Task 5: 更新 generateService.ts 使用工厂

**Files:**
- Modify: `server/src/services/generateService.ts`

**Step 1: 将 `geminiService` 引用替换为 `aiProvider`**

将文件顶部的 import 从：
```typescript
import { geminiService } from './geminiService';
```
改为：
```typescript
import { aiProvider } from './aiProvider';
```

然后将文件中所有 `geminiService.` 替换为 `aiProvider.`（共 4 处：`generateOutline`、`generateFullNote`、`generateImage`、`analyzeNote`）。

**Step 2: Commit**

```bash
git add server/src/services/generateService.ts
git commit -m "feat: update generateService to use AIProvider abstraction"
```

---

### Task 6: 更新 geminiService.ts 兼容旧引用（可选保留）

**Files:**
- Modify: `server/src/services/geminiService.ts`

旧的 `geminiService.ts` 只在 `generateService.ts` 中被引用，Task 5 已经移除了该引用。将其内容替换为一个简单的重新导出，保持向后兼容：

```typescript
// server/src/services/geminiService.ts
// Deprecated: use aiProvider from ./aiProvider instead
export { GeminiProvider as GeminiService } from './geminiProvider';
export { aiProvider as geminiService } from './aiProvider';
```

**Step 2: Commit**

```bash
git add server/src/services/geminiService.ts
git commit -m "chore: keep geminiService.ts as deprecated re-export"
```

---

### Task 7: 更新 .env.example 和现有 .env

**Files:**
- Modify: `server/.env.example`
- Modify: `server/.env`

**Step 1: 更新 `.env.example`**

在 `# Gemini API` 部分之后添加：

```env
# AI Provider Selection: gemini | openai (default: gemini)
AI_PROVIDER=gemini

# Gemini API
GEMINI_API_KEY="your-gemini-api-key"

# OpenAI Compatible API (used when AI_PROVIDER=openai)
OPENAI_API_KEY="your-openai-api-key"
OPENAI_BASE_URL="https://api.openai.com/v1"
OPENAI_MODEL="gpt-4o"
OPENAI_IMAGE_MODEL="dall-e-3"
```

**Step 2: 在 `server/.env` 中添加新变量（保留现有值）**

```env
AI_PROVIDER=gemini
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o
OPENAI_IMAGE_MODEL=dall-e-3
```

**Step 3: Commit**

```bash
git add server/.env.example
git commit -m "docs: update .env.example with multi-provider config"
```

注意：`server/.env` 包含真实 key，不要 commit。

---

### Task 8: 验证构建通过

**Step 1: 在 server 目录运行 TypeScript 编译检查**

```bash
cd /Users/sunlice/Documents/Code/rednote-ugc/server
npx tsc --noEmit
```

Expected: 无错误输出。

**Step 2: 如有错误，根据错误信息修复类型问题**

常见问题：
- `response_format` 不支持时（某些模型不支持 `json_object`），需要在 `openaiProvider.ts` 中加条件判断
- `openai` 包的类型与实际调用不匹配时，检查 SDK 版本

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete multi-AI provider support with Gemini and OpenAI-compatible backends"
```
