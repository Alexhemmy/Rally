import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate, optionalAuth, requireRole } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { notify } from '../services/notifications';
import {
  computeRawScores,
  computeComposites,
  normalizeWeights,
  drawWeighted,
  hashSeed,
  scoreBand,
} from '../services/giveaway-engine';

// GVW — Giveaways with non-monetary, provably-fair weighted draw.
export const giveawaysRouter = Router();

const PLATFORM_FEE_RATE = 0.03; // 3% platform fee on top of pool

async function requireFavoriteOwner(favoriteId: string, userId: string, roles: string[]) {
  const fav = await prisma.favoriteProfile.findUnique({ where: { id: favoriteId } });
  if (!fav) throw new AppError('Favorite not found', 404);
  if (fav.userId === userId || roles.includes('ADMIN')) return fav;
  throw new AppError('Only the Favorite can manage this giveaway', 403);
}

// Public: browse announced/drawn giveaways across the platform
giveawaysRouter.get('/', async (req, res, next) => {
  try {
    const status = req.query.status as string | undefined;
    const giveaways = await prisma.giveaway.findMany({
      where: {
        status: status ? status : { in: ['announced', 'drawn', 'paid'] },
      },
      orderBy: { entryClosesAt: 'asc' },
      take: 50,
    });
    const favs = await prisma.favoriteProfile.findMany({
      where: { id: { in: giveaways.map((g) => g.favoriteId) } },
      select: { id: true, user: { select: { displayName: true } } },
    });
    const favById = new Map(favs.map((f) => [f.id, f]));
    res.json({
      giveaways: giveaways.map((g) => ({
        id: g.id,
        favoriteId: g.favoriteId,
        favoriteName: favById.get(g.favoriteId)?.user.displayName ?? null,
        poolAmount: g.poolAmount,
        currency: g.currency,
        winnerCount: g.winnerCount,
        entryOpensAt: g.entryOpensAt,
        entryClosesAt: g.entryClosesAt,
        status: g.status,
        seedHash: g.seedHash,
      })),
    });
  } catch (err) { next(err); }
});
// Create giveaway (draft)
giveawaysRouter.post('/', authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      favoriteId: z.string().uuid(),
      poolAmount: z.number().positive(),
      currency: z.string().length(3).default('USD'),
      winnerCount: z.number().int().min(1).max(100),
      split: z.enum(['equal', 'tiered']).default('equal'),
      weights: z.object({
        activeness: z.number().min(0.2).max(0.5),
        dedication: z.number().min(0.2).max(0.5),
        passion: z.number().min(0.2).max(0.5),
      }).optional(),
      scoreWindowDays: z.number().int().min(7).max(90).default(30),
      entryOpensAt: z.coerce.date(),
      entryClosesAt: z.coerce.date(),
      countryFilter: z.string().optional(),
    });
    const data = schema.parse(req.body);
    if (data.entryClosesAt <= data.entryOpensAt) {
      throw new AppError('Entry close must be after entry open');
    }
    const owningFav = await requireFavoriteOwner(data.favoriteId, req.user!.userId, req.user!.roles);
    if (owningFav.isJunior) throw new AppError('Junior Favorites cannot run giveaways (UPG-7)', 403);

    const fee = data.poolAmount * PLATFORM_FEE_RATE;
    const giveaway = await prisma.giveaway.create({
      data: {
        favoriteId: data.favoriteId,
        poolAmount: data.poolAmount,
        currency: data.currency,
        winnerCount: data.winnerCount,
        split: data.split,
        weights: (data.weights ?? null) as any,
        scoreWindowDays: data.scoreWindowDays,
        entryOpensAt: data.entryOpensAt,
        entryClosesAt: data.entryClosesAt,
        fee,
        countryFilter: data.countryFilter,
        status: 'draft',
      },
    });
    res.status(201).json({ giveaway });
  } catch (err) { next(err); }
});

