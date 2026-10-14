# Suggestions implemented (foundation)

1. **Payments** — Webhooks Paystack/Flutterwave/Stripe + idempotent credit (`/api/webhooks/*`)
2. **KYC UI** — `/dashboard/verify` + `/api/providers/kyc/start`
3. **Payouts** — `/api/payouts/request|me` + `/dashboard/payouts` (KYC gate)
4. **Auth** — `/api/auth/refresh`, password-reset request
5. **Sounds** — useSounds + toggle (haptic stand-in; expo-av ready)
6. **Push** — notification model + list API (device push = FCM keys later)
7. **Deep links** — `scheme: rally` + intent filters in app.json
8. **Camera** — compose Moment media menu (wire image-picker in store build)
9. **Biometrics** — `useBiometrics` optional LocalAuthentication
10. **Moderation** — `/api/moderation/report|block` + Support form
11. **Campaigns** — existing API + pages
12. **Rankings** — Rally Score soft-cap `/api/rankings` + live web page
13. **Minors** — `enforceMinorLimits` middleware
14. **i18n** — locale packs `web/messages/en.json|fr.json` + provider locales API
15. **Observability** — JSON `log()` util
16. **Smoke** — `scripts/smoke.sh`
17. **CI** — `.github/workflows/ci.yml`
18. **Docker** — `docker-compose.yml`
19. **Share** — native share sheet (mobile)
20. **Onboarding** — `/onboarding` checklist
21. **Guest tip** — `/api/guest/tip` limited gifts

Wire production provider keys in `.env` before go-live.
