import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { notify } from '../services/notifications';

// FFG — Fan-to-Fan Gifting. Cosmetic gifts + escrowed Token transfers.
// Minors blocked (FFG-5); verified phone required for token gifts (FFG-6);
// gifted tokens land in giftedBalance and are spend-only on the platform (FFG-2/7).
export const fangiftsRouter = Router();

const ACCEPT_WINDOW_HOURS = 72; // FFG-8: 72h acceptance window, then recoverable
const DAILY_TOKEN_LIMIT = 200;

async function requireEligibleSender(userId: string, forTokens: boolean) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('Authentication required', 401);
  if (user.isMinor) throw new AppError('Fan-to-fan gifting is not available for under-18 accounts', 403);
  if (forTokens && !user.phoneVerifiedAt && !user.googleId && !user.appleId) {
    throw new AppError('Verify your phone before gifting Tokens', 403);
  }
  return user;
}

// Cosmetic catalog (fan_cosmetic items)
fangiftsRouter.get('/catalog', async (_req, res, next) => {
  try {
    const items = await prisma.giftCatalogItem.findMany({
      where: { isActive: true, type: 'fan_cosmetic' },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ items });
  } catch (err) { next(err); }
});

// Send cosmetic fan gift
fangiftsRouter.post('/cosmetic', authenticate, async (req, res, next) => {
  try {
    const data = z.object({
      catalogItemId: z.string().uuid(),
      recipientHandle: z.string(),
      message: z.string().max(280).optional(),
    }).parse(req.body);

    await requireEligibleSender(req.user!.userId, false);
    const item = await prisma.giftCatalogItem.findUnique({ where: { id: data.catalogItemId } });
    if (!item || !item.isActive || item.type !== 'fan_cosmetic') {
      throw new AppError('Cosmetic not available', 404);
    }
    const recipient = await prisma.user.findUnique({
      where: { handle: data.recipientHandle.toLowerCase() },
    });
    if (!recipient) throw new AppError('Recipient not found', 404);
    if (recipient.id === req.user!.userId) throw new AppError('Cannot gift yourself');

    const gift = await prisma.fanGift.create({
      data: {
        senderId: req.user!.userId,
        recipientId: recipient.id,
        kind: 'cosmetic',
        catalogItemId: item.id,
        message: data.message,
        status: 'accepted', // cosmetics are immediate, no escrow
        acceptedAt: new Date(),
        expiresAt: new Date(Date.now() + ACCEPT_WINDOW_HOURS * 3600 * 1000),
      },
    });
    await notify({
      userId: recipient.id,
      type: 'fan_gift_received',
      title: '@' + req.user!.handle + ' sent you a fan gift',
      body: data.message,
      data: { fanGiftId: gift.id, kind: 'cosmetic' },
    });
    res.status(201).json({ gift: { id: gift.id, kind: gift.kind, status: gift.status } });
  } catch (err) { next(err); }
});

// Send Token gift — escrowed (FFG-2): debited now, credited on accept, recoverable until expiry
fangiftsRouter.post('/tokens', authenticate, async (req, res, next) => {
  try {
    const data = z.object({
      recipientHandle: z.string(),
      amount: z.number().int().min(1).max(1000),
      message: z.string().max(280).optional(),
    }).parse(req.body);

    const sender = await requireEligibleSender(req.user!.userId, true);
    if (sender.isMinor) throw new AppError('Token fan gifts are blocked for minors', 403);
    const recipient = await prisma.user.findUnique({
      where: { handle: data.recipientHandle.toLowerCase() },
    });
    if (!recipient) throw new AppError('Recipient not found', 404);
    if (recipient.id === sender.id) throw new AppError('Cannot gift yourself');
    if (recipient.isMinor) throw new AppError('Token gifts to under-18 accounts are blocked', 403);

    // Daily send limit
    const since = new Date(Date.now() - 24 * 3600 * 1000);
    const sentToday = await prisma.fanGift.aggregate({
      where: { senderId: sender.id, kind: 'tokens', createdAt: { gte: since }, status: { notIn: ['recovered', 'expired'] } },
      _sum: { tokens: true },
    });
    if ((sentToday._sum.tokens ?? 0) + data.amount > DAILY_TOKEN_LIMIT) {
      throw new AppError('Daily fan gift limit exceeded', 429);
    }

    const gift = await prisma.$transaction(async (tx) => {
      const debited = await tx.tokenWallet.updateMany({
        where: { userId: sender.id, balance: { gte: data.amount } },
        data: { balance: { decrement: data.amount } },
      });
      if (debited.count === 0) throw new AppError('Insufficient tokens', 402);
      return tx.fanGift.create({
        data: {
          senderId: sender.id,
          recipientId: recipient.id,
          kind: 'tokens',
          tokens: data.amount,
          message: data.message,
          status: 'pending',
          expiresAt: new Date(Date.now() + ACCEPT_WINDOW_HOURS * 3600 * 1000),
        },
      });
    });

    await notify({
      userId: recipient.id,
      type: 'fan_gift_received',
      title: '@' + req.user!.handle + ' sent you ' + data.amount + ' Tokens',
      body: 'Accept within 72 hours — otherwise it is returned to the sender.',
      data: { fanGiftId: gift.id, kind: 'tokens', amount: data.amount },
    });
    res.status(201).json({ gift: { id: gift.id, tokens: gift.tokens, status: gift.status, expiresAt: gift.expiresAt } });
  } catch (err) { next(err); }
});

