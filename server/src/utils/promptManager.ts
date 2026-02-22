// server/src/utils/promptManager.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PromptManager {
    /**
     * 从数据库获取指定 slug 的提示词内容，带变量注入
     */
    static async getPrompt(slug: string, variables: Record<string, any>): Promise<string> {
        const prompt = await prisma.systemPrompt.findUnique({
            where: { slug, isActive: true }
        });

        if (!prompt) {
            console.warn(`[PromptManager] 未找到或未激活提示词: ${slug}`);
            return '';
        }

        // 执行变量替换，例如 {topic} -> 用户输入
        return prompt.content.replace(/{(\w+)}/g, (_: string, key: string) => {
            return variables[key] !== undefined ? String(variables[key]) : `{${key}}`;
        });
    }

    /**
     * 专门用于解析提示词文件中的 <page> 标签（用于大纲）
     */
    static parseTaggedPages(content: string): any[] {
        const pages = content.split('<page>').map(p => p.trim()).filter(Boolean);
        return pages.map((p, index) => {
            const lines = p.split('\n');
            const typeLine = lines[0].trim();
            const type = typeLine.includes('封面') ? 'cover' : (typeLine.includes('总结') ? 'summary' : 'content');

            return {
                pageNumber: index + 1,
                type,
                title: lines.find(l => l.includes('标题：'))?.replace('标题：', '').trim() || '',
                content: lines.slice(1).join('\n').trim(),
                imagePrompt: lines.find(l => l.includes('背景：') || l.includes('配图建议：'))?.replace(/背景：|配图建议：/, '').trim() || ''
            };
        });
    }
}
