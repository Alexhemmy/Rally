import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate, optionalAuth, requireRole } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

// RIV — Rivalries: documented, sourced rivalries are always available;
// interactive face-offs require BOTH Favorites to opt in (RIV-1).
// Minors are blocked from face-off voting (RIV-5).
export const rivalriesRouter = Router();

async function favoriteOwner(userId: string) {
  return prisma.favoriteProfile.findUnique({ where: { userId } });
}

async function pairKey(a: string, b: string) {
  return [a, b].sort().join('|');
}

// Public: browse rivalries with recent face-offs
rivalriesRouter.get('/', async (_req, res, next) => {
  try {
    const rivalries = await prisma.rivalry.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
    const ids = rivalries.map((r) => r.id);
    const faceOffs = ids.length
      ? await prisma.faceOff.findMany({
          where: { rivalryId: { in: ids }, status: 'open' },
          orderBy: { closesAt: 'asc' },
        })
      : [];
    const favIds = rivalries.flatMap((r) => [r.favoriteAId, r.favoriteBId]);
    const favs = await prisma.favoriteProfile.findMany({
      where: { id: { in: favIds } },
      select: { id: true, user: { select: { displayName: true } } },
    });
    const favById = new Map(favs.map((f) => [f.id, f.user.displayName]));
    res.json({
      rivalries: rivalries.map((r) => ({
        id: r.id,
        favoriteA: { id: r.favoriteAId, name: favById.get(r.favoriteAId) ?? null },
        favoriteB: { id: r.favoriteBId, name: favById.get(r.favoriteBId) ?? null },
        status: r.status,
        heatLevel: r.heatLevel,
        summary: r.summary,
        optInA: r.optInA,
        optInB: r.optInB,
        faceOffs: faceOffs
          .filter((f) => f.rivalryId === r.id)
          .map((f) => ({
            id: f.id,
            question: f.question,
            favoriteAId: f.favoriteAId,
            favoriteBId: f.favoriteBId,
            votesA: f.votesA,
            votesB: f.votesB,
            closesAt: f.closesAt,
          })),
      })),
    });
  } catch (err) { next(err); }
});
// Admin: document a sourced rivalry (RIV-2: sourced, no fabrication)
// Public: browse rivalries with recent face-offs
rivalriesRouter.get('/', async (_req, res, next) => {
  try {
    const rivalries = await prisma.rivalry.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
    const ids = rivalries.map((r) => r.id);
    const faceOffs = ids.length
      ? await prisma.faceOff.findMany({
          where: { rivalryId: { in: ids }, status: 'open' },
          orderBy: { closesAt: 'asc' },
        })
      : [];
    const favIds = rivalries.flatMap((r) => [r.favoriteAId, r.favoriteBId]);
    const favs = await prisma.favoriteProfile.findMany({
      where: { id: { in: favIds } },
      select: { id: true, user: { select: { displayName: true } } },
    });
    const favById = new Map(favs.map((f) => [f.id, f.user.displayName]));
    res.json({
      rivalries: rivalries.map((r) => ({
        id: r.id,
        favoriteA: { id: r.favoriteAId, name: favById.get(r.favoriteAId) ?? null },
        favoriteB: { id: r.favoriteBId, name: favById.get(r.favoriteBId) ?? null },
        status: r.status,
        heatLevel: r.heatLevel,
        summary: r.summary,
        optInA: r.optInA,
        optInB: r.optInB,
        faceOffs: faceOffs
          .filter((f) => f.rivalryId === r.id)
          .map((f) => ({
            id: f.id,
            question: f.question,
            favoriteAId: f.favoriteAId,
            favoriteBId: f.favoriteBId,
            votesA: f.votesA,
            votesB: f.votesB,
            closesAt: f.closesAt,
          })),
      })),
    });
  } catch (err) { next(err); }
});
rivalriesRouter.post('/document', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const data = z.object({
      favoriteAId: z.string().uuid(),
      favoriteBId: z.string().uuid(),
      summary: z.string().min(10).max(1000),
      sources: z.array(z.string().url()).min(1).max(10),
    }).parse(req.body);
    if (data.favoriteAId === data.favoriteBId) throw new AppError('A Favorite cannot rival themselves');

    const [a, b] = await Promise.all([
      prisma.favoriteProfile.findUnique({ where: { id: data.favoriteAId } }),
      prisma.favoriteProfile.findUnique({ where: { id: data.favoriteBId } }),
    ]);
    if (!a || !b) throw new AppError('Favorite not found', 404);

    // Normalize ordering so the pair is unique
    const [x, y] = [data.favoriteAId, data.favoriteBId].sort();
    const existing = await prisma.rivalry.findUnique({
      where: { favoriteAId_favoriteBId: { favoriteAId: x, favoriteBId: y } },
    });
    if (existing) throw new AppError('Rivalry already documented', 409);

    const rivalry = await prisma.rivalry.create({
      data: {
        favoriteAId: x,
        favoriteBId: y,
        status: 'documented',
        summary: data.summary,
        sources: data.sources as any,
        heatLevel: 1,
      },
    });
    res.status(201).json({ rivalry });
  } catch (err) { next(err); }
});

