# Recommended providers (production)

| Concern | Primary recommendation | Alternative | Config |
|---------|------------------------|-------------|--------|
| Payments (NG/GH/ZA + cards) | **Paystack** | Flutterwave | `PAYMENT_PROVIDER`, `PAYSTACK_*` |
| Payments (multi-Africa) | **Flutterwave** | Paystack | `FLW_*` |
| Payments (US/EU web) | **Stripe** | — | `STRIPE_*` |
| KYC (Africa ID) | **Smile Identity** | Sumsub | `KYC_PROVIDER`, `SMILE_*` |
| KYC (global) | **Sumsub** | Smile | `SUMSUB_*` |
| Live A/V | **LiveKit** | Agora | `LIVE_PROVIDER`, `LIVEKIT_*` / `AGORA_*` |
| Machine translation | **DeepL** | Google Translate | `TRANSLATE_PROVIDER`, keys |
| Locales (launch) | en, fr, es, pt, ar + sw, ha, yo, ig, pcm | RTL: ar | `DEFAULT_LOCALE` |

API surface:

- `GET /api/providers/config`
- `POST /api/providers/payments/checkout`
- `POST /api/providers/payments/verify`
- `POST /api/providers/kyc/start`
- `GET /api/providers/kyc/:sessionId`
- `POST /api/providers/live/rooms`
- `GET /api/providers/i18n/locales`
- `POST /api/providers/i18n/translate`

Mock mode is default until keys are set. Country routing prefers Paystack for NG/GH/ZA.
