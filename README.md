# Rally – Fan Support Platform

**Stack:** React Native (mobile) · Next.js + TypeScript (web) · Node.js/Express + PostgreSQL (backend)

Based on PRD Draft v1.0 (October 14, 2026).

## Monorepo Layout

```
rally/
├── backend/          # Express + Prisma + PostgreSQL API
├── web/              # Next.js App Router (TypeScript)
├── mobile/           # React Native (Expo)
├── docs/             # Architecture notes
└── scripts/          # Dev helpers
```

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- (Optional) Docker for local Postgres

## Quick Start – Backend

```bash
cd backend
cp .env.example .env
# Edit DATABASE_URL if needed

npm install
npx prisma generate
npx prisma db push
npm run db:seed

npm run dev
# API: http://localhost:4000
# Health: http://localhost:4000/health
```

### Demo accounts (after seed)

| Handle | Password     | Role              |
|--------|--------------|-------------------|
| ada    | password123  | Fan               |
| mia    | password123  | Favorite (verified)|

### Key API Endpoints (MVP)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register fan or Favorite |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET | `/api/favorites/:handle` | Favorite page + supporter wall |
| POST | `/api/favorites/apply` | Become a Favorite |
| GET | `/api/tokens/packs` | Token packs |
| POST | `/api/tokens/purchase` | Buy tokens (mock payment) |
| GET | `/api/tokens/wallet` | Wallet balance |
| GET | `/api/gifts/catalog` | Gift catalog |
| POST | `/api/gifts/send` | Send a gift |
| POST | `/api/moments` | Create Moment |
| GET | `/api/moments/favorite/:handle` | Favorite Moments timeline |
| GET | `/api/feed/home` | Home feed |

## Web (Next.js)

```bash
cd web
npm install
npm run dev
# http://localhost:3000
```

## Mobile (Expo)

```bash
cd mobile
npm install
npx expo start
```

## MVP Scope Implemented (Foundation)

- [x] Accounts & identity (email/password, roles)
- [x] Favorite profile pages + supporter wall
- [x] Token wallet & packs
- [x] Gift catalog & send gift flow
- [x] Gift Points → earnings ledger
- [x] Basic Moments (create, list, react)
- [x] Home feed (followed Favorites)
- [x] Follow graph
- [x] Prisma schema covering taxonomy, campaigns, payouts, reports, badges
- [ ] Payment provider integration (currently mock)
- [ ] Real KYC / verification workflow
- [ ] Subscriptions (P1)
- [ ] Community space (P1)
- [ ] Multi-language i18n wiring
- [ ] Rankings & Rivalries (P1)

## Architecture Notes

- **Ledger:** Double-entry style via `Earning` + `Gift` + `TokenWallet`. Gift Points are the Favorite-side unit convertible to cash.
- **Tokens:** Closed-loop. Fans buy → spend on Gifts. Cannot withdraw or transfer (except restricted Fan-to-Fan gifts in P1).
- **Taxonomy:** Industry → Category → Specialty (admin-managed).
- **Charity campaigns:** Funds go only to verified beneficiaries (schema ready).

## Next Steps

1. Run Postgres (Docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=rally -e POSTGRES_USER=rally -e POSTGRES_DB=rally postgres:16`)
2. `npm install` in backend, generate + push schema, seed
3. Scaffold web UI for Favorite page + gift flow
4. Scaffold mobile screens for the same flows
5. Wire real payment providers (Paystack / Flutterwave / Stripe) behind abstraction

