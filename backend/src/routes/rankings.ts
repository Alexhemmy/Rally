import { Router } from 'express';
import { prisma } from '../utils/prisma';

export const rankingsRouter = Router();

/**
 * Rally Score (simplified): unique supporters + log gifts + recency, soft-capped spend.
 * money does not dominate (PRD).
 */
function rallyScore(input: {
  supporterCount: number;
  giftPoints: number;
  moments: number;
  publishedAt?: Date | null;
}) {
  const unique = Math.log10(1 + input.supporterCount) * 40;
  const gifts = Math.min(Math.log10(1 + Number(input.giftPoints)) * 25, 50); // soft cap
  const content = Math.min(input.moments * 2, 20);
  const ageDays = input.publishedAt
    ? (Date.now() - input.publishedAt.getTime()) / (8640000 * 10)
    : 100;
  const rising = ageDays < 90 ? 15 : 0;
  return Math.round(unique + gifts + content + rising);
}

rankingsRouter.get('/', async (req, res, next) => {
  try {
    const window = (req.query.window as string) || 'all';
    const profiles = await prisma.favoriteProfile.findMany({
      where: { isPublished: true },
      take: 50,
      include: {
        user: { select: { handle: true, displayName: true, avatarUrl: true } },
        _count: { select: { moments: true } },
      },
      orderBy: { supporterCount: 'desc' },
    });

    const ranked = profiles
      .map((p) => ({
        handle: p.user.handle,
        displayName: p.user.displayName,
        avatarUrl: p.user.avatarUrl,
        supporterCount: p.supporterCount,
        score: rallyScore({
          supporterCount: p.supporterCount,
          giftPoints: Number(p.giftPointsBalance),
          moments: p._count.moments,
          publishedAt: p.createdAt,
        }),
        cohort:
          p.supporterCount < 50 ? 'rising' : p.supporterCount < 500 ? 'established' : 'legend',
      }))
      .sort((a, b) => b.score - a.score);

    res.json({ window, rankings: ranked });
  } catch (e) {
    next(e);
  }
});
