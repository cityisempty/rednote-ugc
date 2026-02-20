import { Response } from 'express';
import prisma from '../utils/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const getStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalUsers, totalNotes, creditStats, cardStats] = await Promise.all([
      prisma.user.count(),
      prisma.note.count(),
      prisma.transaction.aggregate({ _sum: { amount: true }, where: { amount: { lt: 0 } } }),
      prisma.rechargeCard.groupBy({ by: ['isUsed'], _count: true }),
    ]);

    const cardsGenerated = cardStats.reduce((a, b) => a + b._count, 0);
    const cardsRedeemed = cardStats.find(c => c.isUsed)?._count || 0;

    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, email: true, username: true, role: true, credits: true, createdAt: true, updatedAt: true },
    });

    sendSuccess(res, {
      totalUsers,
      totalNotes,
      totalCreditsUsed: Math.abs(creditStats._sum.amount || 0),
      cardsGenerated,
      cardsRedeemed,
      recentUsers: recentUsers.map(u => ({ ...u, createdAt: u.createdAt.toISOString(), updatedAt: u.updatedAt.toISOString() })),
    });
  } catch (e: unknown) { sendError(res, (e as Error).message, 400); }
};

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: { id: true, email: true, username: true, role: true, credits: true, createdAt: true, updatedAt: true, _count: { select: { notes: true } } },
      }),
      prisma.user.count(),
    ]);

    sendSuccess(res, {
      items: users.map(u => ({ ...u, createdAt: u.createdAt.toISOString(), updatedAt: u.updatedAt.toISOString() })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e: unknown) { sendError(res, (e as Error).message, 400); }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { credits, role } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { ...(credits !== undefined && { credits }), ...(role && { role }) },
      select: { id: true, email: true, username: true, role: true, credits: true, createdAt: true, updatedAt: true },
    });
    sendSuccess(res, { ...user, createdAt: user.createdAt.toISOString(), updatedAt: user.updatedAt.toISOString() });
  } catch (e: unknown) { sendError(res, (e as Error).message, 400); }
};
