import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate, optionalAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const momentsRouter = Router();

// Create a Moment (Favorite)
momentsRouter.post('/', authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      title: z.string().min(1).max(120),
      description: z.string().max(1000).optional(),
      mediaUrl: z.string().url().optional(),
      mediaType: z.enum(['image', 'audio', 'video', 'link']).optional(),
      categoryTag: z.string().optional(),
      visibility: z.enum(['PUBLIC', 'FOLLOWERS', 'SUPPORTERS', 'TIER']).default('PUBLIC'),
      isFlash: z.boolean().default(false),
    });
    const data = schema.parse(req.body);

    const profile = await prisma.favoriteProfile.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!profile) throw new AppError('Favorite profile required', 403);

    const moment = await prisma.moment.create({
      data: {
        favoriteId: profile.id,
        authorId: req.user!.userId,
        type: 'FAVORITE',
        title: data.title,
        description: data.description,
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType,
        categoryTag: data.categoryTag,
        visibility: data.visibility as any,
        isFlash: data.isFlash,
        expiresAt: data.isFlash
          ? new Date(Date.now() + 24 * 60 * 60 * 1000)
          : undefined,
      },
    });

    res.status(201).json({ moment });
  } catch (err) {
    next(err);
  }
});

// Get a single Moment
momentsRouter.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const moment = await prisma.moment.findUnique({
      where: { id: req.params.id },
      include: {
        favorite: {
          include: {
            user: {
              select: { handle: true, displayName: true, avatarUrl: true },
            },
          },
        },
        comments: {
          where: { isHidden: false },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });
    if (!moment) throw new AppError('Moment not found', 404);

    // The author can always see their own Moment; everyone else only
    // sees approved, unexpired, public Moments.
    const isOwner = req.user?.userId === moment.authorId;
    const expired = moment.expiresAt ? moment.expiresAt.getTime() < Date.now() : false;
    const visible =
      moment.isApproved &&
      !expired &&
      (moment.visibility === 'PUBLIC' || isOwner);

    if (!isOwner && !visible) {
      throw new AppError('Moment not found', 404);
    }

    res.json({ moment });
  } catch (err) {
    next(err);
  }
});

// List Moments for a Favorite
momentsRouter.get('/favorite/:handle', optionalAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { handle: req.params.handle.toLowerCase() },
      include: { favoriteProfile: true },
    });
    if (!user?.favoriteProfile) throw new AppError('Favorite not found', 404);

    const moments = await prisma.moment.findMany({
      where: {
        favoriteId: user.favoriteProfile.id,
        isApproved: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    res.json({ moments });
  } catch (err) {
    next(err);
  }
});

// React to a Moment
momentsRouter.post('/:id/react', authenticate, async (req, res, next) => {
  try {
    const schema = z.object({ type: z.string().default('like') });
    const { type } = schema.parse(req.body);

    const moment = await prisma.moment.findUnique({ where: { id: req.params.id } });
    if (!moment) throw new AppError('Moment not found', 404);

    const existing = await prisma.reaction.findUnique({
      where: {
        userId_momentId_type: {
          userId: req.user!.userId,
          momentId: moment.id,
          type,
        },
      },
    });

    // Only count newly created reactions — repeated reactions are idempotent.
    if (!existing) {
      await prisma.$transaction([
        prisma.reaction.create({
          data: { userId: req.user!.userId, momentId: moment.id, type },
        }),
        prisma.moment.update({
          where: { id: moment.id },
          data: { reactionCount: { increment: 1 } },
        }),
      ]);
    }

    res.json({ reacted: true });
  } catch (err) {
    next(err);
  }
});
