import dotenv from 'dotenv';
import { buildApp } from './app';
import { log } from './utils/logger';

dotenv.config();

const app = buildApp();
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  log('info', 'api_listen', { port: Number(PORT) });
});
