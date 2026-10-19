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
- [x] Phone OTP + Google/Apple social login wiring — ACC-1 (routes + service shipped; wire real SMS/JWKS providers)
- [ ] Push/email notification delivery (models + API in place) — NTF-1/2
- [ ] Real KYC provider — GFT-13
- [x] Subscriptions, store, giveaways, rivalries, fan-to-fan gifts — Phase 2 (P1) (see P1 table below)

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

---

## Phase 2 (P1) API — shipped

| Area | Base path | PRD refs | Highlights |
| --- | --- | --- | --- |
| Giveaways | `/api/giveaways` | GVW-1..7 | Non-monetary fan scores (activeness/dedication/passion, no spend data), percentile composite C, weight W = 1 + 4C, seeded weighted draw without replacement, seedHash committed at announce / seed revealed at draw, 3% platform fee, 14d account + 7d follow eligibility, minors blocked, score bands only (never exact scores) |
| Fan-to-Fan Gifting | `/api/fangifts` | FFG-1..8 | Cosmetic fan gifts, escrowed Token transfers (72h accept window, recoverable), decline refunds, gifted tokens land in restricted giftedBalance, minors blocked, verified phone required for token gifts, daily send limit |
| Gift spend order | `/api/gifts` | FFG-7 | Fan-gifted tokens are spent FIRST, then purchased balance (atomic guards) |
| Fan Upgrade Path | `/api/upgrades` | UPG-1..5 | Non-monetary progress signals (account age, verified+18, 10 published, 100 followers, 50 engagers/60d, no strikes), application with declared links, admin approve/conditional/reject, 30-day probation on upgrade |
| Fan Club Subscriptions | `/api/subscriptions` | SUB-1/2/6 | Max 5 tiers per Favorite, perks, mock payment (wire Stripe/Paystack), subscribe/cancel/pause, ~10% platform fee to Earning |
| Store & Commissions | `/api/store` | SUB-3..5 | Item CRUD, orders with delivery window + due date, delivery proof makes Earning available, auto-refund on missed window, buyer library; store services never exchangeable for Gifts |
| Fan Moments | `/api/fanmoments` | MOM-4 | Fans submit (type FAN, unapproved), Favorite/moderator approval queue, approve/hide/feature, fan credited on approval |
| Collections | `/api/collections` | MOM-5 | CRUD, add/remove Moments, private/public, shareable public view |
| Leaderboards | `/api/leaderboards` | REC-3 | Weekly/monthly/all-time per-Favorite supporter boards; anonymous fans appear as Anonymous Fan with rank only |
| Team Roles | `/api/team` | ACC-7 | Invite manager/moderator with scoped permissions, per-member audit log, update/remove |
| Rivalries | `/api/rivalries` | RIV-1..6 | Admin-documented sourced rivalries (neutral page always), interactive face-offs only when BOTH rivals opt in, Beef Radar heat 1..5, one vote per user, minors blocked from voting |

### Deployment TODOs

- Payments: replace the mock charge in `subscriptions.ts` / `store.ts` with Stripe/Paystack + webhook verification.
- Giveaway seed storage: keep the secret seed in a vault/KMS rather than process memory for multi-instance deployments.
- Push/email adapters: set `PUSH_ADAPTER=fcm`, `EMAIL_ADAPTER=ses|resend` and wire providers in `services/notifications.ts`.
- SMS: set `SMS_PROVIDER=twilio|termii` and wire `services/otp.ts`.
- Face-off votes: migrate the one-vote marker to a dedicated `FaceOffVote` table before production load.

## Tests

Backend tests use Vitest + Supertest against your local Postgres:

```bash
cd backend
npm install
cp .env.example .env        # set DATABASE_URL + JWT_SECRET
npx prisma migrate dev      # (or db push for a scratch DB)
npm test
```

- `tests/giveaway-engine.test.ts` — pure unit tests for the GVW weighted draw (determinism, no-replacement, weight bounds, score bands).
- `tests/p1.test.ts` — integration flows for every Phase 2 feature: FFG escrow, GVW lifecycle with seed reveal, UPG gates, SUB tier caps + fees, store delivery/auto-refund, fan-moment approval, collections privacy, anonymous leaderboards, team permissions, rivalry opt-in + one-vote face-offs.

Tests clean up all rows they create (handles prefixed `p1t_`). Prefer a scratch database over your dev DB.

---

## Phase 3 (P2) API — shipped

| Area | Base path | PRD refs | Highlights |
| --- | --- | --- | --- |
| Junior Favorites | `/api/junior` | UPG-7 | 16–17 program with guardian consent code (hashed), admin review, approved → Junior FavoriteProfile; NO payouts, NO giveaways, NO cash prizes; revocable |
| Brand partnerships | `/api/sponsors` | Q31/Q33 | Brand KYB, token escrow, sponsor-funded giveaways (cash or token prizes), clear sponsor labeling; token prizes credit winners' giftedBalance only (never withdrawable, blocks gift-back loops) |
| Live sessions | `/api/live` | GFT-10 | Schedule/start/pause/resume/end, join + attendance, live gifting (wallet debit, 0.6 Gift Points, minor limit, self-gift block), live leaderboard, pause switch blocks gifting |
| Merch fulfillment | `/api/merch` | SUB-3..5 (merch) | Fulfillment partners, items with delivery window, orders with tracking, ~10% platform fee, refund after missed window, buyer library + Favorite fulfillment queue; never exchangeable for Gifts |
| Predictions | `/api/predictions` | 7.x | Head-to-head predictions with token prizes where legal (allowlist via `PREDICTION_LEGAL_COUNTRIES`, default NG,GB,US,CA), minors blocked, prizes to giftedBalance |
| City ranking lanes | `/api/city-rankings` | RNK | Monthly lanes per city ranked by UNIQUE local supporters (never spend volume), movement vs previous snapshot, admin snapshot refresh |
| Public API v1 | `/api/public` | 12 | Embeddable Favorite card (JSON + `?format=html`), public rankings, giveaway results, trust stats, trends; in-memory rate limit 120 req/5min |
| Junior safety gates | `/api/payouts`, `/api/giveaways` | UPG-7 | Junior Favorites blocked from payout requests and giveaway creation |

