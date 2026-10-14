import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const payoutsRouter = Router();

payoutsRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    const profile = await prisma.favoriteProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) throw new AppError('Favorite profile required', 403);
    const payouts = await prisma.payout.findMany({
      where: { favoriteId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({
      balance: { available: profile.giftPointsBalance, pending: profile.pendingGiftPoints },
      payouts,
    });
  } catch (e) {
    next(e);
  }
});

payoutsRouter.post('/request', authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      amount: z.number().positive(),
      method: z.enum(['bank', 'mobile_money', 'paypal']).default('bank'),
      destination: z.string().min(3),
      onDemand: z.boolean().default(false),
    });
    const data = schema.parse(req.body);
    const profile = await prisma.favoriteProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) throw new AppError('Favorite profile required', 403);
    if (profile.verificationStatus !== 'VERIFIED') {
      throw new AppError('Complete KYC verification before payouts', 403);
    }
    const available = Number(profile.giftPointsBalance);
    if (data.amount > available) throw new AppError('Insufficient Gift Points', 402);

    const fee = data.onDemand ? data.amount * 0.02 : 0;
    const payout = await prisma.$transaction(async (tx) => {
      await tx.favoriteProfile.update({
        where: { id: profile.id },
        data: {
          giftPointsBalance: { decrement: data.amount },
          pendingGiftPoints: { increment: data.amount - fee },
        },
      });
      return tx.payout.create({
        data: {
          favoriteId: profile.id,
          amount: data.amount - fee,
          currency: 'USD',
          method: data.method,
          destination: { value: data.destination },
          status: 'pending',
          fee,
          isOnDemand: data.onDemand,
        },
      });
    });
    res.status(201).json({ payout });
  } catch (e) {
    next(e);
  }
});