// Fund from Gift Points balance (atomic)
giveawaysRouter.post('/:id/fund', authenticate, async (req, res, next) => {
  try {
    const giveaway = await prisma.giveaway.findUnique({ where: { id: req.params.id } });
    if (!giveaway) throw new AppError('Giveaway not found', 404);
    await requireFavoriteOwner(giveaway.favoriteId, req.user!.userId, req.user!.roles);
    if (giveaway.status !== 'draft') throw new AppError('Giveaway already funded or closed', 409);

    const total = giveaway.poolAmount.add(giveaway.fee);
    const updated = await prisma.$transaction(async (tx) => {
      const debited = await tx.favoriteProfile.updateMany({
        where: { id: giveaway.favoriteId, giftPointsBalance: { gte: total } },
        data: { giftPointsBalance: { decrement: total } },
      });
      if (debited.count === 0) throw new AppError('Insufficient Gift Points (pool + 3% fee)', 402);
      return tx.giveaway.update({ where: { id: giveaway.id }, data: { status: 'funded' } });
    });
    res.json({ giveaway: updated });
  } catch (err) { next(err); }
});

// Announce: commit to seedHash (provable fairness, GVW-6)
giveawaysRouter.post('/:id/announce', authenticate, async (req, res, next) => {
  try {
    const giveaway = await prisma.giveaway.findUnique({ where: { id: req.params.id } });
    if (!giveaway) throw new AppError('Giveaway not found', 404);
    await requireFavoriteOwner(giveaway.favoriteId, req.user!.userId, req.user!.roles);
    if (giveaway.status !== 'funded') throw new AppError('Fund the giveaway before announcing', 409);

    // Server secret seed committed via hash; revealed only at draw.
    const seed = crypto.randomBytes(32).toString('hex');
    const publicRandom = crypto.randomBytes(16).toString('hex');
    const updated = await prisma.giveaway.update({
      where: { id: giveaway.id },
      data: { status: 'announced', seedHash: hashSeed(seed), publicRandom },
    });
    // NOTE: seed itself must persist server-side until draw. Encrypted-at-rest
    // storage (e.g. vault) is a deployment concern; dev keeps it on the record via
    // seedRevealed at draw time. We transiently stash it in memory of the process:
    (globalThis as any).__gvwSeeds = (globalThis as any).__gvwSeeds || {};
    (globalThis as any).__gvwSeeds[giveaway.id] = seed;
    res.json({ giveaway: { ...updated, seedHash: updated.seedHash } });
  } catch (err) { next(err); }
});

// Enter (eligibility: GVW-2)
giveawaysRouter.post('/:id/enter', authenticate, async (req, res, next) => {
  try {
    const giveaway = await prisma.giveaway.findUnique({ where: { id: req.params.id } });
    if (!giveaway) throw new AppError('Giveaway not found', 404);
    const now = new Date();
    if (!['funded', 'announced'].includes(giveaway.status)) throw new AppError('Giveaway not open for entries', 409);
    if (now < giveaway.entryOpensAt || now > giveaway.entryClosesAt) throw new AppError('Outside entry window', 409);

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) throw new AppError('Authentication required', 401);
    const DAY = 86400000;
    if (now.getTime() - user.createdAt.getTime() < 14 * DAY) {
      throw new AppError('Account must be at least 14 days old to enter', 403);
    }
    if (user.isMinor) throw new AppError('Under-18 accounts cannot enter giveaways', 403);
    if (user.countryCode && giveaway.countryFilter && user.countryCode !== giveaway.countryFilter) {
      throw new AppError('Giveaway not available in your country', 403);
    }

    const fav = await prisma.favoriteProfile.findUnique({ where: { id: giveaway.favoriteId } });
    if (!fav) throw new AppError('Favorite not found', 404);
    if (fav.userId === user.id) throw new AppError('Favorites cannot enter their own giveaway', 403);

    const follow = await prisma.follow.findFirst({
      where: { followerId: user.id, followingId: fav.userId },
    });
    if (!follow || now.getTime() - follow.createdAt.getTime() < 7 * DAY) {
      throw new AppError('Follow this Favorite for at least 7 days to enter', 403);
    }

    const linked = await prisma.teamMember.findFirst({
      where: { favoriteId: giveaway.favoriteId, userId: user.id },
    });
    if (linked) throw new AppError('Linked accounts cannot enter this giveaway', 403);

    const entry = await prisma.giveawayEntry.upsert({
      where: { giveawayId_userId: { giveawayId: giveaway.id, userId: user.id } },
      create: { giveawayId: giveaway.id, userId: user.id },
      update: { withdrawnAt: null },
    });
    res.status(201).json({ entry: { id: entry.id, enteredAt: entry.enteredAt } });
  } catch (err) { next(err); }
});

