import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

/**
 * RNK (Phase 3) — City and region ranking lanes.
 * Monthly lanes of local Favorites, ranked by UNIQUE local supporters
 * (never by spend volume), with snapshot history for movement.
 */
export const cityRankingsRouter = Router();

const DAY = 86400000;
const MONTH = 30 * DAY;

cityRankingsRouter.get('/cities', async (req, res, next) => {
  try {
    const since = new Date(Date.now() - MONTH);
    const supporters = await prisma.user.findMany({
      where: { city: { not: null }, lastActiveAt: { gte: since } },
      select: { city: true },
    });
    const counts = new Map<string, number>();
    for (const u of supporters) counts.set(u.city!, (counts.get(u.city!) ?? 0) + 1);
    const cities = [...counts.entries()]
      .map(([city, activeFans]) => ({ city, activeFans }))
      .sort((a, b) => b.activeFans - a.activeFans)
      .slice(0, 25);
    res.json({ cities });
  } catch (err) { next(err); }
});

cityRankingsRouter.get('/:city', async (req, res, next) => {
  try {
    const city = req.params.city.trim();
    if (city.length < 2) throw new AppError('City required', 400);
    const since = new Date(Date.now() - MONTH);
    const gifts = await prisma.gift.findMany({
      where: { createdAt: { gte: since }, status: 'completed' },
      select: { senderId: true, favoriteId: true },
    });
    const senders = await prisma.user.findMany({
      where: { id: { in: gifts.map((g) => g.senderId) }, city },
      select: { id: true },
    });
    const localSenderIds = new Set(senders.map((s) => s.id));
    const unique = new Map<string, Set<string>>();
    for (const g of gifts) {
      if (!localSenderIds.has(g.senderId)) continue;
      if (!unique.has(g.favoriteId)) unique.set(g.favoriteId, new Set());
      unique.get(g.favoriteId)!.add(g.senderId);
    }
    const ranked = [...unique.entries()]
      .map(([favoriteId, fans]) => ({ favoriteId, score: fans.size }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);

    const favs = await prisma.favoriteProfile.findMany({
      where: { id: { in: ranked.map((r) => r.favoriteId) }, showInRankings: true },
    });
    const favById = new Map(favs.map((f) => [f.id, f]));
    const owners = await prisma.user.findMany({
      where: { id: { in: favs.map((f) => f.userId) } },
      select: { id: true, displayName: true, handle: true },
    });
    const ownerById = new Map(owners.map((o) => [o.id, o]));

    const prevPeriod = new Date(Math.floor(Date.now() / MONTH) * MONTH - MONTH);
    const prev = await prisma.cityRankingSnapshot.findMany({ where: { city, periodStart: prevPeriod } });
    const prevRank = new Map(prev.map((p) => [p.favoriteId, p.rank]));

    const periodStart = new Date(Math.floor(Date.now() / MONTH) * MONTH);
    let rank = 0;
    const lane = ranked
      .filter((r) => favById.has(r.favoriteId))
      .map((r) => {
        rank++;
        const fav = favById.get(r.favoriteId)!;
        const owner = ownerById.get(fav.userId);
        return {
          rank,
          favoriteId: r.favoriteId,
          name: owner?.displayName ?? 'Favorite',
          handle: owner?.handle,
          cohort: fav.cohort,
          uniqueSupporters: r.score,
          movement: prevRank.has(r.favoriteId) ? prevRank.get(r.favoriteId)! - rank : null,
        };
      });
    res.json({ city, periodStart, window: 'monthly', lane });
  } catch (err) { next(err); }
});

cityRankingsRouter.post('/refresh', authenticate, async (req, res, next) => {
  try {
    if (!req.user!.roles.includes('ADMIN')) throw new AppError('Admin only', 403);
    const schema = z.object({ city: z.string().min(2) });
    const { city } = schema.parse(req.body);
    const periodStart = new Date(Math.floor(Date.now() / MONTH) * MONTH);
    const existing = await prisma.cityRankingSnapshot.findFirst({ where: { city, periodStart } });
    if (existing) throw new AppError('Snapshot for this period already exists', 409);

    const since = new Date(periodStart.getTime() - MONTH);
    const gifts = await prisma.gift.findMany({
      where: { createdAt: { gte: since }, status: 'completed' },
      select: { senderId: true, favoriteId: true },
    });
    const senders = await prisma.user.findMany({
      where: { id: { in: gifts.map((g) => g.senderId) }, city },
      select: { id: true },
    });
    const localIds = new Set(senders.map((s) => s.id));
    const unique = new Map<string, Set<string>>();
    for (const g of gifts) {
      if (!localIds.has(g.senderId)) continue;
      if (!unique.has(g.favoriteId)) unique.set(g.favoriteId, new Set());
      unique.get(g.favoriteId)!.add(g.senderId);
    }
    const ranked = [...unique.entries()]
      .map(([favoriteId, fans]) => ({ favoriteId, score: fans.size }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);
    await prisma.$transaction(async (tx) => {
      let rank = 0;
      for (const r of ranked) {
        rank++;
        await tx.cityRankingSnapshot.create({
          data: { city, periodStart, favoriteId: r.favoriteId, rank, score: r.score },
        });
      }
    });
    res.json({ city, periodStart, snapshotted: ranked.length });
  } catch (err) { next(err); }
});
