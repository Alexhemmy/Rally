import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const moderationRouter = Router();

moderationRouter.post('/report', authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      targetType: z.enum(['user', 'moment', 'gift', 'comment', 'message']),
      targetId: z.string(),
      reason: z.enum([
        'harassment',
        'hate',
        'spam',
        'scam',
        'sexual',
        'violence',
        'impersonation',
        'other',
      ]),
      details: z.string().max(2000).optional(),
    });
    const data = schema.parse(req.body);
    const report = await prisma.report.create({
      data: {
        reporterId: req.user!.userId,
        targetType: data.targetType,
        targetId: data.targetId,
        reason: data.reason,
        evidence: data.details,
        status: 'open',
      },
    });
    res.status(201).json({ report });
  } catch (e) {
    next(e);
  }
});

moderationRouter.post('/block', authenticate, async (req, res, next) => {
  try {
    const schema = z.object({ handle: z.string() });
    const { handle } = schema.parse(req.body);
    const target = await prisma.user.findUnique({ where: { handle: handle.toLowerCase() } });
    if (!target) throw new AppError('User not found', 404);
    if (target.id === req.user!.userId) throw new AppError('Cannot block yourself');
    // Store as report marker / notification — full Block model can be migration later
    await prisma.notification.create({
      data: {
        userId: req.user!.userId,
        type: 'system',
        title: `Blocked @${target.handle}`,
        data: { blockedUserId: target.id },
      },
    });
    res.json({ blocked: true, handle: target.handle });
  } catch (e) {
    next(e);
  }
});