// Favorite opts in to interactive rivalry features (RIV-1)
rivalriesRouter.post('/:id/opt-in', authenticate, async (req, res, next) => {
  try {
    const rivalry = await prisma.rivalry.findUnique({ where: { id: req.params.id } });
    if (!rivalry) throw new AppError('Rivalry not found', 404);
    const fav = await favoriteOwner(req.user!.userId);
    if (!fav || (fav.id !== rivalry.favoriteAId && fav.id !== rivalry.favoriteBId)) {
      throw new AppError('Only a rival in this pairing can opt in', 403);
    }
    const isA = fav.id === rivalry.favoriteAId;
    const optInA = rivalry.optInA || isA;
    const optInB = rivalry.optInB || !isA;
    const bothIn = optInA && optInB;
    const updated = await prisma.rivalry.update({
      where: { id: rivalry.id },
      data: {
        optInA,
        optInB,
        status: bothIn ? 'active' : 'documented',
      },
    });
    res.json({ rivalry: updated, interactive: bothIn });
  } catch (err) { next(err); }
});

// Admin / rivals: set heat level (Beef Radar 1..5, RIV-6)
rivalriesRouter.patch('/:id/heat', authenticate, async (req, res, next) => {
  try {
    const data = z.object({ heatLevel: z.number().int().min(1).max(5) }).parse(req.body);
    const rivalry = await prisma.rivalry.findUnique({ where: { id: req.params.id } });
    if (!rivalry) throw new AppError('Rivalry not found', 404);
    const isAdmin = req.user!.roles.includes('ADMIN');
    const fav = await favoriteOwner(req.user!.userId);
    const isRival = fav && (fav.id === rivalry.favoriteAId || fav.id === rivalry.favoriteBId);
    if (!isAdmin && !isRival) throw new AppError('Not allowed', 403);
    const updated = await prisma.rivalry.update({
      where: { id: rivalry.id },
      data: { heatLevel: data.heatLevel },
    });
    res.json({ rivalry: updated });
  } catch (err) { next(err); }
});

// Create a Face-Off (requires both opted in — RIV-1)
rivalriesRouter.post('/:id/faceoffs', authenticate, async (req, res, next) => {
  try {
    const data = z.object({
      question: z.string().min(5).max(200),
      closesInHours: z.number().int().min(1).max(168).default(24),
    }).parse(req.body);
    const rivalry = await prisma.rivalry.findUnique({ where: { id: req.params.id } });
    if (!rivalry) throw new AppError('Rivalry not found', 404);
    const fav = await favoriteOwner(req.user!.userId);
    if (!fav) throw new AppError('Only Favorites can create face-offs', 403);
    const isRival = fav.id === rivalry.favoriteAId || fav.id === rivalry.favoriteBId;
    const isAdmin = req.user!.roles.includes('ADMIN');
    if (!isRival && !isAdmin) throw new AppError('Only a rival can create a face-off', 403);
    if (!rivalry.optInA || !rivalry.optInB) {
      throw new AppError('Both Favorites must opt in for interactive rivalry features', 403);
    }

    const faceOff = await prisma.faceOff.create({
      data: {
        rivalryId: rivalry.id,
        favoriteAId: rivalry.favoriteAId,
        favoriteBId: rivalry.favoriteBId,
        question: data.question,
        closesAt: new Date(Date.now() + data.closesInHours * 3600 * 1000),
      },
    });
    res.status(201).json({ faceOff });
  } catch (err) { next(err); }
});

