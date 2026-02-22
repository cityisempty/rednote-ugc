import prisma from '../utils/prisma';
import { textProvider, imageProvider } from './aiProvider';
import { CREDIT_COSTS, ProductInfo, NoteOutline } from '../../../shared/types/index';
import { saveImageLocally } from '../utils/file';

async function checkCredits(userId: string, cost: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.credits < cost) throw new Error(`积分不足，需要 ${cost} 积分`);
  return user;
}

async function deductCredits(userId: string, cost: number, type: string, description: string, noteId?: string) {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { credits: { decrement: cost } },
  });

  await prisma.transaction.create({
    data: {
      userId,
      type: type as 'GENERATE_OUTLINE' | 'GENERATE_NOTE' | 'GENERATE_IMAGE',
      amount: -cost,
      balance: updatedUser.credits,
      description,
      relatedNoteId: noteId,
    },
  });

  return updatedUser;
}

export class GenerateService {
  async generateOutline(userId: string, data: { name: string; description: string; audience: string; features: string; style: string; pageCount?: number }) {
    await checkCredits(userId, CREDIT_COSTS.GENERATE_OUTLINE);
    const outline = await textProvider.generateOutline(data);
    const updatedUser = await deductCredits(userId, CREDIT_COSTS.GENERATE_OUTLINE, 'GENERATE_OUTLINE', `生成大纲: ${data.name}`);
    return { outline, remainingCredits: updatedUser.credits };
  }

  async generateNote(userId: string, outline: NoteOutline, productInfo: ProductInfo) {
    await checkCredits(userId, CREDIT_COSTS.GENERATE_NOTE);
    const noteContent = await textProvider.generateFullNote(outline, productInfo);
    const updatedUser = await deductCredits(userId, CREDIT_COSTS.GENERATE_NOTE, 'GENERATE_NOTE', `生成笔记: ${productInfo.name}`);

    // 防御性处理：AI 返回结构可能不完整
    const title = noteContent.title || outline.titleSuggestions[0] || productInfo.name;
    const content = noteContent.content || outline.pages.map(p => `${p.title}\n${p.content}`).join('\n\n');
    const tags = noteContent.tags || [];

    const note = await prisma.note.create({
      data: {
        userId,
        productName: productInfo.name,
        style: productInfo.style || '',
        title,
        content,
        tags,
        images: [],
        outline: outline as any,
        status: 'COMPLETED',
        creditsUsed: CREDIT_COSTS.GENERATE_NOTE,
      },
    });

    return { note, remainingCredits: updatedUser.credits };
  }

  async generateImage(userId: string, prompt: string, noteId?: string, pageNumber?: number) {
    const cost = CREDIT_COSTS.BATCH_GENERATE_IMAGES;
    await checkCredits(userId, cost);
    const rawImageUrl = await imageProvider.generateImage(prompt);

    // Save image locally to make it persistent
    const imageUrl = await saveImageLocally(rawImageUrl);

    const updatedUser = await deductCredits(userId, cost, 'GENERATE_IMAGE', `生成图片: ${prompt.substring(0, 20)}...`, noteId);

    if (noteId) {
      const note = await prisma.note.findUnique({ where: { id: noteId } });
      if (note) {
        let updatedOutline = note.outline as any;
        if (pageNumber !== undefined && updatedOutline?.pages) {
          updatedOutline.pages = updatedOutline.pages.map((p: any) =>
            p.pageNumber === pageNumber ? { ...p, imageUrl } : p
          );
        }

        await prisma.note.update({
          where: { id: noteId },
          data: {
            images: [...note.images, imageUrl],
            outline: updatedOutline || note.outline
          },
        });
      }
    }

    return { imageUrl, remainingCredits: updatedUser.credits };
  }

  async analyzeNote(userId: string, noteContent: string) {
    await checkCredits(userId, CREDIT_COSTS.ANALYZE_NOTE);
    const result = await textProvider.analyzeNote(noteContent);
    await deductCredits(userId, CREDIT_COSTS.ANALYZE_NOTE, 'GENERATE_OUTLINE', '分析笔记模板');
    return result;
  }
}

export const generateService = new GenerateService();
