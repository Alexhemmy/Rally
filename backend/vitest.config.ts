import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Load .env before tests so DATABASE_URL / JWT_SECRET are set.
    setupFiles: ['./tests/setup-env.ts'],
    include: ['tests/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    // Sequential: integration tests share one database.
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
  },
});
