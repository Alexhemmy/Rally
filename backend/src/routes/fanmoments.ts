import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate, optionalAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { notify } from '../services/notifications';

// MOM-4 — Fan Moments: fans submit, Favorite/team approves.
export const fanmomentsRouter = Router();

async function requireFavoriteSide(favoriteId: string, userId: string, roles: string[]) {
  const fav = await prisma.favoriteProfile.findUnique({ where: { id: favoriteId } });
  if (!fav) throw new AppError('Favorite not found', 404);
  if (fav.userId === userId || roles.includes('ADMIN')) return fav;
  const team = await prisma.teamMember.findFirst({
    where: { favoriteId, userId, permissions: { has: 'review_moments' } },
  });
  if (team) return fav;
  throw new AppError('Only the Favorite or moderators can review fan Moments', 403);
}

// Submit a Fan Moment (goes to approval queue)
fanmomentsRouter.post('/create', authenticate, async (req, res, next) => {
  try {
    const data = z.object({
      favoriteId: z.string().uuid(),
      title: z.string().min(1).max(120),
      description: z.string().max(2000).optional(),
      mediaUrl: z.string().url().optional(),
      mediaType: z.enum(['image', 'audio', 'video', 'link']).optional(),
      categoryTag: z.string().max(50).optional(),
    }).parse(req.body);

    const fav = await prisma.favoriteProfile.findUnique({ where: { id: data.favoriteId } });
    if (!fav) throw new AppError('Favorite not found', 404);
    if (fav.userId === req.user!.userId) {
      throw new AppError('Favorites publish their own Moments directly');
    }

    const moment = await prisma.moment.create({
      data: {
        favoriteId: fav.id,
        authorId: req.user!.userId,
        type: 'FAN',
        title: data.title,
        description: data.description,
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType,
        categoryTag: data.categoryTag,
        visibility: 'PUBLIC',
        isApproved: false, // MOM-4: approval queue
      },
    });
    await notify({
      userId: fav.userId,
      type: 'fan_moment_submitted',
      title: 'New fan Moment awaiting review',
      data: { momentId: moment.id },
    });
    res.status(201).json({ moment: { id: moment.id, status: 'pending_review' } });
  } catch (err) { next(err); }
});

// Approval queue
fanmomentsRouter.get('/queue', authenticate, async (req, res, next) => {
  try {
    const fav = await prisma.favoriteProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!fav) throw new AppError('No Favorite profile', 404);
    await requireFavoriteSide(fav.id, req.user!.userId, req.user!.roles);
    const moments = await prisma.moment.findMany({
      where: { favoriteId: fav.id, type: 'FAN', isApproved: false },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
    res.json({ moments });
  } catch (err) { next(err); }
});

async function loadFanMoment(id: string) {
  const moment = await prisma.moment.findUnique({ where: { id } });
  if (!moment || moment.type !== 'FAN') throw new AppError('Fan Moment not found', 404);
  return moment;
}

// Approve (credit the fan)
fanmomentsRouter.post('/:id/approve', authenticate, async (req, res, next) => {
  try {
    const moment = await loadFanMoment(req.params.id);
    await requireFavoriteSide(moment.favoriteId, req.user!.userId, req.user!.roles);
    const updated = await prisma.moment.update({
      where: { id: moment.id },
      data: { isApproved: true },
    });
    await notify({
      userId: moment.authorId,
      type: 'fan_moment_approved',
      title: 'Your fan Moment was approved 🎉',
      data: { momentId: moment.id },
    });
    res.json({ moment: updated });
  } catch (err) { next(err); }
});

// Hide / reject
fanmomentsRouter.post('/:id/hide', authenticate, async (req, res, next) => {
  try {
    const moment = await loadFanMoment(req.params.id);
    await requireFavoriteSide(moment.favoriteId, req.user!.userId, req.user!.roles);
    await prisma.moment.update({ where: { id: moment.id }, data: { isApproved: false } });
    await notify({
      userId: moment.authorId,
      type: 'fan_moment_hidden',
      title: 'One of your fan Moments was removed',
      data: { momentId: moment.id },
    });
    res.json({ hidden: true });
  } catch (err) { next(err); }
});

// Feature a fan Moment
fanmomentsRouter.post('/:id/feature', authenticate, async (req, res, next) => {
  try {
    const moment = await loadFanMoment(req.params.id);
    await requireFavoriteSide(moment.favoriteId, req.user!.userId, req.user!.roles);
    const updated = await prisma.moment.update({
      where: { id: moment.id },
      data: { isFeatured: !moment.isFeatured },
    });
    res.json({ moment: updated });
  } catch (err) { next(err); }
});

// Public: approved fan Moments of a Favorite
fanmomentsRouter.get('/favorite/:favoriteId', optionalAuth, async (req, res, next) => {
  try {
    const moments = await prisma.moment.findMany({
      where: { favoriteId: req.params.favoriteId, type: 'FAN', isApproved: true },
      orderBy: { isFeatured: 'desc' },
      thenBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ moments });
  } catch (err) { next(err); }
});
