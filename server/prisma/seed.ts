// server/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function loadPrompt(filename: string): string {
    const filePath = path.join(__dirname, '..', 'src', 'prompts', filename);
    return fs.readFileSync(filePath, 'utf-8');
}

async function main() {
    // 1. Create default admin and users
    const adminPassword = await bcrypt.hash('admin123456', 10);
    const userPassword = await bcrypt.hash('test123456', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@test.com' },
        update: {},
        create: {
            email: 'admin@test.com',
            username: 'admin',
            password: adminPassword,
            role: 'ADMIN',
            credits: 10000,
        },
    });

    const user = await prisma.user.upsert({
        where: { email: 'test2@test.com' },
        update: {},
        create: {
            email: 'test2@test.com',
            username: 'test2',
            password: userPassword,
            role: 'USER',
            credits: 1000,
        },
    });

    console.log('Users seeded:', { admin: admin.email, user: user.email });

    // 2. Create initial AI Provider configs based on previous .env settings
    await prisma.aIProviderConfig.createMany({
        data: [
            {
                name: 'Gemini (Default Text)',
                type: 'TEXT',
                provider: 'gemini',
                apiKey: 'AIzaSyDB4Rfj0PfNtepfD3mlrSsabdaSB8y4hzY',
                model: 'gemini-3-flash-preview',
                isActive: true,
            },
            {
                name: 'HYB OpenAI (Default Image)',
                type: 'IMAGE',
                provider: 'openai',
                apiKey: 'sk-BGbQjf5oJPQjZ1H_DZnXJbY8WSljSr1myqJxNzAodmZzpcvzvXDjjpbtPa0',
                baseUrl: 'https://ai.hybgzs.com/v1',
                model: 'hyb-Optimal/Business/gemini-3-pro-image-preview',
                isActive: true,
            }
        ],
        skipDuplicates: true,
    });

    console.log('AI Providers seeded');

    // 3. Seed SystemPrompt records from prompt files
    const prompts = [
        {
            slug: 'outline-default',
            name: '大纲生成提示词',
            content: loadPrompt('outline_prompt.txt'),
            type: 'TEXT' as const,
        },
        {
            slug: 'content-default',
            name: '文案生成提示词',
            content: loadPrompt('content_prompt.txt'),
            type: 'TEXT' as const,
        },
        {
            slug: 'image-default',
            name: '图片生成提示词（完整版）',
            content: loadPrompt('image_prompt.txt'),
            type: 'IMAGE' as const,
        },
        {
            slug: 'image-short',
            name: '图片生成提示词（精简版）',
            content: loadPrompt('image_prompt_short.txt'),
            type: 'IMAGE' as const,
        },
    ];

    for (const p of prompts) {
        await prisma.systemPrompt.upsert({
            where: { slug: p.slug },
            update: { content: p.content },
            create: {
                slug: p.slug,
                name: p.name,
                content: p.content,
                type: p.type,
                isActive: true,
            },
        });
    }

    console.log('System Prompts seeded:', prompts.map(p => p.slug));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
