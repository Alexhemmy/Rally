import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate, optionalAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

/**
 * GFT-10 — Live audio and video sessions (Phase 3).
 * Real-time Gifts with a live leaderboard and a pause switch:
 * while paused, gifting is blocked for that session.
 */
export const liveRouter = Router();

const GIFT_POINTS_RATE = 0.6; // GFT-4

async function requireOwner(sessionId: string, userId: string, roles: string[]) {
  const session = await prisma.liveSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new AppError('Session not found', 404);
  const fav = await prisma.favoriteProfile.findUnique({ where: { id: session.favoriteId } });
  if (!fav) throw new AppError('Favorite not found', 404);
  const isTeam = await prisma.teamMember.findFirst({
    where: { favoriteId: session.favoriteId, userId, role: 'manager' },
  });
  if (fav.userId !== userId && !isTeam && !roles.includes('ADMIN')) {
    throw new AppError('Only the Favorite or a manager can manage this session', 403);
  }
  return { session, fav };
}

liveRouter.post('/', authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      favoriteId: z.string().uuid(),
      title: z.string().min(3).max(120),
      kind: z.enum(['audio', 'video']).default('audio'),
      streamUrl: z.string().url().optional(),
      startsAt: z.coerce.date().optional(),
    });
    const data = schema.parse(req.body);
    const fav = await prisma.favoriteProfile.findUnique({ where: { id: data.favoriteId } });
    if (!fav) throw new AppError('Favorite not found', 404);
    if (fav.userId !== req.user!.userId && !req.user!.roles.includes('ADMIN')) {
      throw new AppError('Only the Favorite can schedule sessions', 403);
    }
    const session = await prisma.liveSession.create({
      data: {
        favoriteId: data.favoriteId,
        title: data.title,
        kind: data.kind,
        streamUrl: data.streamUrl,
        startsAt: data.startsAt,
        status: 'scheduled',
      },
    });
    res.status(201).json({ session });
  } catch (err) { next(err); }
});

