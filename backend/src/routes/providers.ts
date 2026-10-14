import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { createTokenCheckout, verifyPayment } from '../services/payments';
import { startFavoriteKyc, getKycStatus } from '../services/kyc';
import { createLiveSession } from '../services/live';
import { listLocales, translateText } from '../services/i18n';
import { providersConfig } from '../config/providers';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

export const providersRouter = Router();

providersRouter.get('/config', (_req, res) => {
  res.json({
    payments: {
      primary: providersConfig.payments.primary,
      byCountry: providersConfig.payments.byCountry,
      publicKeys: {
        paystack: providersConfig.payments.paystack.publicKey || null,
        flutterwave: providersConfig.payments.flutterwave.publicKey || null,
      },
    },
    kyc: { primary: providersConfig.kyc.primary },
    live: { primary: providersConfig.live.primary },
    i18n: listLocales(),
  });
});

providersRouter.post('/payments/checkout', authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      amountCents: z.number().int().positive(),
      currency: z.string().default('NGN'),
      countryCode: z.string().length(2).optional(),
      packId: z.string().optional(),
    });
    const data = schema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    const result = await createTokenCheckout({
      userId: req.user!.userId,
      amountCents: data.amountCents,
      currency: data.currency,
      email: user?.email || undefined,
      countryCode: data.countryCode || user?.countryCode || undefined,
      metadata: data.packId ? { packId: data.packId } : undefined,
    });
    res.json({ checkout: result });
  } catch (err) {
    next(err);
  }
});

providersRouter.post('/payments/verify', authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      provider: z.enum(['paystack', 'flutterwave', 'stripe', 'mock']),
      reference: z.string(),
    });
    const data = schema.parse(req.body);
    const ok = await verifyPayment(data.provider, data.reference);
    res.json({ verified: ok });
  } catch (err) {
    next(err);
  }
});

providersRouter.post('/kyc/start', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    const session = await startFavoriteKyc(req.user!.userId, user?.countryCode || undefined);
    await prisma.favoriteProfile.updateMany({
      where: { userId: req.user!.userId },
      data: { verificationStatus: 'PENDING' },
    });
    res.json({ session });
  } catch (err) {
    next(err);
  }
});

providersRouter.get('/kyc/:sessionId', authenticate, async (req, res, next) => {
  try {
    const status = await getKycStatus(req.params.sessionId);
    res.json({ status });
  } catch (err) {
    next(err);
  }
});

providersRouter.post('/live/rooms', authenticate, async (req, res, next) => {
  try {
    const profile = await prisma.favoriteProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) throw new AppError('Favorite profile required', 403);
    const room = await createLiveSession(profile.id, req.user!.userId);
    res.status(201).json({ room });
  } catch (err) {
    next(err);
  }
});

providersRouter.get('/i18n/locales', (_req, res) => {
  res.json(listLocales());
});

providersRouter.post('/i18n/translate', async (req, res, next) => {
  try {
    const schema = z.object({
      text: z.string().min(1).max(5000),
      targetLang: z.string().min(2).max(8),
      sourceLang: z.string().optional(),
    });
    const data = schema.parse(req.body);
    const result = await translateText(data.text, data.targetLang, data.sourceLang);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
