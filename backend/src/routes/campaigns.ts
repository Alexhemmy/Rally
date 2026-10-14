import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, optionalAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const campaignsRouter = Router();

campaignsRouter.get('/', optionalAuth, async (_req, res, next) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ campaigns });
  } catch (err) {
    next(err);
  }
});

campaignsRouter.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const campaign = await prisma.campaign.findUnique({ where: { id: req.params.id } });
    if (!campaign) throw new AppError('Campaign not found', 404);
    res.json({ campaign });
  } catch (err) {
    next(err);
  }
});

campaignsRouter.post('/', authenticate, async (req, res, next) => {
  try {
    const profile = await prisma.favoriteProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) throw new AppError('Favorite profile required', 403);
    const { title, description, goalAmount, beneficiaryId, type, deadline } = req.body;
    if (!title || !goalAmount || !beneficiaryId) throw new AppError('Missing fields');
    const campaign = await prisma.campaign.create({
      data: {
        favoriteId: profile.id,
        beneficiaryId,
        title,
        description,
        goalAmount,
        type: type || 'fixed_goal',
        deadline: deadline ? new Date(deadline) : undefined,
        status: 'draft',
      },
    });
    res.status(201).json({ campaign });
  } catch (err) {
    next(err);
  }
});
