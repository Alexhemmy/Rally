import { prisma } from '../../utils/prisma';
import crypto from 'crypto';

/** Verify Paystack signature: HMAC SHA512 of raw body with secret key */
export function verifyPaystackSignature(rawBody: string, signature: string | undefined): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY || '';
  if (!secret || !signature) return process.env.NODE_ENV !== 'production';
  const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(hash, 'hex'),
    Buffer.from(signature, 'hex')
  );
}

/**
 * Idempotent credit: only complete a purchase once, and only the purchase
 * that belongs to the user/pack named in the webhook metadata.
 */
export async function creditTokensFromProvider(opts: {
  reference: string;
  provider: string;
  amountCents?: number;
  metadata?: Record<string, string>;
}) {
  const meta = opts.metadata || {};
  const userId = meta.userId;

  // 1. Exact match: purchase created for this reference
  const byReference = await prisma.tokenPurchase
    .findUnique({ where: { id: opts.reference } })
    .catch(() => null);

  // 2. Pending purchase for THIS user and THIS pack (never another user's)
  const pendingForUser = userId
    ? await prisma.tokenPurchase.findFirst({
        where: {
          status: 'pending',
          paymentProvider: opts.provider,
          userId,
          ...(meta.packId ? { packId: meta.packId } : {}),
        },
        orderBy: { createdAt: 'desc' },
      })
    : null;

  const target = byReference || pendingForUser;

  if (target && target.status === 'completed') {
    return { ok: true, tokens: target.tokens, idempotent: true };
  }

  if (target) {
    await prisma.$transaction([
      prisma.tokenPurchase.update({
        where: { id: target.id },
        data: { status: 'completed', paymentProvider: opts.provider },
      }),
      prisma.tokenWallet.upsert({
        where: { userId: target.userId },
        create: {
          userId: target.userId,
          balance: target.tokens,
          totalPurchased: target.tokens,
        },
        update: {
          balance: { increment: target.tokens },
          totalPurchased: { increment: target.tokens },
        },
      }),
    ]);
    return { ok: true, tokens: target.tokens };
  }

  // 3. No purchase record: create one from webhook metadata — requires userId
  if (!userId) return { ok: false, reason: 'no_purchase' };

  const packId = meta.packId;
  let tokens = Number(meta.tokens || 0);
  if (packId) {
    const pack = await prisma.tokenPack.findUnique({ where: { id: packId } });
    if (pack) tokens = pack.tokens + pack.bonusTokens;
  }
  if (tokens <= 0) return { ok: false, reason: 'no_tokens' };

  await prisma.$transaction([
    prisma.tokenPurchase.create({
      data: {
        id: opts.reference.length === 36 ? opts.reference : undefined,
        userId,
        packId: packId || undefined,
        tokens,
        amountCents: opts.amountCents || 0,
        currency: meta.currency || 'NGN',
        paymentMethod: 'card',
        paymentProvider: opts.provider,
        status: 'completed',
      },
    }),
    prisma.tokenWallet.upsert({
      where: { userId },
      create: { userId, balance: tokens, totalPurchased: tokens },
      update: { balance: { increment: tokens }, totalPurchased: { increment: tokens } },
    }),
  ]);
  return { ok: true, tokens };
}
