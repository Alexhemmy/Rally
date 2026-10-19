import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate } from '../middleware/auth';
import { enforceMinorLimits } from '../middleware/minors';
import { AppError } from '../middleware/errorHandler';
import { notify } from '../services/notifications';

// SUB-1/2/6 — Fan Club subscriptions. Monthly tiers with perks,
// ~10% platform fee, mock payment provider (wire Stripe/Paystack in prod).
export const subscriptionsRouter = Router();

const PLATFORM_FEE_RATE = 0.1;
const MONTH_MS = 30 * 24 * 3600 * 1000;
const MAX_TIERS = 5;

async function requireFavoriteOwner(favoriteId: string, userId: string, roles: string[]) {
  const fav = await prisma.favoriteProfile.findUnique({ where: { id: favoriteId } });
  if (!fav) throw new AppError('Favorite not found', 404);
  if (fav.userId === userId || roles.includes('ADMIN')) return fav;
  throw new AppError('Only the Favorite can manage fan club tiers', 403);
}

async function mockCharge(_cents: number, _currency: string): Promise<{ ok: boolean; ref: string }> {
  // TODO: real provider (Stripe/Paystack). Always succeeds in dev.
  return { ok: true, ref: 'mock_' + Date.now() };
}

// Public: tiers for a Favorite
subscriptionsRouter.get('/favorite/:favoriteId', async (req, res, next) => {
  try {
    const tiers = await prisma.subscriptionTier.findMany({
      where: { favoriteId: req.params.favoriteId, isActive: true },
      orderBy: { priceCents: 'asc' },
    });
    res.json({ tiers });
  } catch (err) { next(err); }
});

// Create tier (max 5)
subscriptionsRouter.post('/tiers', authenticate, async (req, res, next) => {
  try {
    const data = z.object({
      favoriteId: z.string().uuid(),
      name: z.string().min(1).max(50),
      description: z.string().max(500).optional(),
      priceCents: z.number().int().min(100),
      currency: z.string().length(3).default('USD'),
      perks: z.array(z.string()).max(10).default([]),
    }).parse(req.body);
    await requireFavoriteOwner(data.favoriteId, req.user!.userId, req.user!.roles);

    const count = await prisma.subscriptionTier.count({ where: { favoriteId: data.favoriteId } });
    if (count >= MAX_TIERS) throw new AppError('Maximum of 5 tiers per Favorite', 409);

    const tier = await prisma.subscriptionTier.create({
      data: {
        favoriteId: data.favoriteId,
        name: data.name,
        description: data.description,
        priceCents: data.priceCents,
        currency: data.currency,
        perks: data.perks,
        sortOrder: count,
      },
    });
    res.status(201).json({ tier });
  } catch (err) { next(err); }
});

subscriptionsRouter.patch('/tiers/:id', authenticate, async (req, res, next) => {
  try {
    const tier = await prisma.subscriptionTier.findUnique({ where: { id: req.params.id } });
    if (!tier) throw new AppError('Tier not found', 404);
    await requireFavoriteOwner(tier.favoriteId, req.user!.userId, req.user!.roles);
    const data = z.object({
      name: z.string().min(1).max(50).optional(),
      description: z.string().max(500).optional(),
      priceCents: z.number().int().min(100).optional(),
      perks: z.array(z.string()).max(10).optional(),
      isActive: z.boolean().optional(),
    }).parse(req.body);
    const updated = await prisma.subscriptionTier.update({ where: { id: tier.id }, data });
    res.json({ tier: updated });
  } catch (err) { next(err); }
});

subscriptionsRouter.delete('/tiers/:id', authenticate, async (req, res, next) => {
  try {
    const tier = await prisma.subscriptionTier.findUnique({ where: { id: req.params.id } });
    if (!tier) throw new AppError('Tier not found', 404);
    await requireFavoriteOwner(tier.favoriteId, req.user!.userId, req.user!.roles);
    await prisma.subscriptionTier.update({ where: { id: tier.id }, data: { isActive: false } });
    res.json({ deactivated: true });
  } catch (err) { next(err); }
});

