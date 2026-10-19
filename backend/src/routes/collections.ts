import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate, optionalAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

// MOM-5 — Collections: fans organize saved Moments into shareable sets.
export const collectionsRouter = Router();

collectionsRouter.post('/', authenticate, async (req, res, next) => {
  try {
    const data = z.object({
      title: z.string().min(1).max(100),
      isPublic: z.boolean().default(false),
    }).parse(req.body);
    const collection = await prisma.collection.create({
      data: {
        userId: req.user!.userId,
        title: data.title,
        isPublic: data.isPublic,
      },
    });
    res.status(201).json({ collection });
  } catch (err) { next(err); }
});

collectionsRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    const collections = await prisma.collection.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ collections });
  } catch (err) { next(err); }
});

// Add a Moment (must be approved + public, or owned by the collector)
collectionsRouter.post('/:id/moments', authenticate, async (req, res, next) => {
  try {
    const data = z.object({ momentId: z.string().uuid() }).parse(req.body);
    const collection = await prisma.collection.findUnique({ where: { id: req.params.id } });
    if (!collection) throw new AppError('Collection not found', 404);
    if (collection.userId !== req.user!.userId) throw new AppError('Not your collection', 403);

    const moment = await prisma.moment.findUnique({ where: { id: data.momentId } });
    if (!moment || !moment.isApproved || moment.visibility !== 'PUBLIC') {
      throw new AppError('Moment cannot be collected', 404);
    }
    if (collection.momentIds.includes(data.momentId)) {
      return res.json({ collection });
    }
    if (collection.momentIds.length >= 200) throw new AppError('Collection limit reached', 409);

    const updated = await prisma.collection.update({
      where: { id: collection.id },
      data: { momentIds: { push: data.momentId } },
    });
    res.json({ collection: updated });
  } catch (err) { next(err); }
});

collectionsRouter.delete('/:id/moments/:momentId', authenticate, async (req, res, next) => {
  try {
    const collection = await prisma.collection.findUnique({ where: { id: req.params.id } });
    if (!collection) throw new AppError('Collection not found', 404);
    if (collection.userId !== req.user!.userId) throw new AppError('Not your collection', 403);
    const updated = await prisma.collection.update({
      where: { id: collection.id },
      data: { momentIds: collection.momentIds.filter((m) => m !== req.params.momentId) },
    });
    res.json({ collection: updated });
  } catch (err) { next(err); }
});

collectionsRouter.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const data = z.object({
      title: z.string().min(1).max(100).optional(),
      isPublic: z.boolean().optional(),
    }).parse(req.body);
    const collection = await prisma.collection.findUnique({ where: { id: req.params.id } });
    if (!collection) throw new AppError('Collection not found', 404);
    if (collection.userId !== req.user!.userId) throw new AppError('Not your collection', 403);
    const updated = await prisma.collection.update({ where: { id: collection.id }, data });
    res.json({ collection: updated });
  } catch (err) { next(err); }
});

collectionsRouter.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const collection = await prisma.collection.findUnique({ where: { id: req.params.id } });
    if (!collection) throw new AppError('Collection not found', 404);
    if (collection.userId !== req.user!.userId) throw new AppError('Not your collection', 403);
    await prisma.collection.delete({ where: { id: collection.id } });
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

// Public share view
collectionsRouter.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const collection = await prisma.collection.findUnique({ where: { id: req.params.id } });
    if (!collection) throw new AppError('Collection not found', 404);
    if (!collection.isPublic && collection.userId !== req.user?.userId) {
      throw new AppError('Collection is private', 403);
    }
    const moments = collection.momentIds.length
      ? await prisma.moment.findMany({ where: { id: { in: collection.momentIds }, isApproved: true } })
      : [];
    const owner = await prisma.user.findUnique({
      where: { id: collection.userId },
      select: { handle: true, displayName: true },
    });
    res.json({
      collection: {
        id: collection.id,
        title: collection.title,
        isPublic: collection.isPublic,
        owner: owner ? { handle: owner.handle, displayName: owner.displayName } : null,
        moments,
      },
    });
  } catch (err) { next(err); }
});
