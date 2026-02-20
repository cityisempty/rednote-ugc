import prisma from '../utils/prisma';
import { geminiService } from './geminiService';
import { CREDIT_COSTS, ProductInfo, NoteOutline } from '../../../shared/types/index';

async function checkAndDeductCredits(userId: string, cost: number, type: string, description: string, noteId?: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.credits < cost) throw new Error(`积分不足，需要 ${cost} 积分`);

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
  async generateOutline(userId: string, productInfo: ProductInfo) {
    await checkAndDeductCredits(userId, CREDIT_COSTS.GENERATE_OUTLINE, 'GENERATE_OUTLINE', `生成大纲: ${productInfo.name}`);
    return geminiService.generateOutline(productInfo);
  }

  async generateNote(userId: string, outline: NoteOutline, productInfo: ProductInfo) {
    await checkAndDeductCredits(userId, CREDIT_COSTS.GENERATE_NOTE, 'GENERATE_NOTE', `生成笔记: ${productInfo.name}`);
    const noteContent = await geminiService.generateFullNote(outline, productInfo);

    const note = await prisma.note.create({
      data: {
        userId,
        productName: productInfo.name,
        style: productInfo.style,
        title: noteContent.title,
        content: noteContent.content,
        tags: noteContent.tags,
        images: [],
        outline: outline as object,
        status: 'COMPLETED',
        creditsUsed: CREDIT_COSTS.GENERATE_NOTE,
      },
    });

    return note;
  }

  async generateImage(userId: string, prompt: string, noteId?: string) {
    await checkAndDeductCredits(userId, CREDIT_COSTS.GENERATE_IMAGE, 'GENERATE_IMAGE', '生成图片', noteId);
    const imageUrl = await geminiService.generateImage(prompt);

    if (noteId) {
      const note = await prisma.note.findUnique({ where: { id: noteId } });
      if (note) {
        await prisma.note.update({
          where: { id: noteId },
          data: { images: [...note.images, imageUrl] },
        });
      }
    }

    return { imageUrl };
  }

  async analyzeNote(userId: string, noteContent: string) {
    await checkAndDeductCredits(userId, CREDIT_COSTS.ANALYZE_NOTE, 'GENERATE_OUTLINE', '分析笔记模板');
    return geminiService.analyzeNote(noteContent);
  }
}

export const generateService = new GenerateService();