// Withdraw entry
giveawaysRouter.post('/:id/withdraw', authenticate, async (req, res, next) => {
  try {
    const updated = await prisma.giveawayEntry.updateMany({
      where: { giveawayId: req.params.id, userId: req.user!.userId, withdrawnAt: null },
      data: { withdrawnAt: new Date() },
    });
    if (updated.count === 0) throw new AppError('No active entry found', 404);
    res.json({ withdrawn: true });
  } catch (err) { next(err); }
});

// Draw: close, snapshot scores, weighted draw, reveal seed (GVW-3/6)
giveawaysRouter.post('/:id/draw', authenticate, async (req, res, next) => {
  try {
    const giveaway = await prisma.giveaway.findUnique({ where: { id: req.params.id } });
    if (!giveaway) throw new AppError('Giveaway not found', 404);
    await requireFavoriteOwner(giveaway.favoriteId, req.user!.userId, req.user!.roles);
    if (giveaway.status !== 'announced') throw new AppError('Giveaway must be announced before drawing', 409);
    if (new Date() <= giveaway.entryClosesAt) throw new AppError('Entry window still open', 409);

    const entries = await prisma.giveawayEntry.findMany({
      where: { giveawayId: giveaway.id, withdrawnAt: null },
    });
    if (entries.length === 0) {
      const cancelled = await prisma.giveaway.update({
        where: { id: giveaway.id },
        data: { status: 'cancelled' },
      });
      // refund pool to Favorite
      await prisma.favoriteProfile.update({
        where: { id: giveaway.favoriteId },
        data: { giftPointsBalance: { increment: giveaway.poolAmount.add(giveaway.fee) } },
      });
      return res.json({ giveaway: cancelled, refunded: true });
    }

    const fav = await prisma.favoriteProfile.findUnique({ where: { id: giveaway.favoriteId } });
    const raw = new Map<string, any>();
    for (const e of entries) {
      raw.set(e.userId, await computeRawScores(e.userId, giveaway.favoriteId, fav!.userId, giveaway.scoreWindowDays));
    }
    const composites = computeComposites(raw, normalizeWeights(giveaway.weights as any));

    const seed = (globalThis as any).__gvwSeeds?.[giveaway.id];
    const usableSeed = typeof seed === 'string' ? seed : giveaway.seedRevealed || crypto.randomBytes(32).toString('hex');
    const { winners, alternates } = drawWeighted(
      entries.map((e) => ({ userId: e.userId, weight: composites.get(e.userId)?.weight ?? 1 })),
      giveaway.winnerCount,
      usableSeed,
      giveaway.publicRandom || '',
    );

    await prisma.$transaction(async (tx) => {
      for (const e of entries) {
        const comp = composites.get(e.userId);
        const r = raw.get(e.userId);
        await tx.giveawayEntry.update({
          where: { id: e.id },
          data: {
            activenessScore: r?.activeness ?? null,
            dedicationScore: r?.dedication ?? null,
            passionScore: r?.passion ?? null,
            drawWeight: comp?.weight ?? null,
          },
        });
      }
      const rankOf = new Map(winners.map((uid, i) => [uid, i + 1]));
      await tx.giveawayEntry.updateMany({
        where: { giveawayId: giveaway.id, userId: { in: winners } },
        data: { isWinner: true, rank: null },
      });
      for (const [uid, rank] of rankOf) {
        await tx.giveawayEntry.updateMany({
          where: { giveawayId: giveaway.id, userId: uid },
          data: { rank },
        });
      }
      await tx.giveawayEntry.updateMany({
        where: { giveawayId: giveaway.id, userId: { in: alternates } },
        data: { isAlternate: true },
      });
      await tx.giveaway.update({
        where: { id: giveaway.id },
        data: { status: 'drawn', seedRevealed: usableSeed },
      });
    });

    // Notify winners (best-effort)
    for (const uid of winners) {
      await notify({
        userId: uid,
        type: 'giveaway_won',
        title: 'You won a giveaway! 🎉',
        body: 'You were selected as a winner. Check the giveaway results for details.',
        data: { giveawayId: giveaway.id },
      });
    }

    res.json({ drawn: true, winnerCount: winners.length, seedRevealed: usableSeed });
  } catch (err) { next(err); }
});

