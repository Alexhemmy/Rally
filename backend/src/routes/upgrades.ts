import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { notify } from '../services/notifications';

// UPG — Fan upgrade path. Progress is based ONLY on non-monetary signals
// (no spend data, UPG-1). Upgrade is by application + admin review,
// and approved Favorites start on 30-day probation (UPG-5).
export const upgradesRouter = Router();

const DAY_MS = 86400000;

async function computeProgress(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('Authentication required', 401);

  const now = Date.now();
  const accountAgeDays = (now - user.createdAt.getTime()) / DAY_MS;
  const signals = {
    accountAge30Days: accountAgeDays >= 30,
    verifiedAdult: Boolean(user.phoneVerifiedAt || user.googleId || user.appleId) && !user.isMinor,
    tenPublished: false,
    hundredFollowers: false,
    fiftyEngagers: false,
    noStrikes: false,
  };

  const publishedCount = await prisma.moment.count({
    where: { authorId: userId, isApproved: true, type: { in: ['FAVORITE', 'FAN'] } },
  }) + await prisma.post.count({ where: { authorId: userId } });
  signals.tenPublished = publishedCount >= 10;

  const followerCount = await prisma.follow.count({ where: { followingId: userId } });
  signals.hundredFollowers = followerCount >= 100;

  // Distinct engagers on this user's moments/posts in last 60 days
  const since = new Date(now - 60 * DAY_MS);
  const myMoments = await prisma.moment.findMany({ where: { authorId: userId }, select: { id: true } });
  const myPosts = await prisma.post.findMany({ where: { authorId: userId }, select: { id: true } });
  const engagerSet = new Set<string>();
  if (myMoments.length) {
    const rs = await prisma.reaction.findMany({
      where: { momentId: { in: myMoments.map((m) => m.id) }, userId: { not: userId }, createdAt: { gte: since } },
      select: { userId: true },
    });
    const cs = await prisma.comment.findMany({
      where: { momentId: { in: myMoments.map((m) => m.id) }, authorId: { not: userId }, createdAt: { gte: since } },
      select: { authorId: true },
    });
    rs.forEach((r) => engagerSet.add(r.userId));
    cs.forEach((c) => engagerSet.add(c.authorId));
  }
  if (myPosts.length) {
    const rs = await prisma.reaction.findMany({
      where: { postId: { in: myPosts.map((p) => p.id) }, userId: { not: userId }, createdAt: { gte: since } },
      select: { userId: true },
    });
    const cs = await prisma.comment.findMany({
      where: { postId: { in: myPosts.map((p) => p.id) }, authorId: { not: userId }, createdAt: { gte: since } },
      select: { authorId: true },
    });
    rs.forEach((r) => engagerSet.add(r.userId));
    cs.forEach((c) => engagerSet.add(c.authorId));
  }
  signals.fiftyEngagers = engagerSet.size >= 50;

  const strikes = await prisma.report.count({
    where: { targetType: 'user', targetId: userId, status: 'resolved', resolution: { contains: 'violation' } },
  });
  signals.noStrikes = strikes === 0;

  const passed = Object.values(signals).filter(Boolean).length;
  return {
    signals,
    passed,
    total: 6,
    eligible: passed === 6,
  };
}

// UPG-1: eligibility checklist (non-monetary only)
upgradesRouter.get('/progress', authenticate, async (req, res, next) => {
  try {
    const progress = await computeProgress(req.user!.userId);
    res.json(progress);
  } catch (err) { next(err); }
});

