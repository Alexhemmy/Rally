import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, optionalAuth } from '../middleware/auth';

export const feedRouter = Router();

// Home feed: Moments from followed Favorites
feedRouter.get('/home', authenticate, async (req, res, next) => {
  try {
    const follows = await prisma.follow.findMany({
      where: { followerId: req.user!.userId },
      select: { followingId: true },
    });
    const followingIds = follows.map((f) => f.followingId);

    const favoriteProfiles = await prisma.favoriteProfile.findMany({
      where: { userId: { in: followingIds }, isPublished: true },
      select: { id: true },
    });
    const favoriteIds = favoriteProfiles.map((p) => p.id);

    const moments = await prisma.moment.findMany({
      where: {
        favoriteId: { in: favoriteIds },
        isApproved: true,
        visibility: 'PUBLIC',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
      take: 40,
      include: {
        favorite: {
          include: {
            user: {
              select: { handle: true, displayName: true, avatarUrl: true },
            },
          },
        },
      },
    });

    res.json({ moments });
  } catch (err) {
    next(err);
  }
});

// Chronological toggle supported via query
feedRouter.get('/home/chrono', authenticate, async (req, res, next) => {
  try {
    // Same as home but always pure chronological (already is for MVP)
    req.url = '/home';
    return (feedRouter as any).handle(req, res, next);
  } catch (err) {
    next(err);
  }
});
