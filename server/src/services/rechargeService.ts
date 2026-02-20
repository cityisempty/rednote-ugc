import prisma from '../utils/prisma';
import { RedeemCardRequest, RedeemCardResponse } from '../../../shared/types/index';

export class RechargeService {
  async redeemCard(userId: string, data: RedeemCardRequest): Promise<RedeemCardResponse> {
    const card = await prisma.rechargeCard.findUnique({ where: { code: data.code.toUpperCase() } });
    if (!card) throw new Error('Invalid recharge card code');
    if (card.isUsed) throw new Error('This card has already been used');
    if (card.expiresAt && card.expiresAt < new Date()) throw new Error('This card has expired');

    const result = await prisma.$transaction(async (tx) => {
      await tx.rechargeCard.update({ where: { id: card.id }, data: { isUsed: true } });
      await tx.rechargeCardUsage.create({ data: { cardId: card.id, userId } });

      const user = await tx.user.update({
        where: { id: userId },
        data: { credits: { increment: card.credits } },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: 'RECHARGE',
          amount: card.credits,
          balance: user.credits,
          description: `充值卡兑换: ${data.code.toUpperCase()}`,
          metadata: { cardCode: data.code.toUpperCase() },
        },
      });

      return { credits: card.credits, newBalance: user.credits };
    });

    return result;
  }

  async generateCards(count: number, credits: number, expiresAt?: Date): Promise<string[]> {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = this.generateCode();
      await prisma.rechargeCard.create({ data: { code, credits, expiresAt } });
      codes.push(code);
    }
    return codes;
  }

  async listCards(page: number, limit: number, used?: boolean) {
    const where = used !== undefined ? { isUsed: used } : {};
    const [cards, total] = await Promise.all([
      prisma.rechargeCard.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { usage: { select: { userId: true, usedAt: true } } },
      }),
      prisma.rechargeCard.count({ where }),
    ]);
    return { items: cards, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `REDINK-${segment()}-${segment()}-${segment()}`;
  }
}
