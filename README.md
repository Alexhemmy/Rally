# Rally – Fan Support Platform

**Stack:** React Native (mobile) · Next.js + TypeScript (web) · Node.js/Express + PostgreSQL (backend)

Source of truth for product scope: [docs/PRD.md](docs/PRD.md) — PRD v2.0 (October 14, 2026).

## Monorepo Layout

```
rally/
├── backend/          # Express + Prisma + PostgreSQL API
├── web/              # Next.js App Router (TypeScript)
├── mobile/           # React Native (Expo)
├── docs/             # PRD + architecture notes
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
npm run db:seed             # demo accounts, packs, gifts
npx tsx prisma/seed-taxonomy.ts  # PRD 7.2 launch taxonomy

npm run dev
# API: http://localhost:4000
# Health: http://localhost:4000/health
```

### Demo accounts (after seed)

| Handle | Password     | Role              |
|--------|--------------|-------------------|
| ada    | password123  | Fan               |
| mia    | password123  | Favorite (verified)|

## Key API Endpoints (MVP P0)

| Method | Path | PRD ref | Description |
|--------|------|---------|-------------|
| POST | `/api/auth/register` | ACC-1/2 | Register (one identity, fan and/or Favorite) |
| POST | `/api/auth/login` | | Login |
| GET | `/api/auth/me` | ROL-8 | Current user (Tokens and earnings as separate balances) |
| GET | `/api/discover/taxonomy` | 7.2/CAT | Industry → Category → Specialty tree |
| GET | `/api/discover/search?q=` | DSC-1 | Search by name, handle, specialty |
| GET | `/api/discover/trending` | DSC-2 | Trending Favorites (supporter-based) |
| GET | `/api/discover/categories/:id` | CAT-8 | Category browse; Spotlight for small categories |
| GET | `/api/favorites/:handle` | CAT-12 | Favorite page + supporter wall (REC-3) |
| POST | `/api/favorites/apply` | ACC-3 | Apply to become a Favorite |
| GET | `/api/tokens/packs` | GFT-1 | Token packs (local currency, rate disclosed) |
| POST | `/api/tokens/purchase` | GFT-1 | Buy tokens (mock payment; provider layer in `services/payments`) |
| GET | `/api/tokens/wallet` | ROL-8 | Wallet balance |
| GET | `/api/gifts/catalog` | 7.4 | Gift catalog |
| POST | `/api/gifts/send` | GFT-3, ROL-3, REC-1 | Send a gift (badges auto-awarded, no self-gifting) |
| POST | `/api/moments` | MOM-1 | Create Moment (flash = 24h) |
| GET | `/api/moments/favorite/:handle` | MOM-3 | Favorite Moments timeline |
| GET | `/api/feed/home` | FED-1/2 | Home feed (followed Favorites, chronological) |
| GET | `/api/campaigns` | 7.10 | Charity campaigns (verified beneficiaries) |
| POST | `/api/payouts/request` | GFT-5 | Payout request (KYC-gated, atomic balance check) |
| POST | `/api/providers/payments/checkout` | 9 | Provider checkout (Paystack/Flutterwave/Stripe/mock) |
| POST | `/api/providers/translate` | LNG-3 | One-tap translation |
| POST | `/api/moderation/report` | TNS-1 | Report content |
| GET | `/api/rankings` | 7.13 | Rally Score rankings (cohorts, non-monetary) |

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

## MVP Scope Implemented (P0 per PRD v2.0)

- [x] Accounts & one identity (email/password, roles; phone/social auth fields in schema) — ACC-1/2
- [x] Favorite profile pages + supporter wall — CAT-12, REC-3
- [x] Three-level taxonomy (admin tables + seed) — 7.2
- [x] Discovery: search, taxonomy browse, trending, category Spotlight — DSC-1/2, CAT-8
- [x] Token wallet, packs, purchases (mock + provider abstraction) — GFT-1/2
- [x] Gift catalog & send gift flow (60% Gift Points share) — GFT-3/4
- [x] Gift Points → earnings ledger → payouts (KYC-gated, atomic) — GFT-5
- [x] Automated badges (First Supporter, Day One, Top 10) — REC-1
- [x] Supporter levels & follow graph — REC-2, ROL-1
- [x] Moments (create, timeline, react — idempotent), Home feed — MOM-1..3, FED-1/2
- [x] Charity campaigns with verified beneficiaries (schema + routes) — 7.10
- [x] Moderation: report/block, minor spend caps — TNS-1/6, GFT-8
- [x] Rankings with Rally Score (cohorts, non-monetary) — 7.13
- [x] i18n: message files, translation endpoint, source-language fields — LNG-1..3
- [x] Payment provider layer + signed webhooks (Paystack, Flutterwave, Stripe) — 11
- [ ] Phone OTP + Google/Apple social login wiring — ACC-1
- [ ] Push/email notification delivery (models + API in place) — NTF-1/2
- [ ] Real KYC provider — GFT-13
- [ ] Subscriptions, store, giveaways, rivalries, fan-to-fan gifts — Phase 2 (P1)

## Architecture Notes

- **Ledger:** Double-entry style via `Earning` + `Gift` + `TokenWallet`. Gift Points are the Favorite-side unit convertible to cash only (never back to Tokens — ROL-2).
- **Tokens:** Closed-loop. Fans buy → spend on Gifts. Cannot be withdrawn or sold (GFT-2).
- **Taxonomy:** Industry → Category → Specialty (admin-managed, CAT-1..8). Seeded from PRD 7.2.
- **Webhooks:** Raw-body capture + HMAC signature verification per provider; idempotent crediting scoped to the webhook's user — never another user's pending purchase.
- **Charity campaigns:** Funds go only to verified beneficiaries (schema ready); escrow separation per PRD 5.2.

## Next Steps

1. Run Postgres (Docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=rally -e POSTGRES_USER=rally -e POSTGRES_DB=rally postgres:16`)
2. `npm install` in backend, generate + push schema, seed, seed taxonomy
3. Wire real payment providers (keys already read from env: `PAYSTACK_SECRET_KEY`, `FLUTTERWAVE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
4. Phone OTP (Twilio/termii) + Google/Apple login to finish ACC-1
5. Phase 2 per roadmap: subscriptions, fan upgrade path, giveaways, rivalries