### P2 Web pages

- `/live` — session browser + host controls (start/pause/resume/end), join, live gifting, live leaderboard
- `/merch` — browse a Favorite's merch, order with shipping address, tracking, confirm delivery, refund after missed window, Favorite fulfillment queue
- `/predictions` — open predictions, pick a side, legal markets shown
- `/city-rankings` — city lanes with movement indicators
- `/junior` — Junior Favorite application + guardian consent verification
- `/sponsors` — brand KYB application, approved sponsor list, admin tools (approve/reject, escrow, fund, settle token prizes)

### P2 Mobile screens

- `live` — sessions, host controls, join, quick gifts, leaderboard
- `merch` — order library, confirm delivery, refund
- `predictions`, `cityrankings`, `junior` — full P2 fan flows on the go

### Remaining production TODOs (all phases)

- Wire real providers: SMS (Twilio/Termii), push (FCM), email (SES/Resend), Apple JWKS, real KYC/KYB, payment processors (keys already read from env).
- Public API: move to API-key auth (issuable keys table) once partners onboard; rate limiting should move to Redis for multi-instance.
- i18n: `nameI18n` fields exist on taxonomy tables; ship translated catalogs per locale as a deployment concern.
- Giveaway draw seed: vault/KMS storage for multi-instance deployments.

---

## P3 — Security hardening

A platform-wide pass against hacking, injection, phishing, brute force, and account takeover.

| Layer | Control | Details |
| --- | --- | --- |
| Brute force | Login lockout | 5 failed attempts → 15-minute lock (HTTP 423), reset on success; per-IP limiter (20/15 min) on login, register, social, and reset endpoints |
| Account takeover | TOTP 2FA (RFC 6238) | Hand-rolled HMAC-SHA1 TOTP with ±1 step window; one-time recovery codes (SHA-256 hashed, shown once); 5-minute scoped challenge tokens |
| Sessions | Global revoke | JWTs carry a `tv` (tokenVersion) claim; password change / reset / revoke-all bumps it so every previously issued token dies instantly |
| Phishing | Anti-phishing stance | All security notifications state Rally never asks for passwords, codes, or Gifts in messages; public `/api/security/phishing-guide`; reset links are single-use, hashed at rest, 30-minute expiry |
| Injection | Input defense | Zod schemas on every route (as before); `sanitizeText` control-char stripper; Prisma parameterized queries (no raw SQL anywhere); embed HTML is fully output-escaped |
| XSS/headers | Hardened headers | Helmet CSP, HSTS, noSniff, frameguard, cross-origin policy; React/RN render escaping on all user content |
| CSRF-ish abuse | Origin guard | State-changing /api requests from browsers are rejected unless Origin/Referer matches `APP_ORIGINS`/`CORS_ORIGIN` (webhooks and non-browser clients exempt) |
| API abuse | Rate limiting | Global 600 req/5 min/IP across /api (webhooks excluded); /api/auth stricter; public API 120/5min anonymous vs 1000/5min per API key |
| Public API | API keys | `rly_live_…` keys, SHA-256 hashed at rest, shown once, revocable, max 10 active per user, per-key usage tracking |
| Audit | Security events | Immutable `SecurityEvent` trail: logins (incl. method/IP/UA), failed attempts, lockouts, password changes, 2FA changes, revocations, API key lifecycle; user history + admin feed with lock/unlock controls |
| Enumeration | Anti-enumeration | Generic credential errors with constant-ish delay; reset request always 200; password strength checks on register/change/reset |

### Endpoints

- `/api/auth/login` — returns `{ twoFactorRequired, challengeToken }` when 2FA is on → `POST /api/auth/login/2fa` with TOTP or recovery code
- `/api/security/*` — overview, events, sessions, revoke-all, password change, 2FA setup/enable/disable, recovery-code regeneration, API key CRUD, admin lock/unlock, phishing guide
- `/api/public/v1/*` — now accepts `Authorization: Bearer rly_live_…` for partner rate limits

### UI

- Web: `/security` page (2FA wizard, recovery codes, password change, session list, revoke-all, API keys, recent security events), login 2FA challenge, reset-token confirm flow on `/forgot-password`
- Mobile: Security screen (2FA, password change, sessions, events) + login 2FA challenge

### Production checklist

- Set a strong `JWT_SECRET` (32+ random bytes) — never ship `dev-secret`.
- Set `CORS_ORIGIN` and `APP_ORIGINS` to your real web origins so the origin guard activates.
- Move rate-limit buckets to Redis for multi-instance deployments.
- Add device fingerprinting + new-device email alerts on top of `SecurityEvent` logins.
- Wire the SMS/email providers so recovery-code and lockout notifications actually deliver.
- CI (security workflow) runs `npm audit` and a secret-pattern scan on every push.
