import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate } from '../middleware/auth';
import { enforceMinorLimits } from '../middleware/minors';
import { AppError } from '../middleware/errorHandler';
import { notify } from '../services/notifications';

// SUB-3..5 — Favorite Store with commissions (~10% platform fee),
// delivery windows, proof of delivery and auto-refund for misses.
// Store items are real services; they are NEVER exchangeable for Gifts (SUB-5).
export const storeRouter = Router();

const PLATFORM_FEE_RATE = 0.1;
const DAY_MS = 86400000;

async function requireFavoriteOwner(favoriteId: string, userId: string, roles: string[]) {
  const fav = await prisma.favoriteProfile.findUnique({ where: { id: favoriteId } });
  if (!fav) throw new AppError('Favorite not found', 404);
  if (fav.userId === userId || roles.includes('ADMIN')) return fav;
  const team = await prisma.teamMember.findFirst({ where: { favoriteId, userId } });
  if (team) return fav;
  throw new AppError('Only the Favorite or their team can manage the store', 403);
}

// Public: items for a Favorite
storeRouter.get('/favorite/:favoriteId', async (req, res, next) => {
  try {
    const items = await prisma.storeItem.findMany({
      where: { favoriteId: req.params.favoriteId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ items });
  } catch (err) { next(err); }
});

storeRouter.post('/items', authenticate, async (req, res, next) => {
  try {
    const data = z.object({
      favoriteId: z.string().uuid(),
      title: z.string().min(1).max(120),
      description: z.string().max(2000).optional(),
      previewUrl: z.string().url().optional(),
      priceCents: z.number().int().min(100),
      currency: z.string().length(3).default('USD'),
      deliveryType: z.enum(['download', 'link', 'message']),
      deliveryWindowDays: z.number().int().min(1).max(30).default(7),
    }).parse(req.body);
    await requireFavoriteOwner(data.favoriteId, req.user!.userId, req.user!.roles);
    const item = await prisma.storeItem.create({ data });
    res.status(201).json({ item });
  } catch (err) { next(err); }
});

storeRouter.patch('/items/:id', authenticate, async (req, res, next) => {
  try {
    const item = await prisma.storeItem.findUnique({ where: { id: req.params.id } });
    if (!item) throw new AppError('Item not found', 404);
    await requireFavoriteOwner(item.favoriteId, req.user!.userId, req.user!.roles);
    const data = z.object({
      title: z.string().min(1).max(120).optional(),
      description: z.string().max(2000).optional(),
      previewUrl: z.string().url().optional(),
      priceCents: z.number().int().min(100).optional(),
      deliveryType: z.enum(['download', 'link', 'message']).optional(),
      deliveryWindowDays: z.number().int().min(1).max(30).optional(),
      isActive: z.boolean().optional(),
    }).parse(req.body);
    const updated = await prisma.storeItem.update({ where: { id: item.id }, data });
    res.json({ item: updated });
  } catch (err) { next(err); }
});

// Order (mock payment; due date from delivery window — SUB-4)
storeRouter.post('/orders', authenticate, enforceMinorLimits, async (req, res, next) => {
  try {
    const data = z.object({ itemId: z.string().uuid() }).parse(req.body);
    const item = await prisma.storeItem.findUnique({ where: { id: data.itemId } });
    if (!item || !item.isActive) throw new AppError('Item not found', 404);

    const buyer = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!buyer) throw new AppError('Authentication required', 401);
    if (buyer.isMinor && item.priceCents > 2000) {
      throw new AppError('Spend limit for under-18 accounts', 403);
    }
    const fav = await prisma.favoriteProfile.findUnique({ where: { id: item.favoriteId } });
    if (fav && fav.userId === buyer.id) throw new AppError('Cannot order from your own store');

    // Mock payment — always succeeds in dev (TODO: Stripe/Paystack webhook in prod)
    const fee = item.priceCents * PLATFORM_FEE_RATE;
    const order = await prisma.$transaction(async (tx) => {
      const o = await tx.storeOrder.create({
        data: {
          itemId: item.id,
          favoriteId: item.favoriteId,
          buyerId: buyer.id,
          amountCents: item.priceCents,
          currency: item.currency,
          platformFee: fee,
          status: 'pending',
          dueAt: new Date(Date.now() + item.deliveryWindowDays * DAY_MS),
        },
      });
      await tx.earning.create({
        data: {
          favoriteId: item.favoriteId,
          sourceType: 'store',
          sourceId: o.id,
          amount: item.priceCents - fee,
          currency: item.currency,
          status: 'pending', // becomes available on delivery
        },
      });
      return o;
    });

    if (fav) {
      await notify({
        userId: fav.userId,
        type: 'store_order',
        title: 'New store order',
        body: 'A fan ordered ' + item.title + '. Deliver within ' + item.deliveryWindowDays + ' days.',
        data: { orderId: order.id },
      });
    }
    res.status(201).json({ order });
  } catch (err) { next(err); }
});

