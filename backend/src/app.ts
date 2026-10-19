import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { favoritesRouter } from './routes/favorites';
import { giftsRouter } from './routes/gifts';
import { tokensRouter } from './routes/tokens';
import { momentsRouter } from './routes/moments';
import { feedRouter } from './routes/feed';
import { campaignsRouter } from './routes/campaigns';
import { notificationsRouter } from './routes/notifications';
import { providersRouter } from './routes/providers';
import { webhooksRouter } from './routes/webhooks';
import { payoutsRouter } from './routes/payouts';
import { moderationRouter } from './routes/moderation';
import { rankingsRouter } from './routes/rankings';
import { guestRouter } from './routes/guest';
import { discoverRouter } from './routes/discover';
// P1 (Phase 2) routers
import { giveawaysRouter } from './routes/giveaways';
import { fangiftsRouter } from './routes/fangifts';
import { upgradesRouter } from './routes/upgrades';
import { subscriptionsRouter } from './routes/subscriptions';
import { storeRouter } from './routes/store';
import { fanmomentsRouter } from './routes/fanmoments';
import { collectionsRouter } from './routes/collections';
import { leaderboardsRouter } from './routes/leaderboards';
import { teamRouter } from './routes/team';
import { rivalriesRouter } from './routes/rivalries';
import { errorHandler } from './middleware/errorHandler';

/**
 * Express app factory — separated from listen() so integration tests
 * (tests/p1.test.ts) can import the app without binding a port.
 */
export function buildApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
  app.use(morgan(process.env.NODE_ENV === 'test' ? 'silent' : 'dev'));
  // Capture the raw body for webhook endpoints so provider signatures
  // (computed over the exact bytes sent) can be verified correctly.
  app.use(express.json({
    limit: '2mb',
    verify: (req: any, _res, buf) => {
      if (req.originalUrl?.startsWith('/api/webhooks')) {
        req.rawBody = buf.toString('utf-8');
      }
    },
  }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'rally-api', version: '2.0.0' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/favorites', favoritesRouter);
  app.use('/api/gifts', giftsRouter);
  app.use('/api/tokens', tokensRouter);
  app.use('/api/moments', momentsRouter);
  app.use('/api/feed', feedRouter);
  app.use('/api/campaigns', campaignsRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/providers', providersRouter);
  app.use('/api/webhooks', webhooksRouter);
  app.use('/api/payouts', payoutsRouter);
  app.use('/api/moderation', moderationRouter);
  app.use('/api/rankings', rankingsRouter);
  app.use('/api/guest', guestRouter);
  app.use('/api/discover', discoverRouter);

  // P1 (Phase 2) routes
  app.use('/api/giveaways', giveawaysRouter);
  app.use('/api/fangifts', fangiftsRouter);
  app.use('/api/upgrades', upgradesRouter);
  app.use('/api/subscriptions', subscriptionsRouter);
  app.use('/api/store', storeRouter);
  app.use('/api/fanmoments', fanmomentsRouter);
  app.use('/api/collections', collectionsRouter);
  app.use('/api/leaderboards', leaderboardsRouter);
  app.use('/api/team', teamRouter);
  app.use('/api/rivalries', rivalriesRouter);

  app.use(errorHandler);
  return app;
}