// Subscribe (mock payment, recurring monthly)
subscriptionsRouter.post('/subscribe', authenticate, enforceMinorLimits, async (req, res, next) => {
  try {
    const data = z.object({ tierId: z.string().uuid() }).parse(req.body);
    const tier = await prisma.subscriptionTier.findUnique({ where: { id: data.tierId } });
    if (!tier || !tier.isActive) throw new AppError('Tier not found', 404);

    const fanUser = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!fanUser) throw new AppError('Authentication required', 401);
    if (fanUser.isMinor && tier.priceCents > 2000) {
      throw new AppError('Spend limit for under-18 accounts', 403);
    }
    const fav = await prisma.favoriteProfile.findUnique({ where: { id: tier.favoriteId } });
    if (fav && fav.userId === fanUser.id) throw new AppError('Cannot subscribe to your own fan club');

    const charge = await mockCharge(tier.priceCents, tier.currency);
    if (!charge.ok) throw new AppError('Payment failed', 402);

    const existing = await prisma.subscription.findFirst({
      where: { userId: fanUser.id, favoriteId: tier.favoriteId, status: 'active' },
    });
    if (existing) throw new AppError('Already subscribed to this fan club', 409);

    const subscription = await prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.create({
        data: {
          userId: fanUser.id,
          tierId: tier.id,
          favoriteId: tier.favoriteId,
          status: 'active',
          autoRenew: true,
          currentPeriodEnd: new Date(Date.now() + MONTH_MS),
        },
      });
      const net = tier.priceCents * (1 - PLATFORM_FEE_RATE);
      await tx.earning.create({
        data: {
          favoriteId: tier.favoriteId,
          sourceType: 'subscription',
          sourceId: sub.id,
          amount: net,
          currency: tier.currency,
          status: 'pending',
        },
      });
      return sub;
    });

    const favOwner = await prisma.favoriteProfile.findUnique({ where: { id: tier.favoriteId } });
    if (favOwner) {
      await notify({
        userId: favOwner.userId,
        type: 'new_subscriber',
        title: 'New fan club subscriber',
        body: '@' + req.user!.handle + ' joined your ' + tier.name + ' tier.',
        data: { subscriptionId: subscription.id },
      });
    }
    res.status(201).json({ subscription });
  } catch (err) { next(err); }
});

subscriptionsRouter.post('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const sub = await prisma.subscription.findUnique({ where: { id: req.params.id } });
    if (!sub) throw new AppError('Subscription not found', 404);
    if (sub.userId !== req.user!.userId) throw new AppError('Not your subscription', 403);
    const updated = await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: 'cancelled', autoRenew: false, cancelledAt: new Date() },
    });
    res.json({ subscription: updated });
  } catch (err) { next(err); }
});

subscriptionsRouter.post('/:id/pause', authenticate, async (req, res, next) => {
  try {
    const sub = await prisma.subscription.findUnique({ where: { id: req.params.id } });
    if (!sub) throw new AppError('Subscription not found', 404);
    if (sub.userId !== req.user!.userId) throw new AppError('Not your subscription', 403);
    const status = sub.status === 'paused' ? 'active' : 'paused';
    const updated = await prisma.subscription.update({ where: { id: sub.id }, data: { status } });
    res.json({ subscription: updated });
  } catch (err) { next(err); }
});

// My subscriptions (fan view)
subscriptionsRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    const subs = await prisma.subscription.findMany({
      where: { userId: req.user!.userId },
    });
    const tierIds = subs.map((s) => s.tierId);
    const tiers = await prisma.subscriptionTier.findMany({ where: { id: { in: tierIds } } });
    res.json({
      subscriptions: subs.map((s) => ({
        ...s,
        tier: tiers.find((t) => t.id === s.tierId) ?? null,
      })),
    });
  } catch (err) { next(err); }
});
