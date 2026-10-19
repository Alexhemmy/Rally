import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { optionalAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

// REC-3 — Leaderboards: weekly / monthly / all-time per Favorite.
// Fans with anonymityDefault appear as 'Anonymous Fan' with rank only.
export const leaderboardsRouter = Router();

function periodStart(period: 'weekly' | 'monthly' | 'alltime'): Date | null {
  const now = Date.now();
  if (period === 'weekly') return new Date(now - 7 * 86400000);
  if (period === 'monthly') return new Date(now - 30 * 86400000);
  return null;
}

async function buildBoard(favoriteId: string, period: 'weekly' | 'monthly' | 'alltime', limit = 50) {
  const since = periodStart(period);
  const fav = await prisma.favoriteProfile.findUnique({ where: { id: favoriteId } });
  if (!fav) throw new AppError('Favorite not found', 404);

  // All-time uses SupporterLevel.cumulative; periods use Gift rows.
  let rows: Array<{ userId: string; points: number }> = [];
  if (period === 'alltime') {
    const levels = await prisma.supporterLevel.findMany({
      where: { favoriteId },
      orderBy: { cumulative: 'desc' },
      take: limit,
    });
    rows = levels.map((l) => ({ userId: l.userId, points: Number(l.cumulative) }));
  } else {
    const gifts = await prisma.gift.groupBy({
      by: ['senderId'],
      where: { favoriteId, status: 'completed', ...(since ? { createdAt: { gte: since } } : {}) },
      _sum: { giftPoints: true },
      orderBy: { _sum: { giftPoints: 'desc' } },
      take: limit,
    });
    rows = gifts.map((g) => ({ userId: g.senderId, points: Number(g._sum.giftPoints ?? 0) }));
  }

  const users = await prisma.user.findMany({
    where: { id: { in: rows.map((r) => r.userId) } },
    select: { id: true, handle: true, displayName: true, anonymityDefault: true },
  });
  const userById = new Map(users.map((u) => [u.id, u]));

  return rows.map((r, i) => {
    const u = userById.get(r.userId);
    const anonymous = !u || u.anonymityDefault;
    return {
      rank: i + 1,
      points: r.points,
      // RNK-4 style anonymity: rank-only entry
      displayName: anonymous ? 'Anonymous Fan' : u!.displayName,
      handle: anonymous ? null : u!.handle,
      isAnonymous: anonymous,
    };
  });
}

leaderboardsRouter.get('/:favoriteId', optionalAuth, async (req, res, next) => {
  try {
    const period = (['weekly', 'monthly', 'alltime'] as const).includes(req.query.period as any)
      ? (req.query.period as 'weekly' | 'monthly' | 'alltime')
      : 'weekly';
    const board = await buildBoard(req.params.favoriteId, period);
    res.json({ period, board });
  } catch (err) { next(err); }
});

// My rank on a Favorite's board (rank only, never exact standing of others)
leaderboardsRouter.get('/:favoriteId/me', optionalAuth, async (req, res, next) => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const period = (['weekly', 'monthly', 'alltime'] as const).includes(req.query.period as any)
      ? (req.query.period as 'weekly' | 'monthly' | 'alltime')
      : 'weekly';
    const board = await buildBoard(req.params.favoriteId, period, 1000);
    const mine = board.find((r) => r.handle === req.user!.handle);
    res.json({
      rank: mine ? mine.rank : null,
      points: mine ? mine.points : 0,
      onBoard: Boolean(mine),
    });
  } catch (err) { next(err); }
});