liveRouter.get('/', async (req, res, next) => {
  try {
    const sessions = await prisma.liveSession.findMany({
      where: { status: { in: ['live', 'paused', 'scheduled'] } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ sessions });
  } catch (err) { next(err); }
});

liveRouter.get('/favorite/:favoriteId', async (req, res, next) => {
  try {
    const sessions = await prisma.liveSession.findMany({
      where: { favoriteId: req.params.favoriteId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json({ sessions });
  } catch (err) { next(err); }
});

liveRouter.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const session = await prisma.liveSession.findUnique({ where: { id: req.params.id } });
    if (!session) throw new AppError('Session not found', 404);
    const fav = await prisma.favoriteProfile.findUnique({
      where: { id: session.favoriteId },
      select: { id: true, userId: true },
    });
    const owner = await prisma.user.findUnique({ where: { id: fav!.userId }, select: { displayName: true, handle: true } });
    res.json({ session, favorite: owner });
  } catch (err) { next(err); }
});

liveRouter.post('/:id/start', authenticate, async (req, res, next) => {
  try {
    const { session } = await requireOwner(req.params.id, req.user!.userId, req.user!.roles);
    if (!['scheduled', 'paused'].includes(session.status)) throw new AppError('Session cannot start', 409);
    const updated = await prisma.liveSession.update({
      where: { id: session.id },
      data: { status: 'live', isPaused: false, startedAt: session.startedAt ?? new Date() },
    });
    res.json({ session: updated });
  } catch (err) { next(err); }
});

liveRouter.post('/:id/pause', authenticate, async (req, res, next) => {
  try {
    const { session } = await requireOwner(req.params.id, req.user!.userId, req.user!.roles);
    if (session.status !== 'live') throw new AppError('Session is not live', 409);
    const updated = await prisma.liveSession.update({
      where: { id: session.id },
      data: { status: 'paused', isPaused: true },
    });
    res.json({ session: updated });
  } catch (err) { next(err); }
});

liveRouter.post('/:id/resume', authenticate, async (req, res, next) => {
  try {
    const { session } = await requireOwner(req.params.id, req.user!.userId, req.user!.roles);
    if (session.status !== 'paused') throw new AppError('Session is not paused', 409);
    const updated = await prisma.liveSession.update({
      where: { id: session.id },
      data: { status: 'live', isPaused: false },
    });
    res.json({ session: updated });
  } catch (err) { next(err); }
});

liveRouter.post('/:id/end', authenticate, async (req, res, next) => {
  try {
    const { session } = await requireOwner(req.params.id, req.user!.userId, req.user!.roles);
    if (session.status === 'ended') throw new AppError('Session already ended', 409);
    const updated = await prisma.liveSession.update({
      where: { id: session.id },
      data: { status: 'ended', endedAt: new Date() },
    });
    res.json({ session: updated });
  } catch (err) { next(err); }
});

liveRouter.post('/:id/join', authenticate, async (req, res, next) => {
  try {
    const session = await prisma.liveSession.findUnique({ where: { id: req.params.id } });
    if (!session) throw new AppError('Session not found', 404);
    if (session.status === 'ended') throw new AppError('Session has ended', 409);
    await prisma.liveAttendance.upsert({
      where: { sessionId_userId: { sessionId: session.id, userId: req.user!.userId } },
      create: { sessionId: session.id, userId: req.user!.userId },
      update: {},
    });
    const updated = await prisma.liveSession.update({
      where: { id: session.id },
      data: { viewerCount: { increment: 1 } },
    });
    res.json({ joined: true, viewerCount: updated.viewerCount });
  } catch (err) { next(err); }
});

liveRouter.post('/:id/gift', authenticate, async (req, res, next) => {
  try {
    const schema = z.object({ catalogItemId: z.string().uuid(), message: z.string().max(280).optional() });
    const data = schema.parse(req.body);
    const session = await prisma.liveSession.findUnique({ where: { id: req.params.id } });
    if (!session) throw new AppError('Session not found', 404);
    if (session.isPaused) throw new AppError('Gifting is paused by the host', 409);
    if (session.status !== 'live') throw new AppError('Session is not live', 409);

    const item = await prisma.giftCatalogItem.findUnique({ where: { id: data.catalogItemId } });
    if (!item || !item.isActive) throw new AppError('Gift not found', 404);
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) throw new AppError('Authentication required', 401);
    if (user.isMinor && item.tokenCost > 20) throw new AppError('Spend limit for under-18 accounts', 403);

    const wallet = await prisma.tokenWallet.findUnique({ where: { userId: user.id } });
    if (!wallet || wallet.giftedBalance + wallet.balance < item.tokenCost) {
      throw new AppError('Insufficient Tokens', 402);
    }
    const fromGifted = Math.min(wallet.giftedBalance, item.tokenCost);
    const fromBalance = item.tokenCost - fromGifted;
    const fav = await prisma.favoriteProfile.findUnique({ where: { id: session.favoriteId } });
    if (!fav) throw new AppError('Favorite not found', 404);
    if (fav.userId === user.id) throw new AppError('Self-gifting is blocked (ROL-3)', 403);

    const gift = await prisma.$transaction(async (tx) => {
      const debited = await tx.tokenWallet.updateMany({
        where: { userId: user.id, giftedBalance: { gte: fromGifted }, balance: { gte: fromBalance } },
        data: { giftedBalance: { decrement: fromGifted }, balance: { decrement: fromBalance } },
      });
      if (debited.count === 0) throw new AppError('Insufficient Tokens', 402);
      const giftPoints = item.tokenCost * GIFT_POINTS_RATE;
      await tx.favoriteProfile.update({
        where: { id: fav.id },
        data: { giftPointsBalance: { increment: giftPoints } },
      });
      return tx.gift.create({
        data: {
          senderId: user.id,
          receiverId: fav.userId,
          favoriteId: fav.id,
          catalogItemId: item.id,
          tokenCost: item.tokenCost,
          giftPoints,
          message: data.message,
          sessionId: session.id,
          isAnonymous: user.anonymityDefault,
        },
      });
    });
    res.status(201).json({ gift: { id: gift.id, tokenCost: gift.tokenCost } });
  } catch (err) { next(err); }
});

liveRouter.get('/:id/leaderboard', async (req, res, next) => {
  try {
    const gifts = await prisma.gift.findMany({
      where: { sessionId: req.params.id },
      select: { senderId: true, tokenCost: true },
    });
    const totals = new Map<string, number>();
    for (const g of gifts) totals.set(g.senderId, (totals.get(g.senderId) ?? 0) + g.tokenCost);
    const top = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    const board = await Promise.all(
      top.map(async ([senderId, tokens]) => {
        const u = await prisma.user.findUnique({ where: { id: senderId }, select: { displayName: true, handle: true, anonymityDefault: true } });
        return {
          name: u?.anonymityDefault ? 'Anonymous Fan' : u?.displayName ?? 'Fan',
          handle: u?.anonymityDefault ? null : u?.handle ?? null,
          tokens,
        };
      })
    );
    res.json({ leaderboard: board });
  } catch (err) { next(err); }
});
