
import { GoogleGenAI, Type } from "@google/genai";
import { ProductInfo, NoteOutline } from "../types";
import { SYSTEM_INSTRUCTION_OUTLINE, SYSTEM_INSTRUCTION_NOTE } from "../constants";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    /* Fix: Always use process.env.API_KEY directly when initializing the @google/genai client instance. */
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateOutline(info: ProductInfo): Promise<NoteOutline> {
    const prompt = `
      产品名称: ${info.name}
      目标受众: ${info.audience}
      产品描述: ${info.description}
      核心功能: ${info.features}
      风格: ${info.style}
    `;

    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_OUTLINE,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            titleSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            hook: { type: Type.STRING },
            mainPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            imagePrompts: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["titleSuggestions", "hook", "mainPoints", "imagePrompts"],
        },
      },
    });

    /* Fix: Directly access .text property from GenerateContentResponse */
    return JSON.parse(response.text || '{}');
  }

  async generateFullNote(outline: NoteOutline, info: ProductInfo): Promise<{ title: string; content: string; tags: string[] }> {
    const prompt = `
      基于以下大纲生成完整文案：
      大纲: ${JSON.stringify(outline)}
      基础信息: ${JSON.stringify(info)}
    `;

    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_NOTE,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["title", "content", "tags"],
        },
      },
    });

    /* Fix: Directly access .text property from GenerateContentResponse */
    return JSON.parse(response.text || '{}');
  }

  async generateImage(imagePrompt: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `High quality Xiaohongshu style aesthetic photo: ${imagePrompt}` }],
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4",
        },
      },
    });

    /* Fix: Iterate through all parts to find the image part as per guidelines */
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Failed to generate image");
  }
}

export const geminiService = new GeminiService();
