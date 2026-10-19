import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate, optionalAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { notify } from '../services/notifications';

/**
 * Phase 3 — Predictions with prizes where legal.
 * Prize Tokens are credited to the winner's gifted balance (spend on
 * Gifts only — never withdrawable). Enabled only on the legal allowlist.
 */
export const predictionsRouter = Router();

function legalCountries(): string[] {
  return (process.env.PREDICTION_LEGAL_COUNTRIES || 'NG,GB,US,CA')
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);
}

predictionsRouter.get('/legal', (_req, res) => {
  res.json({ countries: legalCountries() });
});

predictionsRouter.post('/', authenticate, async (req, res, next) => {
  try {
    if (!req.user!.roles.includes('ADMIN')) throw new AppError('Admin only', 403);
    const schema = z.object({
      favoriteAId: z.string().uuid(),
      favoriteBId: z.string().uuid(),
      question: z.string().min(5).max(200),
      closesAt: z.coerce.date(),
      prizeKind: z.enum(['none', 'tokens']).default('tokens'),
      tokenPrize: z.number().int().min(1).max(1000).default(50),
      countryCode: z.string().length(2),
    });
    const data = schema.parse(req.body);
    if (!legalCountries().includes(data.countryCode.toUpperCase())) {
      throw new AppError('Prediction prizes are not available in that market', 403);
    }
    if (data.favoriteAId === data.favoriteBId) throw new AppError('Pick two different Favorites');
    if (data.closesAt <= new Date()) throw new AppError('Close time must be in the future');
    const prediction = await prisma.prediction.create({ data: { ...data, countryCode: data.countryCode.toUpperCase() } });
    res.status(201).json({ prediction });
  } catch (err) { next(err); }
});

predictionsRouter.get('/', async (req, res, next) => {
  try {
    const status = (req.query.status as string) || 'open';
    const predictions = await prisma.prediction.findMany({
      where: { status },
      orderBy: { closesAt: 'asc' },
      take: 50,
    });
    const favIds = [...new Set(predictions.flatMap((p) => [p.favoriteAId, p.favoriteBId]))];
    const favs = await prisma.favoriteProfile.findMany({ where: { id: { in: favIds } }, select: { id: true, userId: true } });
    const users = await prisma.user.findMany({
      where: { id: { in: favs.map((f) => f.userId) } },
      select: { id: true, displayName: true, handle: true },
    });
    const nameById = new Map(favs.map((f) => [f.id, users.find((u) => u.id === f.userId)?.displayName ?? 'Favorite']));
    res.json({
      predictions: predictions.map((p) => ({
        id: p.id,
        question: p.question,
        closesAt: p.closesAt,
        prizeKind: p.prizeKind,
        tokenPrize: p.tokenPrize,
        countryCode: p.countryCode,
        status: p.status,
        favoriteAName: nameById.get(p.favoriteAId),
        favoriteBName: nameById.get(p.favoriteBId),
      })),
    });
  } catch (err) { next(err); }
});

predictionsRouter.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const prediction = await prisma.prediction.findUnique({ where: { id: req.params.id } });
    if (!prediction) throw new AppError('Prediction not found', 404);
    const entryCount = await prisma.predictionEntry.count({ where: { predictionId: prediction.id } });
    let own = null;
    if (req.user) {
      const e = await prisma.predictionEntry.findUnique({
        where: { predictionId_userId: { predictionId: prediction.id, userId: req.user.userId } },
      });
      own = e ? { choice: e.choice, isCorrect: e.isCorrect, prizeAwarded: e.prizeAwarded } : null;
    }
    res.json({ prediction, entryCount, own });
  } catch (err) { next(err); }
});

predictionsRouter.post('/:id/enter', authenticate, async (req, res, next) => {
  try {
    const schema = z.object({ choice: z.enum(['a', 'b']) });
    const { choice } = schema.parse(req.body);
    const prediction = await prisma.prediction.findUnique({ where: { id: req.params.id } });
    if (!prediction) throw new AppError('Prediction not found', 404);
    if (prediction.status !== 'open') throw new AppError('Prediction is closed', 409);
    if (new Date() >= prediction.closesAt) throw new AppError('Entry window closed', 409);
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) throw new AppError('Authentication required', 401);
    if (user.isMinor) throw new AppError('Minors cannot enter predictions', 403);
    const country = (user.countryCode || 'NG').toUpperCase();
    if (prediction.prizeKind === 'tokens' && !legalCountries().includes(country)) {
      throw new AppError('Token prizes are not available in your market', 403);
    }
    const entry = await prisma.predictionEntry.upsert({
      where: { predictionId_userId: { predictionId: prediction.id, userId: user.id } },
      create: { predictionId: prediction.id, userId: user.id, choice },
      update: { choice },
    });
    res.status(201).json({ entry: { id: entry.id, choice: entry.choice } });
  } catch (err) { next(err); }
});

predictionsRouter.post('/:id/settle', authenticate, async (req, res, next) => {
  try {
    if (!req.user!.roles.includes('ADMIN')) throw new AppError('Admin only', 403);
    const schema = z.object({ outcome: z.enum(['a', 'b']) });
    const { outcome } = schema.parse(req.body);
    const prediction = await prisma.prediction.findUnique({ where: { id: req.params.id } });
    if (!prediction) throw new AppError('Prediction not found', 404);
    if (prediction.status === 'settled') throw new AppError('Already settled', 409);

    const entries = await prisma.predictionEntry.findMany({ where: { predictionId: prediction.id } });
    const winners = entries.filter((e) => e.choice === outcome);
    await prisma.$transaction(async (tx) => {
      await tx.prediction.update({
        where: { id: prediction.id },
        data: { status: 'settled', outcome, settledAt: new Date() },
      });
      for (const e of entries) {
        await tx.predictionEntry.update({
          where: { id: e.id },
          data: { isCorrect: e.choice === outcome, prizeAwarded: e.choice === outcome && prediction.prizeKind === 'tokens' },
        });
      }
      if (prediction.prizeKind === 'tokens') {
        for (const w of winners) {
          await tx.tokenWallet.update({
            where: { userId: w.userId },
            data: { giftedBalance: { increment: prediction.tokenPrize } },
          });
        }
      }
    });
    for (const w of winners) {
      await notify({
        userId: w.userId,
        type: 'prediction_won',
        title: 'Your prediction was right! 🏆',
        body: prediction.prizeKind === 'tokens'
          ? prediction.tokenPrize + ' prize Tokens were added to your gifted balance.'
          : 'You earned the prediction badge.',
        data: { predictionId: prediction.id },
      });
    }
    res.json({ settled: true, winners: winners.length, outcome });
  } catch (err) { next(err); }
});
