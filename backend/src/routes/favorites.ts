import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate, optionalAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const favoritesRouter = Router();

// Public Favorite page
favoritesRouter.get('/:handle', optionalAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { handle: req.params.handle.toLowerCase() },
      include: {
        favoriteProfile: {
          include: {
            category: true,
          },
        },
      },
    });
    if (!user?.favoriteProfile?.isPublished && req.user?.userId !== user?.id) {
      throw new AppError('Favorite not found', 404);
    }
    if (!user?.favoriteProfile) throw new AppError('Not a Favorite', 404);

    const recentGifts = await prisma.gift.findMany({
      where: { favoriteId: user.favoriteProfile.id, status: 'completed', isAnonymous: false },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        sender: { select: { handle: true, displayName: true, avatarUrl: true } },
      },
    });

    const topSupporters = await prisma.supporterLevel.findMany({
      where: { favoriteId: user.favoriteProfile.id },
      orderBy: { cumulative: 'desc' },
      take: 10,
    });

    res.json({
      favorite: {
        id: user.favoriteProfile.id,
        handle: user.handle,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        coverUrl: user.favoriteProfile.coverUrl,
        accentColor: user.favoriteProfile.accentColor,
        supporterCount: user.favoriteProfile.supporterCount,
        verificationStatus: user.favoriteProfile.verificationStatus,
        category: user.favoriteProfile.category,
        specialtyIds: user.favoriteProfile.specialtyIds,
        shortUrl: user.favoriteProfile.shortUrl,
      },
      supporterWall: {
        recent: recentGifts.map((g) => ({
          sender: g.isAnonymous
            ? { handle: 'anonymous', displayName: 'Anonymous Fan' }
            : g.sender,
          message: g.message,
          tokenCost: g.tokenCost,
          createdAt: g.createdAt,
        })),
        top: topSupporters,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Publish / update Favorite profile
favoritesRouter.patch('/me', authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      coverUrl: z.string().url().optional(),
      accentColor: z.string().optional(),
      categoryId: z.string().uuid().optional(),
      specialtyIds: z.array(z.string()).max(4).optional(),
      isPublished: z.boolean().optional(),
      featuredGifts: z.array(z.string()).max(5).optional(),
    });
    const data = schema.parse(req.body);

    const profile = await prisma.favoriteProfile.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!profile) throw new AppError('Favorite profile not found. Apply first.', 404);

    const updated = await prisma.favoriteProfile.update({
      where: { id: profile.id },
      data: {
        ...data,
        shortUrl: data.isPublished && !profile.shortUrl
          ? `r/${req.user!.handle}`
          : undefined,
      },
    });
    res.json({ profile: updated });
  } catch (err) {
    next(err);
  }
});

// Apply to become Favorite
favoritesRouter.post('/apply', authenticate, async (req, res, next) => {
  try {
    const existing = await prisma.favoriteProfile.findUnique({
      where: { userId: req.user!.userId },
    });
    if (existing) throw new AppError('Already has a Favorite profile', 409);

    const schema = z.object({
      categoryId: z.string().uuid().optional(),
      specialtyIds: z.array(z.string()).max(4).optional(),
    });
    const data = schema.parse(req.body);

    const profile = await prisma.favoriteProfile.create({
      data: {
        userId: req.user!.userId,
        categoryId: data.categoryId,
        specialtyIds: data.specialtyIds || [],
        verificationStatus: 'PENDING',
      },
    });

    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { roles: { push: 'FAVORITE' as any } },
    });

    res.status(201).json({ profile });
  } catch (err) {
    next(err);
  }
});

// Earnings dashboard
favoritesRouter.get('/me/earnings', authenticate, async (req, res, next) => {
  try {
    const profile = await prisma.favoriteProfile.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!profile) throw new AppError('Favorite profile required', 403);

    const earnings = await prisma.earning.findMany({
      where: { favoriteId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const payouts = await prisma.payout.findMany({
      where: { favoriteId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({
      balance: {
        available: profile.giftPointsBalance,
        pending: profile.pendingGiftPoints,
      },
      earnings,
      payouts,
    });
  } catch (err) {
    next(err);
  }
});