// Deliver with proof (SUB-4); closes the earning
storeRouter.post('/orders/:id/deliver', authenticate, async (req, res, next) => {
  try {
    const data = z.object({ deliveryProof: z.string().min(1).max(2000) }).parse(req.body);
    const order = await prisma.storeOrder.findUnique({ where: { id: req.params.id } });
    if (!order) throw new AppError('Order not found', 404);
    await requireFavoriteOwner(order.favoriteId, req.user!.userId, req.user!.roles);
    if (order.status !== 'pending') throw new AppError('Order is not pending', 409);

    const updated = await prisma.$transaction(async (tx) => {
      const o = await tx.storeOrder.update({
        where: { id: order.id },
        data: { status: 'delivered', deliveryProof: data.deliveryProof, deliveredAt: new Date() },
      });
      await tx.earning.updateMany({
        where: { sourceType: 'store', sourceId: order.id, status: 'pending' },
        data: { status: 'available' },
      });
      return o;
    });
    await notify({
      userId: order.buyerId,
      type: 'store_delivered',
      title: 'Your order was delivered',
      data: { orderId: order.id },
    });
    res.json({ order: updated });
  } catch (err) { next(err); }
});

// Auto-refund overdue orders; fans can also request a refund (SUB-4)
storeRouter.post('/orders/:id/refund', authenticate, async (req, res, next) => {
  try {
    const order = await prisma.storeOrder.findUnique({ where: { id: req.params.id } });
    if (!order) throw new AppError('Order not found', 404);

    const isBuyer = order.buyerId === req.user!.userId;
    const isFavoriteSide = await prisma.favoriteProfile.findFirst({
      where: { id: order.favoriteId },
    }).then((f) => f && (f.userId === req.user!.userId || req.user!.roles.includes('ADMIN')));
    if (!isBuyer && !isFavoriteSide) throw new AppError('Not your order', 403);

    const overdue = order.dueAt.getTime() < Date.now() && order.status === 'pending';
    if (!overdue && order.status !== 'pending') throw new AppError('Order is not refundable', 409);
    if (!overdue && !isBuyer) throw new AppError('Only the buyer can request a refund before the deadline', 403);

    await prisma.$transaction(async (tx) => {
      await tx.storeOrder.update({
        where: { id: order.id },
        data: { status: 'refunded', refundedAt: new Date() },
      });
      await tx.earning.updateMany({
        where: { sourceType: 'store', sourceId: order.id },
        data: { status: 'pending', amount: 0 },
      });
    });
    const fav = await prisma.favoriteProfile.findUnique({ where: { id: order.favoriteId } });
    if (fav) {
      await notify({
        userId: fav.userId,
        type: 'store_refund',
        title: 'Order refunded',
        body: overdue ? 'Order missed the delivery window and was auto-refunded.' : 'The buyer requested a refund.',
        data: { orderId: order.id },
      });
    }
    res.json({ refunded: true, auto: overdue });
  } catch (err) { next(err); }
});

// Favorite: pending orders (oldest first, overdue flagged)
storeRouter.get('/orders/pending', authenticate, async (req, res, next) => {
  try {
    const fav = await prisma.favoriteProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!fav) throw new AppError('No Favorite profile', 404);
    const orders = await prisma.storeOrder.findMany({
      where: { favoriteId: fav.id, status: 'pending' },
      orderBy: { dueAt: 'asc' },
    });
    const now = Date.now();
    res.json({
      orders: orders.map((o) => ({ ...o, overdue: o.dueAt.getTime() < now })),
    });
  } catch (err) { next(err); }
});

// Buyer: purchase library
storeRouter.get('/library', authenticate, async (req, res, next) => {
  try {
    const orders = await prisma.storeOrder.findMany({
      where: { buyerId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const items = await prisma.storeItem.findMany({
      where: { id: { in: orders.map((o) => o.itemId) } },
    });
    res.json({
      orders: orders.map((o) => ({
        ...o,
        item: items.find((i) => i.id === o.itemId) ?? null,
      })),
    });
  } catch (err) { next(err); }
});
