import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const tokensRouter = Router();

// List available token packs
tokensRouter.get('/packs', async (_req, res, next) => {
  try {
    const packs = await prisma.tokenPack.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ packs });
  } catch (err) {
    next(err);
  }
});

// Purchase tokens (mock payment for MVP)
tokensRouter.post('/purchase', authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      packId: z.string().uuid(),
      paymentMethod: z.enum(['card', 'bank', 'mobile_money', 'wallet']),
      currency: z.string().default('USD'),
    });
    const data = schema.parse(req.body);

    const pack = await prisma.tokenPack.findUnique({ where: { id: data.packId } });
    if (!pack || !pack.isActive) throw new AppError('Pack not found', 404);

    // Mock payment success
    const tokens = pack.tokens + pack.bonusTokens;

    const [purchase] = await prisma.$transaction([
      prisma.tokenPurchase.create({
        data: {
          userId: req.user!.userId,
          packId: pack.id,
          tokens,
          amountCents: pack.priceCents,
          currency: data.currency,
          paymentMethod: data.paymentMethod,
          paymentProvider: 'mock',
          status: 'completed',
        },
      }),
      prisma.tokenWallet.upsert({
        where: { userId: req.user!.userId },
        create: {
          userId: req.user!.userId,
          balance: tokens,
          totalPurchased: tokens,
        },
        update: {
          balance: { increment: tokens },
          totalPurchased: { increment: tokens },
        },
      }),
    ]);

    const wallet = await prisma.tokenWallet.findUnique({
      where: { userId: req.user!.userId },
    });

    res.status(201).json({
      purchase: { id: purchase.id, tokens, status: purchase.status },
      wallet: { balance: wallet?.balance, giftedBalance: wallet?.giftedBalance },
    });
  } catch (err) {
    next(err);
  }
});

// Get own wallet
tokensRouter.get('/wallet', authenticate, async (req, res, next) => {
  try {
    const wallet = await prisma.tokenWallet.findUnique({
      where: { userId: req.user!.userId },
    });
    res.json({
      wallet: wallet || { balance: 0, giftedBalance: 0, totalPurchased: 0 },
    });
  } catch (err) {
    next(err);
  }
});
