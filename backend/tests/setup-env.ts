import dotenv from 'dotenv';
dotenv.config();

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'dev-secret';
}
if (!process.env.DATABASE_URL) {
  // Fail loudly rather than silently hitting the wrong database.
  throw new Error(
    'DATABASE_URL is not set. Copy backend/.env.example to backend/.env and point it at your test/dev Postgres.'
  );
}
