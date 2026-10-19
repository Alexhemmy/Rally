import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { notify } from '../services/notifications';

/**
 * Phase 3 commerce — Merch fulfillment via partners.
 * Physical items with a fulfillment partner, delivery window, tracking,
 * and refund if undelivered.
 */
export const merchRouter = Router();

const PLATFORM_FEE_RATE = 0.10;

async function requireFavOwner(favoriteId: string, userId: string, roles: string[]) {
  const fav = await prisma.favoriteProfile.findUnique({ where: { id: favoriteId } });
  if (!fav) throw new AppError('Favorite not found', 404);
  if (fav.userId === userId || roles.includes('ADMIN')) return fav;
  throw new AppError('Only the Favorite can manage merch', 403);
}

merchRouter.post('/partners', authenticate, async (req, res, next) => {
  try {
    if (!req.user!.roles.includes('ADMIN')) throw new AppError('Admin only', 403);
    const schema = z.object({ name: z.string().min(2) });
    const data = schema.parse(req.body);
    const partner = await prisma.merchPartner.create({ data });
    res.status(201).json({ partner });
  } catch (err) { next(err); }
});

merchRouter.get('/partners', async (req, res, next) => {
  try {
    const partners = await prisma.merchPartner.findMany({ where: { status: 'active' } });
    res.json({ partners });
  } catch (err) { next(err); }
});

merchRouter.post('/items', authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      favoriteId: z.string().uuid(),
      title: z.string().min(2).max(120),
      description: z.string().max(2000).optional(),
      imageUrl: z.string().url().optional(),
      priceCents: z.number().int().positive(),
      currency: z.string().length(3).default('USD'),
      variants: z.record(z.any()).optional(),
      fulfillmentPartnerId: z.string().uuid().optional(),
      deliveryWindowDays: z.number().int().min(1).max(90).default(14),
    });
    const data = schema.parse(req.body);
    await requireFavOwner(data.favoriteId, req.user!.userId, req.user!.roles);
    const item = await prisma.merchItem.create({ data: { ...data, variants: data.variants as any } });
    res.status(201).json({ item });
  } catch (err) { next(err); }
});

merchRouter.get('/items/:favoriteId', async (req, res, next) => {
  try {
    const items = await prisma.merchItem.findMany({
      where: { favoriteId: req.params.favoriteId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ items });
  } catch (err) { next(err); }
});

merchRouter.post('/orders', authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      itemId: z.string().uuid(),
      shippingAddress: z.object({
        name: z.string().min(2),
        line1: z.string().min(3),
        city: z.string().min(2),
        country: z.string().length(2),
        phone: z.string().optional(),
      }),
    });
    const data = schema.parse(req.body);
    const item = await prisma.merchItem.findUnique({ where: { id: data.itemId } });
    if (!item || !item.isActive) throw new AppError('Item not found', 404);
    const fav = await prisma.favoriteProfile.findUnique({ where: { id: item.favoriteId } });
    if (!fav) throw new AppError('Favorite not found', 404);
    if (fav.userId === req.user!.userId) throw new AppError('Cannot order your own merch', 403);

    const platformFee = Math.round(item.priceCents * PLATFORM_FEE_RATE) / 100;
    const order = await prisma.$transaction(async (tx) => {
      const o = await tx.merchOrder.create({
        data: {
          itemId: item.id,
          favoriteId: item.favoriteId,
          buyerId: req.user!.userId,
          amountCents: item.priceCents,
          currency: item.currency,
          platformFee,
          shippingAddress: data.shippingAddress as any,
          dueAt: new Date(Date.now() + (item.deliveryWindowDays ?? 14) * 86400000),
          status: 'paid',
        },
      });
      await tx.earning.create({
        data: {
          favoriteId: item.favoriteId,
          sourceType: 'merch',
          sourceId: o.id,
          amount: (item.priceCents - platformFee * 100) / 100,
          currency: item.currency,
          status: 'pending',
        },
      });
      return o;
    });
    await notify({
      userId: fav.userId,
      type: 'merch_order',
      title: 'New merch order 🛍️',
      body: item.title + ' — fulfill before ' + order.dueAt.toISOString().slice(0, 10),
      data: { orderId: order.id },
    });
    res.status(201).json({ order });
  } catch (err) { next(err); }
});

