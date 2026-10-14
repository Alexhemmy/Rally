import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const usersRouter = Router();

usersRouter.get('/:handle', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { handle: req.params.handle.toLowerCase() },
      select: {
        id: true,
        handle: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        roles: true,
        verificationStatus: true,
        favoriteProfile: {
          select: {
            id: true,
            coverUrl: true,
            supporterCount: true,
            isPublished: true,
            verificationStatus: true,
            accentColor: true,
            shortUrl: true,
            specialtyIds: true,
          },
        },
      },
    });
    if (!user) throw new AppError('User not found', 404);
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

usersRouter.patch('/me', authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      displayName: z.string().min(1).max(80).optional(),
      bio: z.string().max(500).optional(),
      avatarUrl: z.string().url().optional(),
      locale: z.string().optional(),
      contentLanguages: z.array(z.string()).optional(),
      anonymityDefault: z.boolean().optional(),
      monthlySpendCap: z.number().positive().optional(),
    });
    const data = schema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data,
      select: {
        id: true,
        handle: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        locale: true,
        contentLanguages: true,
      },
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

usersRouter.post('/:handle/follow', authenticate, async (req, res, next) => {
  try {
    const target = await prisma.user.findUnique({
      where: { handle: req.params.handle.toLowerCase() },
    });
    if (!target) throw new AppError('User not found', 404);
    if (target.id === req.user!.userId) throw new AppError('Cannot follow yourself');

    await prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId: req.user!.userId,
          followingId: target.id,
        },
      },
      create: { followerId: req.user!.userId, followingId: target.id },
      update: {},
    });
    res.json({ following: true });
  } catch (err) {
    next(err);
  }
});

usersRouter.delete('/:handle/follow', authenticate, async (req, res, next) => {
  try {
    const target = await prisma.user.findUnique({
      where: { handle: req.params.handle.toLowerCase() },
    });
    if (!target) throw new AppError('User not found', 404);

    await prisma.follow.deleteMany({
      where: { followerId: req.user!.userId, followingId: target.id },
    });
    res.json({ following: false });
  } catch (err) {
    next(err);
  }
});
