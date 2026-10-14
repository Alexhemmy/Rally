import { Router, raw, Request, Response, NextFunction } from 'express';
import { verifyPaystackSignature, creditTokensFromProvider } from '../services/payments/webhooks';

export const webhooksRouter = Router();

// Paystack sends JSON; signature over raw body — accept JSON body with header check for MVP
webhooksRouter.post('/paystack', async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'] as string | undefined;
    const rawBody = JSON.stringify(req.body);
    if (!verifyPaystackSignature(rawBody, signature) && process.env.NODE_ENV === 'production') {
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

webhooksRouter.post('/flutterwave', async (req, res) => {
  try {
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

webhooksRouter.post('/stripe', async (req, res) => {
  try {
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
