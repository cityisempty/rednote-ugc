// server/src/services/nanoBananaProvider.ts
import axios from 'axios';
import { ProductInfo, NoteOutline, GenerateNoteResponse } from '../../../shared/types/index';
import { AIProvider } from './aiProvider';
import { PromptManager } from '../utils/promptManager';

export class NanoBananaProvider implements AIProvider {
    private apiKey: string;
    private baseURL: string;

    constructor(apiKey?: string, baseURL?: string) {
        this.apiKey = apiKey || 'sk-d616be08c6c04d59b9774a869449576e';
        this.baseURL = baseURL || 'https://grsai.dakka.com.cn';
    }

    async generateOutline(info: ProductInfo & { pageCount?: number }): Promise<NoteOutline> {
        throw new Error('NanoBanana only supports image generation');
    }

    async generateFullNote(outline: NoteOutline, info: ProductInfo): Promise<GenerateNoteResponse> {
        throw new Error('NanoBanana only supports image generation');
    }

    async generateImage(prompt: string): Promise<string> {
        // 从数据库获取生图配置，如果没有则使用带视觉标签的默认 Prompt
        let enhancedPrompt = await PromptManager.getPrompt('image-default', { page_content: prompt, page_type: '内容' });

        if (!enhancedPrompt) {
            enhancedPrompt = `High quality Xiaohongshu style, aesthetic, professional photography, 3d render, soft lighting, vibrant colors, ${prompt}`;
        }

        const payload = {
            model: 'nano-banana-fast',
            prompt: enhancedPrompt,
            aspectRatio: 'auto',
            imageSize: '1K',
            urls: [],
            webHook: '',
            shutProgress: false
        };

        try {
            console.log(`正在通过 ${this.baseURL} 生成图片...`);
            const response = await axios.post(
                `${this.baseURL}/v1/draw/nano-banana`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`
                    },
                    timeout: 120000,
                    responseType: 'arraybuffer'
                }
            );

            const contentType = response.headers['content-type'] || '';
            if (contentType.includes('image')) {
                const base64 = Buffer.from(response.data).toString('base64');
                return `data:${contentType};base64,${base64}`;
            }

            const rawText = Buffer.from(response.data).toString('utf8');
            console.log(`[NanoBanana] 响应内容: ${rawText.substring(0, 300)}`);

            // 智能解析逻辑
            let data: any = null;
            try {
                data = JSON.parse(rawText);
            } catch (e) {
                // 处理 SSE 或多行格式
                const lines = rawText.split('\n');
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('data:')) {
                        try {
                            const parsed = JSON.parse(trimmed.replace('data:', '').trim());
                            if (parsed.results?.[0]?.url || parsed.url || parsed.status === 'succeeded') {
                                data = parsed;
                                break;
                            }
                        } catch (innerE) { }
                    }
                }
            }

            if (data) {
                const imageUrl = data.url ||
                    (data.data && data.data[0]?.url) ||
                    (data.images && data.images[0]) ||
                    (data.results && data.results[0]?.url);

                if (imageUrl) {
                    console.log(`[NanoBanana] 成功提取: ${imageUrl}`);
                    return imageUrl;
                }

                if (data.status === 'failed') {
                    throw new Error(`生成失败: ${data.error || data.failure_reason}`);
                }
            }

            // 最后的正则匹配
            const match = rawText.match(/https?:\/\/[^\s"']+\.(?:png|jpg|jpeg|webp)/i);
            if (match) return match[0];

            throw new Error('无法从响应中解析图片路径');
        } catch (error: any) {
            const errorData = error.response?.data ? Buffer.from(error.response.data).toString('utf8') : error.message;
            console.error('NanoBanana 接口调用失败:', errorData);
            throw new Error(`NanoBanana 生图失败: ${error.message}`);
        }
    }

    async analyzeNote(content: string): Promise<unknown> {
        throw new Error('NanoBanana only supports image generation');
    }
}
