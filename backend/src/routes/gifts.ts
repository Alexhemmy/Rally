import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate, optionalAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const giftsRouter = Router();

// Platform gift catalog
giftsRouter.get('/catalog', async (req, res, next) => {
  try {
    const type = req.query.type as string | undefined;
    const items = await prisma.giftCatalogItem.findMany({
      where: {
        isActive: true,
        favoriteId: null, // platform gifts only
        ...(type ? { type } : {}),
      },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

// Send a gift to a Favorite
giftsRouter.post('/send', authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      favoriteHandle: z.string(),
      catalogItemId: z.string().uuid(),
      message: z.string().max(280).optional(),
      isAnonymous: z.boolean().default(false),
      momentId: z.string().uuid().optional(),
    });
    const data = schema.parse(req.body);

    const favoriteUser = await prisma.user.findUnique({
      where: { handle: data.favoriteHandle.toLowerCase() },
      include: { favoriteProfile: true },
    });
    if (!favoriteUser?.favoriteProfile) {
      throw new AppError('Favorite not found', 404);
    }

    const catalogItem = await prisma.giftCatalogItem.findUnique({
      where: { id: data.catalogItemId },
    });
    if (!catalogItem || !catalogItem.isActive) {
      throw new AppError('Gift not available', 404);
    }

    const wallet = await prisma.tokenWallet.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!wallet || wallet.balance < catalogItem.tokenCost) {
      throw new AppError('Insufficient tokens', 402);
    }

    // Gift Points: target ~60% of token value (configurable later)
    const giftPointsRate = 0.6;
    const giftPoints = catalogItem.tokenCost * giftPointsRate;

    const gift = await prisma.$transaction(async (tx) => {
      await tx.tokenWallet.update({
        where: { userId: req.user!.userId },
        data: { balance: { decrement: catalogItem.tokenCost } },
      });

      const g = await tx.gift.create({
        data: {
          senderId: req.user!.userId,
          receiverId: favoriteUser.id,
          favoriteId: favoriteUser.favoriteProfile!.id,
          catalogItemId: catalogItem.id,
          tokenCost: catalogItem.tokenCost,
          giftPoints,
          message: data.message,
          isAnonymous: data.isAnonymous,
          momentId: data.momentId,
          status: 'completed',
        },
      });

      await tx.favoriteProfile.update({
        where: { id: favoriteUser.favoriteProfile!.id },
        data: {
          giftPointsBalance: { increment: giftPoints },
          supporterCount: { increment: 1 },
        },
      });

      await tx.earning.create({
        data: {
          favoriteId: favoriteUser.favoriteProfile!.id,
          sourceType: 'gift',
          sourceId: g.id,
          amount: giftPoints,
          currency: 'GP',
          status: 'available',
        },
      });

      if (data.momentId) {
        await tx.moment.update({
          where: { id: data.momentId },
          data: { supportCount: { increment: 1 } },
        });
      }

      // Upsert supporter level
      await tx.supporterLevel.upsert({
        where: {
          favoriteId_userId: {
            favoriteId: favoriteUser.favoriteProfile!.id,
            userId: req.user!.userId,
          },
        },
        create: {
          favoriteId: favoriteUser.favoriteProfile!.id,
          userId: req.user!.userId,
          level: 'bronze',
          cumulative: giftPoints,
        },
        update: {
          cumulative: { increment: giftPoints },
        },
      });

      return g;
    });

    // Notify Favorite (fire-and-forget style)
    await prisma.notification.create({
      data: {
        userId: favoriteUser.id,
        type: 'gift_received',
        title: data.isAnonymous
          ? 'Anonymous Fan sent you a gift'
          : `@${req.user!.handle} sent you a gift`,
        body: data.message || undefined,
        data: { giftId: gift.id, tokenCost: catalogItem.tokenCost },
      },
    });

    res.status(201).json({
      gift: {
        id: gift.id,
        tokenCost: gift.tokenCost,
        message: gift.message,
        isAnonymous: gift.isAnonymous,
        createdAt: gift.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});
