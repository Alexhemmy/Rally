import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { notify } from '../services/notifications';

/**
 * UPG-7 — Junior Favorite program (Phase 3).
 * 16-17 year-olds may become Junior Favorites with guardian consent.
 * Junior Favorites get a page and community tools but NO payouts,
 * NO giveaways, and NO cash-prize eligibility.
 */
export const juniorRouter = Router();

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

juniorRouter.post('/apply', authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      guardianName: z.string().min(2),
      guardianPhone: z.string().min(7),
      guardianEmail: z.string().email().optional(),
    });
    const data = schema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) throw new AppError('Authentication required', 401);
    if (!user.isMinor) throw new AppError('Junior Favorite program is for 16-17 year-old accounts', 403);
    const existingFav = await prisma.favoriteProfile.findUnique({ where: { userId: user.id } });
    if (existingFav) throw new AppError('You are already a Favorite', 409);
    const dup = await prisma.juniorFavorite.findUnique({ where: { userId: user.id } });
    if (dup && !['rejected', 'revoked'].includes(dup.status)) {
      throw new AppError('Application already in progress', 409);
    }
    const code = String(crypto.randomInt(100000, 1000000));
    const record = await prisma.juniorFavorite.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone,
        guardianEmail: data.guardianEmail,
        consentCodeHash: hashCode(code),
        status: 'pending',
      },
      update: {
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone,
        guardianEmail: data.guardianEmail,
        consentCodeHash: hashCode(code),
        status: 'pending',
        note: null,
      },
    });
    res.status(201).json({
      application: { id: record.id, status: record.status },
      // dev-only: production sends this to the guardian via SMS
      devConsentCode: process.env.NODE_ENV === 'production' ? undefined : code,
    });
  } catch (err) { next(err); }
});

juniorRouter.post('/:id/verify', async (req, res, next) => {
  try {
    const schema = z.object({ code: z.string().length(6) });
    const { code } = schema.parse(req.body);
    const record = await prisma.juniorFavorite.findUnique({ where: { id: req.params.id } });
    if (!record) throw new AppError('Application not found', 404);
    if (record.status !== 'pending') throw new AppError('Application is not pending consent', 409);
    if (hashCode(code) !== record.consentCodeHash) throw new AppError('Invalid consent code', 403);
    const updated = await prisma.juniorFavorite.update({
      where: { id: record.id },
      data: { status: 'consented', consentAt: new Date() },
    });
    res.json({ application: { id: updated.id, status: updated.status } });
  } catch (err) { next(err); }
});

juniorRouter.post('/:id/review', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const schema = z.object({
      decision: z.enum(['approved', 'rejected']),
      note: z.string().optional(),
      categoryId: z.string().uuid().optional(),
    });
    const data = schema.parse(req.body);
    const record = await prisma.juniorFavorite.findUnique({ where: { id: req.params.id } });
    if (!record) throw new AppError('Application not found', 404);
    if (record.status !== 'consented') throw new AppError('Guardian consent required before review', 409);

    if (data.decision === 'rejected') {
      const updated = await prisma.juniorFavorite.update({
        where: { id: record.id },
        data: { status: 'rejected', note: data.note, reviewedBy: req.user!.userId },
      });
      await notify({ userId: record.userId, type: 'junior_rejected', title: 'Junior Favorite application not approved', body: data.note });
      return res.json({ application: updated });
    }

    const user = await prisma.user.findUnique({ where: { id: record.userId } });
    if (!user) throw new AppError('User not found', 404);
    const alreadyFav = await prisma.favoriteProfile.findUnique({ where: { userId: user.id } });
    if (alreadyFav) throw new AppError('User is already a Favorite', 409);

    const profile = await prisma.$transaction(async (tx) => {
      const fav = await tx.favoriteProfile.create({
        data: {
          userId: user.id,
          categoryId: data.categoryId,
          isJunior: true,
          isPublished: true,
          probationEndsAt: new Date(Date.now() + 30 * 86400000),
        },
      });
      await tx.juniorFavorite.update({
        where: { id: record.id },
        data: { status: 'approved', favoriteId: fav.id, reviewedBy: req.user!.userId, note: data.note },
      });
      await tx.user.update({
        where: { id: user.id },
        data: { roles: { set: ['FAN', 'FAVORITE'] } },
      });
      return fav;
    });
    await notify({
      userId: record.userId,
      type: 'junior_approved',
      title: 'Welcome, Junior Favorite! 🎉',
      body: 'Your page is live. Junior Favorites cannot receive payouts or run giveaways.',
      data: { favoriteId: profile.id },
    });
    res.json({ favorite: profile });
  } catch (err) { next(err); }
});

juniorRouter.post('/:id/revoke', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const record = await prisma.juniorFavorite.findUnique({ where: { id: req.params.id } });
    if (!record) throw new AppError('Application not found', 404);
    const updated = await prisma.juniorFavorite.update({
      where: { id: record.id },
      data: { status: 'revoked', reviewedBy: req.user!.userId },
    });
    if (record.favoriteId) {
      await prisma.favoriteProfile.update({ where: { id: record.favoriteId }, data: { isPublished: false } });
    }
    res.json({ application: updated });
  } catch (err) { next(err); }
});

juniorRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    const record = await prisma.juniorFavorite.findUnique({ where: { userId: req.user!.userId } });
    res.json({ application: record });
  } catch (err) { next(err); }
});

juniorRouter.get('/queue', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const status = (req.query.status as string) || 'consented';
    const queue = await prisma.juniorFavorite.findMany({ where: { status }, orderBy: { createdAt: 'asc' }, take: 100 });
    res.json({ queue });
  } catch (err) { next(err); }
});
