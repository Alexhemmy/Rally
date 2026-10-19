import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { verifyPaystackSignature, creditTokensFromProvider } from '../services/payments/webhooks';

export const webhooksRouter = Router();

/** Raw body captured by express.json verify() */
function rawBodyOf(req: Request): string {
  return (req as any).rawBody ?? JSON.stringify(req.body);
}

function verifyFlutterwaveSignature(rawBody: string, signature: string | undefined): boolean {
  const secret = process.env.FLUTTERWAVE_SECRET_KEY || '';
  if (!secret || !signature) return process.env.NODE_ENV !== 'production';
  const hash = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(signature, 'hex'));
}

/** Stripe-style signature: "t=timestamp,v1=hex" over "${t}.${rawBody}" */
function verifyStripeSignature(rawBody: string, signature: string | undefined): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
  if (!secret || !signature) return process.env.NODE_ENV !== 'production';
  const parts = Object.fromEntries(
    signature.split(',').map((kv) => kv.split('=') as [string, string])
  );
  if (!parts.t || !parts.v1) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${parts.t}.${rawBody}`)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(parts.v1, 'hex'));
}

// Paystack
webhooksRouter.post('/paystack', async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'] as string | undefined;
    if (!verifyPaystackSignature(rawBodyOf(req), signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    const event = req.body;
    if (event?.event === 'charge.success') {
      const data = event.data || {};
      const reference = data.reference || data.id;
      const meta = data.metadata || {};
      await creditTokensFromProvider({
        reference: String(reference),
        provider: 'paystack',
        amountCents: data.amount,
        metadata: {
          userId: meta.userId,
          packId: meta.packId,
          tokens: String(meta.tokens || ''),
          currency: data.currency,
        },
      });
    }
    res.json({ received: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'webhook_failed' });
  }
});

// Flutterwave
webhooksRouter.post('/flutterwave', async (req, res) => {
  try {
    const signature = req.headers['verif-hash'] as string | undefined;
    if (!verifyFlutterwaveSignature(rawBodyOf(req), signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    const event = req.body;
    if (event?.event === 'charge.completed' || event?.status === 'successful') {
      const data = event.data || event;
      await creditTokensFromProvider({
        reference: String(data.tx_ref || data.id),
        provider: 'flutterwave',
        amountCents: Math.round(Number(data.amount || 0) * 100),
        metadata: data.meta || {},
      });
    }
    res.json({ received: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'webhook_failed' });
  }
});

// Stripe
webhooksRouter.post('/stripe', async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'] as string | undefined;
    if (!verifyStripeSignature(rawBodyOf(req), signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    const event = req.body;
    if (event?.type === 'payment_intent.succeeded') {
      const pi = event.data?.object || {};
      await creditTokensFromProvider({
        reference: String(pi.id),
        provider: 'stripe',
        amountCents: pi.amount,
        metadata: pi.metadata || {},
      });
    }
    res.json({ received: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'webhook_failed' });
  }
});