merchRouter.post('/orders/:id/fulfill', authenticate, async (req, res, next) => {
  try {
    const schema = z.object({ trackingCode: z.string().min(3).max(64) });
    const data = schema.parse(req.body);
    const order = await prisma.merchOrder.findUnique({ where: { id: req.params.id } });
    if (!order) throw new AppError('Order not found', 404);
    await requireFavOwner(order.favoriteId, req.user!.userId, req.user!.roles);
    if (order.status !== 'paid') throw new AppError('Order cannot be fulfilled', 409);
    const updated = await prisma.merchOrder.update({
      where: { id: order.id },
      data: { status: 'shipped', trackingCode: data.trackingCode, fulfilledAt: new Date() },
    });
    await notify({
      userId: order.buyerId,
      type: 'merch_shipped',
      title: 'Your merch has shipped! 📦',
      body: 'Tracking: ' + data.trackingCode,
      data: { orderId: order.id },
    });
    res.json({ order: updated });
  } catch (err) { next(err); }
});

merchRouter.post('/orders/:id/deliver', authenticate, async (req, res, next) => {
  try {
    const order = await prisma.merchOrder.findUnique({ where: { id: req.params.id } });
    if (!order) throw new AppError('Order not found', 404);
    if (order.buyerId !== req.user!.userId) throw new AppError('Only the buyer can confirm delivery', 403);
    if (order.status !== 'shipped') throw new AppError('Order is not shipped', 409);
    const updated = await prisma.merchOrder.update({
      where: { id: order.id },
      data: { status: 'delivered', deliveredAt: new Date() },
    });
    await prisma.earning.updateMany({
      where: { sourceType: 'merch', sourceId: order.id },
      data: { status: 'available' },
    });
    res.json({ order: updated });
  } catch (err) { next(err); }
});

merchRouter.post('/orders/:id/refund', authenticate, async (req, res, next) => {
  try {
    const order = await prisma.merchOrder.findUnique({ where: { id: req.params.id } });
    if (!order) throw new AppError('Order not found', 404);
    const isBuyer = order.buyerId === req.user!.userId;
    const isAdmin = req.user!.roles.includes('ADMIN');
    if (!isBuyer && !isAdmin) throw new AppError('Buyer or admin only', 403);
    if (['refunded', 'delivered', 'cancelled'].includes(order.status)) throw new AppError('Order cannot be refunded', 409);
    if (!isAdmin && new Date() < order.dueAt) throw new AppError('Refund available after the delivery window', 409);
    const updated = await prisma.merchOrder.update({
      where: { id: order.id },
      data: { status: 'refunded', refundedAt: new Date() },
    });
    await prisma.earning.updateMany({
      where: { sourceType: 'merch', sourceId: order.id },
      data: { amount: 0 },
    });
    await notify({
      userId: order.buyerId,
      type: 'merch_refund',
      title: 'Merch order refunded',
      body: 'Your order could not be delivered and has been refunded.',
      data: { orderId: order.id },
    });
    res.json({ order: updated });
  } catch (err) { next(err); }
});

merchRouter.get('/library', authenticate, async (req, res, next) => {
  try {
    const orders = await prisma.merchOrder.findMany({
      where: { buyerId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const itemIds = [...new Set(orders.map((o) => o.itemId))];
    const items = await prisma.merchItem.findMany({ where: { id: { in: itemIds } }, select: { id: true, title: true, imageUrl: true } });
    const byId = new Map(items.map((i) => [i.id, i]));
    res.json({ orders: orders.map((o) => ({ ...o, item: byId.get(o.itemId) ?? null })) });
  } catch (err) { next(err); }
});

merchRouter.get('/orders', authenticate, async (req, res, next) => {
  try {
    const fav = await prisma.favoriteProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!fav) throw new AppError('Favorite profile required', 403);
    const orders = await prisma.merchOrder.findMany({
      where: { favoriteId: fav.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ orders });
  } catch (err) { next(err); }
});