// UPG-2: submit application (only when all signals pass)
upgradesRouter.post('/request', authenticate, async (req, res, next) => {
  try {
    const data = z.object({
      specialtyId: z.string().uuid().optional(),
      pitch: z.string().min(50).max(2000),
      samples: z.array(z.string().url()).min(1).max(10),
      references: z.array(z.string().url()).max(10).default([]),
      declaredLinks: z.string().max(1000).optional(), // relationships with other Favorites
    }).parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) throw new AppError('Authentication required', 401);
    if (user.roles.includes('FAVORITE') || user.roles.includes('MANAGER')) {
      throw new AppError('Already a Favorite', 409);
    }
    const pending = await prisma.upgradeRequest.findFirst({
      where: { userId: user.id, status: { in: ['screening', 'pending'] } },
    });
    if (pending) throw new AppError('You already have a pending application', 409);

    const progress = await computeProgress(user.id);
    if (!progress.eligible) {
      throw new AppError('Not yet eligible: complete all upgrade signals first', 403);
    }

    const request = await prisma.upgradeRequest.create({
      data: {
        userId: user.id,
        specialtyId: data.specialtyId,
        pitch: data.pitch,
        samples: data.samples,
        references: data.references,
        declaredLinks: data.declaredLinks,
        status: 'pending',
        screeningResult: progress as any,
      },
    });
    res.status(201).json({ request: { id: request.id, status: request.status } });
  } catch (err) { next(err); }
});

// My applications
upgradesRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    const requests = await prisma.upgradeRequest.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ requests });
  } catch (err) { next(err); }
});

// Admin: list applications
upgradesRouter.get('/admin/list', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const status = (req.query.status as string) || undefined;
    const requests = await prisma.upgradeRequest.findMany({
      where: status ? { status } : { status: { in: ['pending', 'screening'] } },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
    res.json({ requests });
  } catch (err) { next(err); }
});

// Admin: review (approve / conditional / reject). UPG-3/4/5.
upgradesRouter.post('/admin/:id/review', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const data = z.object({
      decision: z.enum(['approved', 'conditional', 'rejected']),
      reviewerNote: z.string().max(2000).optional(),
      rejectionReasons: z.array(z.string()).default([]),
    }).parse(req.body);

    const request = await prisma.upgradeRequest.findUnique({ where: { id: req.params.id } });
    if (!request) throw new AppError('Application not found', 404);
    if (request.status !== 'pending' && request.status !== 'screening') {
      throw new AppError('Application already decided', 409);
    }

    const user = await prisma.user.findUnique({ where: { id: request.userId } });
    if (!user) throw new AppError('Applicant not found', 404);

    if (data.decision === 'approved' || data.decision === 'conditional') {
      const probationEndsAt = new Date(Date.now() + 30 * DAY_MS); // UPG-5
      await prisma.$transaction(async (tx) => {
        const existing = await tx.favoriteProfile.findUnique({ where: { userId: user.id } });
        if (!existing) {
          await tx.favoriteProfile.create({
            data: {
              userId: user.id,
              categoryId: request.specialtyId ?? null,
              specialtyIds: request.specialtyId ? [request.specialtyId] : [],
              verificationStatus: data.decision === 'approved' ? 'VERIFIED' : 'PENDING',
              isPublished: false, // publish after completing onboarding
              probationEndsAt,
            },
          });
        } else {
          await tx.favoriteProfile.update({
            where: { userId: user.id },
            data: { probationEndsAt },
          });
        }
        const roles = Array.from(new Set([...user.roles, 'FAVORITE']));
        await tx.user.update({ where: { id: user.id }, data: { roles: roles as any } });
        await tx.upgradeRequest.update({
          where: { id: request.id },
          data: {
            status: data.decision,
            reviewerNote: data.reviewerNote,
            rejectionReasons: [],
            probationEndsAt,
            decidedAt: new Date(),
          },
        });
      });
      await notify({
        userId: user.id,
        type: 'upgrade_approved',
        title: 'Your Favorite application was approved 🎉',
        body: 'Welcome to Rally! Your profile starts with a 30-day review period.',
        data: { requestId: request.id },
      });
    } else {
      await prisma.upgradeRequest.update({
        where: { id: request.id },
        data: {
          status: 'rejected',
          reviewerNote: data.reviewerNote,
          rejectionReasons: data.rejectionReasons,
          decidedAt: new Date(),
        },
      });
      await notify({
        userId: user.id,
        type: 'upgrade_rejected',
        title: 'Your Favorite application was not approved',
        body: data.reviewerNote || 'You can apply again in the future.',
        data: { requestId: request.id, reasons: data.rejectionReasons },
      });
    }
    res.json({ reviewed: true, decision: data.decision });
  } catch (err) { next(err); }
});
