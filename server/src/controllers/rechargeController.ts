import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { RechargeService } from '../services/rechargeService';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

const rechargeService = new RechargeService();

export const redeemValidation = [
  body('code').notEmpty().toUpperCase().withMessage('请输入充值卡码'),
];

export const redeem = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { sendError(res, errors.array()[0].msg, 400); return; }
  try {
    const result = await rechargeService.redeemCard(req.user!.userId, req.body);
    sendSuccess(res, result, '充值成功');
  } catch (e: unknown) { sendError(res, (e as Error).message, 400); }
};

export const generateCards = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { count = 1, credits, expiresAt } = req.body;
    if (!credits || credits < 1) { sendError(res, 'credits 必须大于0', 400); return; }
    if (count < 1 || count > 100) { sendError(res, 'count 必须在1-100之间', 400); return; }
    const cards = await rechargeService.generateCards(count, credits, expiresAt ? new Date(expiresAt) : undefined);
    sendSuccess(res, { cards }, `成功生成 ${cards.length} 张充值卡`, 201);
  } catch (e: unknown) { sendError(res, (e as Error).message, 400); }
};

export const listCards = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const used = req.query.used === 'true' ? true : req.query.used === 'false' ? false : undefined;
    const result = await rechargeService.listCards(page, limit, used);
    sendSuccess(res, result);
  } catch (e: unknown) { sendError(res, (e as Error).message, 400); }
};

export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId: req.user!.userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where: { userId: req.user!.userId } }),
    ]);
    sendSuccess(res, { items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e: unknown) { sendError(res, (e as Error).message, 400); }
};
