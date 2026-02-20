import { Response } from 'express';
import prisma from '../utils/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const getStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [totalUsers, newUsersThisWeek, totalNotes, creditSpent, rechargeCount] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: oneWeekAgo } } }),
      prisma.note.count(),
      prisma.transaction.aggregate({ _sum: { amount: true }, where: { amount: { lt: 0 } } }),
      prisma.transaction.count({ where: { type: 'RECHARGE' } }),
    ]);

    sendSuccess(res, {
      users: { total: totalUsers, newThisWeek: newUsersThisWeek },
      notes: { total: totalNotes },
      transactions: {
        totalRecharges: rechargeCount,
        totalSpent: Math.abs(creditSpent._sum.amount || 0),
      },
      credits: { totalDistributed: 0 },
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    if (credits !== undefined) data.credits = credits;
    if (role) data.role = role;
    const id = req.params.id as string;
    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, username: true, role: true, credits: true, createdAt: true, updatedAt: true },
    });
    sendSuccess(res, { ...user, createdAt: user.createdAt.toISOString(), updatedAt: user.updatedAt.toISOString() });
  } catch (e: unknown) { sendError(res, (e as Error).message, 400); }
};
