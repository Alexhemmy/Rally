import { prisma } from '../../utils/prisma';
import crypto from 'crypto';

/** Verify Paystack signature: HMAC SHA512 of raw body with secret key */
export function verifyPaystackSignature(rawBody: string, signature: string | undefined): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY || '';
  if (!secret || !signature) return process.env.NODE_ENV !== 'production';
  const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  return hash === signature;
}

/** Idempotent credit: only complete pending purchase once */
export async function creditTokensFromProvider(opts: {
  reference: string;
  provider: string;
  amountCents?: number;
  metadata?: Record<string, string>;
}) {
  const existing = await prisma.tokenPurchase.findFirst({
    where: { OR: [{ id: opts.reference }, { paymentProvider: opts.provider }] },
  });

  // Prefer lookup by storing reference in a field — use paymentProvider + tokens match via metadata
  const purchase = await prisma.tokenPurchase.findFirst({
    where: {
      status: 'pending',
      paymentProvider: opts.provider,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fallback: find by id if reference is purchase id
  const byId = await prisma.tokenPurchase.findUnique({ where: { id: opts.reference } }).catch(() => null);
  const target = byId || purchase;

  if (!target) {
    // Create completed purchase from webhook metadata pack
    const packId = opts.metadata?.packId;
    const userId = opts.metadata?.userId;
    if (!userId) return { ok: false, reason: 'no_purchase' };

    let tokens = Number(opts.metadata?.tokens || 0);
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
          currency: opts.metadata?.currency || 'NGN',
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

  if (target.status === 'completed') return { ok: true, tokens: target.tokens, idempotent: true };

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