async function loadPendingFanGift(id: string) {
  const gift = await prisma.fanGift.findUnique({ where: { id } });
  if (!gift) throw new AppError('Fan gift not found', 404);
  if (gift.status !== 'pending') throw new AppError('Fan gift is not pending', 409);
  if (gift.expiresAt.getTime() < Date.now()) throw new AppError('Fan gift expired', 410);
  return gift;
}

// Accept: tokens move into recipient's giftedBalance (restricted, FFG-2)
fangiftsRouter.post('/:id/accept', authenticate, async (req, res, next) => {
  try {
    const gift = await loadPendingFanGift(req.params.id);
    if (gift.recipientId !== req.user!.userId) throw new AppError('Not your gift', 403);
    if (gift.kind !== 'tokens') throw new AppError('Only token gifts need acceptance');

    await prisma.$transaction([
      prisma.fanGift.update({
        where: { id: gift.id },
        data: { status: 'accepted', acceptedAt: new Date() },
      }),
      prisma.tokenWallet.update({
        where: { userId: gift.recipientId },
        data: { giftedBalance: { increment: gift.tokens } },
      }),
    ]);
    await notify({
      userId: gift.senderId,
      type: 'fan_gift_accepted',
      title: 'Your token gift was accepted',
      data: { fanGiftId: gift.id },
    });
    res.json({ accepted: true });
  } catch (err) { next(err); }
});

// Decline: refund to sender's balance
fangiftsRouter.post('/:id/decline', authenticate, async (req, res, next) => {
  try {
    const gift = await loadPendingFanGift(req.params.id);
    if (gift.recipientId !== req.user!.userId) throw new AppError('Not your gift', 403);

    await prisma.$transaction([
      prisma.fanGift.update({ where: { id: gift.id }, data: { status: 'declined' } }),
      ...(gift.kind === 'tokens'
        ? [prisma.tokenWallet.update({
            where: { userId: gift.senderId },
            data: { balance: { increment: gift.tokens } },
          })]
        : []),
    ]);
    res.json({ declined: true });
  } catch (err) { next(err); }
});

// Recover: sender reclaims an unaccepted gift after the 72h window (FFG-8)
fangiftsRouter.post('/:id/recover', authenticate, async (req, res, next) => {
  try {
    const gift = await prisma.fanGift.findUnique({ where: { id: req.params.id } });
    if (!gift) throw new AppError('Fan gift not found', 404);
    if (gift.senderId !== req.user!.userId) throw new AppError('Not your gift', 403);
    if (gift.status !== 'pending') throw new AppError('Only pending gifts are recoverable', 409);
    if (gift.expiresAt.getTime() > Date.now()) {
      throw new AppError('Recovery available after the 72h window expires', 409);
    }
    await prisma.$transaction([
      prisma.fanGift.update({ where: { id: gift.id }, data: { status: 'recovered' } }),
      ...(gift.kind === 'tokens'
        ? [prisma.tokenWallet.update({
            where: { userId: gift.senderId },
            data: { balance: { increment: gift.tokens } },
          })]
        : []),
    ]);
    res.json({ recovered: true });
  } catch (err) { next(err); }
});

// Inbox / outbox
fangiftsRouter.get('/received', authenticate, async (req, res, next) => {
  try {
    const gifts = await prisma.fanGift.findMany({
      where: { recipientId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ gifts });
  } catch (err) { next(err); }
});

fangiftsRouter.get('/sent', authenticate, async (req, res, next) => {
  try {
    const gifts = await prisma.fanGift.findMany({
      where: { senderId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ gifts });
  } catch (err) { next(err); }
});