// Vote in a face-off (one vote per user, minors blocked — RIV-5)
rivalriesRouter.post('/faceoffs/:id/vote', authenticate, async (req, res, next) => {
  try {
    const data = z.object({ side: z.enum(['A', 'B']) }).parse(req.body);
    const faceOff = await prisma.faceOff.findUnique({ where: { id: req.params.id } });
    if (!faceOff) throw new AppError('Face-off not found', 404);
    if (faceOff.status !== 'open') throw new AppError('Face-off is closed', 409);
    if (faceOff.closesAt.getTime() < Date.now()) {
      await prisma.faceOff.update({ where: { id: faceOff.id }, data: { status: 'closed' } });
      throw new AppError('Face-off is closed', 409);
    }
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (user?.isMinor) throw new AppError('Face-offs are not available for under-18 accounts', 403);

    // One vote per user: stored as an idempotent row via Reaction-style check
    const key = 'faceoff:' + faceOff.id;
    const existing = await prisma.notification.findFirst({
      where: { userId: user!.id, type: key },
    });
    if (existing) throw new AppError('You already voted in this face-off', 409);
    await prisma.notification.create({
      data: { userId: user!.id, type: key, title: 'vote' },
    });

    const updated = await prisma.faceOff.update({
      where: { id: faceOff.id },
      data: data.side === 'A' ? { votesA: { increment: 1 } } : { votesB: { increment: 1 } },
    });
    res.json({ faceOff: { id: updated.id, votesA: updated.votesA, votesB: updated.votesB } });
  } catch (err) { next(err); }
});

// Close a face-off early (rival or admin)
rivalriesRouter.post('/faceoffs/:id/close', authenticate, async (req, res, next) => {
  try {
    const faceOff = await prisma.faceOff.findUnique({ where: { id: req.params.id } });
    if (!faceOff) throw new AppError('Face-off not found', 404);
    if (faceOff.status !== 'open') throw new AppError('Face-off already closed', 409);
    const isAdmin = req.user!.roles.includes('ADMIN');
    const fav = await favoriteOwner(req.user!.userId);
    const isRival = fav && (fav.id === faceOff.favoriteAId || fav.id === faceOff.favoriteBId);
    if (!isAdmin && !isRival) throw new AppError('Not allowed', 403);
    const updated = await prisma.faceOff.update({ where: { id: faceOff.id }, data: { status: 'closed' } });
    res.json({ faceOff: updated });
  } catch (err) { next(err); }
});

// Public: rivalry + face-offs for a pair / list for a Favorite
rivalriesRouter.get('/favorite/:favoriteId', async (req, res, next) => {
  try {
    const rivalries = await prisma.rivalry.findMany({
      where: { OR: [{ favoriteAId: req.params.favoriteId }, { favoriteBId: req.params.favoriteId }] },
    });
    const ids = rivalries.map((r) => r.id);
    const faceOffs = ids.length
      ? await prisma.faceOff.findMany({ where: { rivalryId: { in: ids } }, orderBy: { createdAt: 'desc' } })
      : [];
    res.json({
      rivalries: rivalries.map((r) => ({
        ...r,
        faceOffs: faceOffs.filter((f) => f.rivalryId === r.id),
      })),
    });
  } catch (err) { next(err); }
});
