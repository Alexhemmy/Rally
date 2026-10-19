import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { notify } from '../services/notifications';

/**
 * Phase 3 — Brand partnerships and sponsor-funded giveaways (Q31).
 * Brands pass KYB, are clearly labeled on every sponsored giveaway, and
 * fund prize pools up front. Token prizes (Q33) go to winners' gifted
 * balance only — spendable on Gifts, never withdrawable, which blocks
 * gift-back loops (GVW-2).
 */
export const sponsorsRouter = Router();

const PLATFORM_FEE_RATE = 0.03;

sponsorsRouter.post('/', async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(2),
      contactEmail: z.string().email(),
      countryCode: z.string().length(2).default('NG'),
      kybDocs: z.record(z.any()).optional(),
    });
    const data = schema.parse(req.body);
    const sponsor = await prisma.brandSponsor.create({ data: { ...data, kybDocs: data.kybDocs as any } });
    res.status(201).json({ sponsor: { id: sponsor.id, status: sponsor.kybStatus } });
  } catch (err) { next(err); }
});

sponsorsRouter.post('/:id/review', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const schema = z.object({ decision: z.enum(['approved', 'rejected']) });
    const { decision } = schema.parse(req.body);
    const sponsor = await prisma.brandSponsor.findUnique({ where: { id: req.params.id } });
    if (!sponsor) throw new AppError('Sponsor not found', 404);
    if (sponsor.kybStatus !== 'pending') throw new AppError('Already reviewed', 409);
    const updated = await prisma.brandSponsor.update({ where: { id: sponsor.id }, data: { kybStatus: decision } });
    res.json({ sponsor: updated });
  } catch (err) { next(err); }
});

sponsorsRouter.post('/:id/escrow', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const schema = z.object({ tokens: z.number().int().positive() });
    const { tokens } = schema.parse(req.body);
    const sponsor = await prisma.brandSponsor.findUnique({ where: { id: req.params.id } });
    if (!sponsor) throw new AppError('Sponsor not found', 404);
    if (sponsor.kybStatus !== 'approved') throw new AppError('Sponsor must pass KYB first', 403);
    const updated = await prisma.brandSponsor.update({ where: { id: sponsor.id }, data: { tokenEscrow: { increment: tokens } } });
    res.json({ tokenEscrow: updated.tokenEscrow });
  } catch (err) { next(err); }
});

sponsorsRouter.post('/giveaways', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const schema = z.object({
      sponsorId: z.string().uuid(),
      favoriteId: z.string().uuid(),
      prizeKind: z.enum(['cash', 'tokens']),
      poolAmount: z.number().positive().optional(),
      tokenPrize: z.number().int().positive().optional(),
      winnerCount: z.number().int().min(1).max(100),
      scoreWindowDays: z.number().int().min(7).max(90).default(30),
      entryOpensAt: z.coerce.date(),
      entryClosesAt: z.coerce.date(),
      countryFilter: z.string().optional(),
      label: z.string().min(3).max(60),
    });
    const data = schema.parse(req.body);
    const sponsor = await prisma.brandSponsor.findUnique({ where: { id: data.sponsorId } });
    if (!sponsor || sponsor.kybStatus !== 'approved') throw new AppError('Approved sponsor required', 403);
    const fav = await prisma.favoriteProfile.findUnique({ where: { id: data.favoriteId } });
    if (!fav) throw new AppError('Favorite not found', 404);
    if (data.entryClosesAt <= data.entryOpensAt) throw new AppError('Entry close must be after entry open');
    if (data.prizeKind === 'cash' && !data.poolAmount) throw new AppError('Cash prize needs poolAmount');
    if (data.prizeKind === 'tokens' && !data.tokenPrize) throw new AppError('Token prize needs tokenPrize');

    const giveaway = await prisma.giveaway.create({
      data: {
        favoriteId: data.favoriteId,
        poolAmount: data.prizeKind === 'cash' ? data.poolAmount! : 0,
        winnerCount: data.winnerCount,
        prizeKind: data.prizeKind,
        tokenPrize: data.prizeKind === 'tokens' ? data.tokenPrize! : 0,
        sponsorId: sponsor.id,
        sponsorLabel: data.label,
        scoreWindowDays: data.scoreWindowDays,
        entryOpensAt: data.entryOpensAt,
        entryClosesAt: data.entryClosesAt,
        countryFilter: data.countryFilter,
        fee: data.prizeKind === 'cash' ? data.poolAmount! * PLATFORM_FEE_RATE : 0,
        status: 'draft',
      },
    });
    res.status(201).json({ giveaway });
  } catch (err) { next(err); }
});

sponsorsRouter.post('/giveaways/:id/fund', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const giveaway = await prisma.giveaway.findUnique({ where: { id: req.params.id } });
    if (!giveaway) throw new AppError('Giveaway not found', 404);
    if (!giveaway.sponsorId) throw new AppError('Not a sponsored giveaway', 400);
    if (giveaway.status !== 'draft') throw new AppError('Giveaway already funded', 409);

    if (giveaway.prizeKind === 'tokens') {
      const needed = giveaway.tokenPrize * giveaway.winnerCount;
      const ok = await prisma.$transaction(async (tx) => {
        const debited = await tx.brandSponsor.updateMany({
          where: { id: giveaway.sponsorId!, tokenEscrow: { gte: needed } },
          data: { tokenEscrow: { decrement: needed } },
        });
        if (debited.count === 0) throw new AppError('Sponsor token escrow insufficient', 402);
        return tx.giveaway.update({ where: { id: giveaway.id }, data: { status: 'funded' } });
      });
      return res.json({ giveaway: ok, escrowedTokens: needed });
    }
    const updated = await prisma.giveaway.update({ where: { id: giveaway.id }, data: { status: 'funded' } });
    res.json({ giveaway: updated, escrowAmount: giveaway.poolAmount + giveaway.fee });
  } catch (err) { next(err); }
});

sponsorsRouter.post('/giveaways/:id/settle-tokens', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const giveaway = await prisma.giveaway.findUnique({ where: { id: req.params.id } });
    if (!giveaway) throw new AppError('Giveaway not found', 404);
    if (giveaway.prizeKind !== 'tokens') throw new AppError('Not a token-prize giveaway', 400);
    if (giveaway.status !== 'drawn') throw new AppError('Draw first', 409);

    const winners = await prisma.giveawayEntry.findMany({
      where: { giveawayId: giveaway.id, isWinner: true },
    });
    const result = await prisma.$transaction(async (tx) => {
      for (const w of winners) {
        await tx.tokenWallet.update({
          where: { userId: w.userId },
          data: { giftedBalance: { increment: giveaway.tokenPrize } },
        });
      }
      return tx.giveaway.update({ where: { id: giveaway.id }, data: { status: 'paid' } });
    });
    for (const w of winners) {
      await notify({
        userId: w.userId,
        type: 'giveaway_tokens_credited',
        title: 'Your Token prize is in your wallet 🎁',
        body: 'Prize Tokens sit in your gifted balance and can be spent on Gifts. They cannot be withdrawn.',
        data: { giveawayId: giveaway.id, tokens: giveaway.tokenPrize },
      });
    }
    res.json({ paid: winners.length, tokensPerWinner: giveaway.tokenPrize, giveaway: result });
  } catch (err) { next(err); }
});

sponsorsRouter.get('/', async (req, res, next) => {
  try {
    const sponsors = await prisma.brandSponsor.findMany({
      where: { kybStatus: 'approved' },
      select: { id: true, name: true, countryCode: true },
    });
    res.json({ sponsors });
  } catch (err) { next(err); }
});
