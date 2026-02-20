import { Response } from 'express';
import prisma from '../utils/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const getTemplates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { isPublic: true };
    if (category) where.category = category;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const [templates, total] = await Promise.all([
      prisma.template.findMany({ where, orderBy: [{ isOfficial: 'desc' }, { usageCount: 'desc' }], skip: (page - 1) * limit, take: limit }),
      prisma.template.count({ where }),
    ]);
    sendSuccess(res, { items: templates, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e: unknown) { sendError(res, (e as Error).message, 400); }
};

export const getTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const template = await prisma.template.findFirst({ where: { id, isPublic: true } });
    if (!template) { sendError(res, '模板不存在', 404); return; }

    await prisma.template.update({ where: { id }, data: { usageCount: { increment: 1 } } });
    sendSuccess(res, template);
  } catch (e: unknown) { sendError(res, (e as Error).message, 400); }
};

export const createTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, category, titlePattern, contentStructure, styleGuide, hashtagStrategy } = req.body;
    if (!name || !category || !titlePattern || !contentStructure || !styleGuide) {
      sendError(res, '缺少必要字段', 400); return;
    }

    const template = await prisma.template.create({
      data: { name, description, category, titlePattern, contentStructure, styleGuide, hashtagStrategy: hashtagStrategy || [], createdById: req.user!.userId },
    });
    sendSuccess(res, template, '模板创建成功', 201);
  } catch (e: unknown) { sendError(res, (e as Error).message, 400); }
};
