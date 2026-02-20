import { Response } from 'express';
import prisma from '../utils/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const getNotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;

    const where = { userId: req.user!.userId, ...(status ? { status: status as 'DRAFT' | 'COMPLETED' | 'ARCHIVED' } : {}) };
    const [notes, total] = await Promise.all([
      prisma.note.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.note.count({ where }),
    ]);

    sendSuccess(res, { items: notes, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e: unknown) { sendError(res, (e as Error).message, 400); }
};

export const getNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const note = await prisma.note.findFirst({ where: { id: req.params.id, userId: req.user!.userId } });
    if (!note) { sendError(res, '笔记不存在', 404); return; }
    sendSuccess(res, note);
  } catch (e: unknown) { sendError(res, (e as Error).message, 400); }
};

export const updateNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const note = await prisma.note.findFirst({ where: { id: req.params.id, userId: req.user!.userId } });
    if (!note) { sendError(res, '笔记不存在', 404); return; }

    const { title, content, tags, status } = req.body;
    const updated = await prisma.note.update({
      where: { id: req.params.id },
      data: { ...(title && { title }), ...(content && { content }), ...(tags && { tags }), ...(status && { status }) },
    });
    sendSuccess(res, updated);
  } catch (e: unknown) { sendError(res, (e as Error).message, 400); }
};

export const deleteNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const note = await prisma.note.findFirst({ where: { id: req.params.id, userId: req.user!.userId } });
    if (!note) { sendError(res, '笔记不存在', 404); return; }
    await prisma.note.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, '笔记已删除');
  } catch (e: unknown) { sendError(res, (e as Error).message, 400); }
};
