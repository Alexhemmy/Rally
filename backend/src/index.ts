import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

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
import { errorHandler } from './middleware/errorHandler';
import { log } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(morgan('dev'));
// Capture the raw body for webhook endpoints so provider signatures
// (computed over the exact bytes sent) can be verified correctly.
app.use(express.json({
  limit: '2mb',
  verify: (req: any, _res, buf) => {
    if (req.originalUrl?.startsWith('/api/webhooks')) {
      req.rawBody = buf.toString('utf8');
    }
  },
}));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'rally-api', version: '1.0.0' });
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

app.use(errorHandler);

app.listen(PORT, () => {
  log('info', 'api_listen', { port: Number(PORT) });
});