// Public detail
giveawaysRouter.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const giveaway = await prisma.giveaway.findUnique({ where: { id: req.params.id } });
    if (!giveaway) throw new AppError('Giveaway not found', 404);
    const entryCount = await prisma.giveawayEntry.count({
      where: { giveawayId: giveaway.id, withdrawnAt: null },
    });
    res.json({
      giveaway: {
        id: giveaway.id,
        favoriteId: giveaway.favoriteId,
        poolAmount: giveaway.poolAmount,
        currency: giveaway.currency,
        winnerCount: giveaway.winnerCount,
        split: giveaway.split,
        entryOpensAt: giveaway.entryOpensAt,
        entryClosesAt: giveaway.entryClosesAt,
        status: giveaway.status,
        seedHash: giveaway.seedHash, // committed at announce (GVW-6)
        seedRevealed: ['drawn', 'paid'].includes(giveaway.status) ? giveaway.seedRevealed : null,
        entryCount,
      },
    });
  } catch (err) { next(err); }
});

// Results: winners + entrant's own score band (never exact values — GVW-4/7)
giveawaysRouter.get('/:id/results', optionalAuth, async (req, res, next) => {
  try {
    const giveaway = await prisma.giveaway.findUnique({ where: { id: req.params.id } });
    if (!giveaway) throw new AppError('Giveaway not found', 404);
    if (!['drawn', 'paid'].includes(giveaway.status)) {
      return res.json({ giveaway: { id: giveaway.id, status: giveaway.status }, results: null });
    }

    const winnerEntries = await prisma.giveawayEntry.findMany({
      where: { giveawayId: giveaway.id, isWinner: true },
    });
    const winners = await Promise.all(
      winnerEntries
        .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
        .map(async (e) => {
          const u = await prisma.user.findUnique({ where: { id: e.userId } });
          return {
            rank: e.rank,
            displayName: u?.anonymityDefault ? 'Anonymous Fan' : u?.displayName ?? 'Fan',
            handle: u?.anonymityDefault ? null : u?.handle ?? null,
          };
        }),
    );

    let own: any = null;
    if (req.user) {
      const entry = await prisma.giveawayEntry.findUnique({
        where: { giveawayId_userId: { giveawayId: giveaway.id, userId: req.user.userId } },
      });
      if (entry) {
        // Composite C is not stored; derive the band from draw weight (1+4C).
        const c = entry.drawWeight ? (Number(entry.drawWeight) - 1) / 4 : null;
        own = {
          entered: true,
          isWinner: entry.isWinner,
          isAlternate: entry.isAlternate,
          rank: entry.isWinner ? entry.rank : null, // rank only if they won
          scoreBand: c === null ? null : scoreBand(c),
        };
      }
    }
    res.json({
      giveaway: { id: giveaway.id, status: giveaway.status, split: giveaway.split },
      winners,
      own,
    });
  } catch (err) { next(err); }
});

// List giveaways for a Favorite (public)
giveawaysRouter.get('/favorite/:favoriteId', async (req, res, next) => {
  try {
    const giveaways = await prisma.giveaway.findMany({
      where: { favoriteId: req.params.favoriteId, status: { in: ['announced', 'drawn', 'paid'] } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ giveaways });
  } catch (err) { next(err); }
});
