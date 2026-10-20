# Rally – Fan Support Platform (Mobile)

**Stack:** React Native / Expo (this repo) · Web: [rally-web](https://github.com/Alexhemmy/rally-web) (Next.js) · API: [rally-backend](https://github.com/Alexhemmy/rally-backend) (Express + Prisma + PostgreSQL)

Source of truth for product scope: [docs/PRD.md](docs/PRD.md) — PRD v2.0 (October 14, 2026).

## Repo Layout

```
rally/
├── mobile/           # React Native (Expo) app
├── docs/             # PRD + architecture notes
└── scripts/          # Dev helpers (smoke.sh hits the deployed API)
```

The backend and web apps live in their own repositories:

- **rally-backend** — Express + Prisma + PostgreSQL API (see its README for API reference and tests)
- **rally-web** — Next.js App Router web client (Ink & Frost UI)

## Mobile (Expo)

```bash
cd mobile
npm install
EXPO_PUBLIC_API_URL=http://localhost:4000 npx expo start
```

`EXPO_PUBLIC_API_URL` must point at your backend (rally-backend). On an Android
emulator the default `10.0.2.2` is used automatically when no env var is set.
The in-app Connection screen lets you set/override the API URL at runtime.

## Docker (local Postgres)

`docker compose up -d` starts a local Postgres for the backend repo.

## Smoke test

`scripts/smoke.sh` registers a throwaway account against a running backend
and exercises health, register, token packs, and rankings:

```bash
API_URL=https://your-backend-url scripts/smoke.sh
```

## CI

- **mobile-bundle** — Metro export of every screen (fails on any broken import)
- **mobile-android-apk** — EAS cloud APK build (skips cleanly when `EXPO_TOKEN` is not set)
- **Lockfiles** — auto-commits `mobile/package-lock.json` when `package.json` changes
- **Security** — npm audit + hardcoded-secret pattern scan
