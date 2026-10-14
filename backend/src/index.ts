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
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));

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

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Rally API listening on http://localhost:${PORT}`);
});
