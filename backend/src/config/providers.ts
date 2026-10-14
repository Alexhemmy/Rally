/**
 * Rally provider configuration
 * Recommended stack for launch markets (Africa + global cards):
 * - Payments: Paystack (NG/GH/ZA + cards), Flutterwave (multi-Africa), Stripe (global cards/web)
 * - KYC: Smile Identity (Africa-first ID), Sumsub (global fallback)
 * - Live video: LiveKit (WebRTC SFU) or Agora
 * - i18n: next-intl / i18next + ICU messages; MT via DeepL or Google Translate API
 */
export type PaymentProviderId = 'paystack' | 'flutterwave' | 'stripe' | 'mock';
export type KycProviderId = 'smile_identity' | 'sumsub' | 'mock';
export type LiveProviderId = 'livekit' | 'agora' | 'mock';
export type TranslateProviderId = 'deepl' | 'google' | 'mock';

export const providersConfig = {
  payments: {
    primary: (process.env.PAYMENT_PROVIDER as PaymentProviderId) || 'mock',
    // Route by country: NG/GH → Paystack; multi-Africa → Flutterwave; US/EU web → Stripe
    byCountry: {
      NG: 'paystack',
      GH: 'paystack',
      ZA: 'paystack',
      KE: 'flutterwave',
      US: 'stripe',
      GB: 'stripe',
    } as Record<string, PaymentProviderId>,
    paystack: {
      secretKey: process.env.PAYSTACK_SECRET_KEY || '',
      publicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
      baseUrl: 'https://api.paystack.co',
    },
    flutterwave: {
      secretKey: process.env.FLW_SECRET_KEY || '',
      publicKey: process.env.FLW_PUBLIC_KEY || '',
      baseUrl: 'https://api.flutterwave.com/v3',
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    },
  },
  kyc: {
    primary: (process.env.KYC_PROVIDER as KycProviderId) || 'mock',
    smile: {
      apiKey: process.env.SMILE_API_KEY || '',
      partnerId: process.env.SMILE_PARTNER_ID || '',
      baseUrl: process.env.SMILE_BASE_URL || 'https://api.smileidentity.com/v1',
    },
    sumsub: {
      appToken: process.env.SUMSUB_APP_TOKEN || '',
      secretKey: process.env.SUMSUB_SECRET_KEY || '',
      baseUrl: 'https://api.sumsub.com',
    },
  },
  live: {
    primary: (process.env.LIVE_PROVIDER as LiveProviderId) || 'mock',
    livekit: {
      apiKey: process.env.LIVEKIT_API_KEY || '',
      apiSecret: process.env.LIVEKIT_API_SECRET || '',
      url: process.env.LIVEKIT_URL || '',
    },
    agora: {
      appId: process.env.AGORA_APP_ID || '',
      appCertificate: process.env.AGORA_APP_CERTIFICATE || '',
    },
  },
  i18n: {
    defaultLocale: process.env.DEFAULT_LOCALE || 'en',
    // Launch set from PRD §18
    locales: ['en', 'fr', 'es', 'pt', 'ar', 'sw', 'ha', 'yo', 'ig', 'pcm'],
    rtlLocales: ['ar'],
    translateProvider: (process.env.TRANSLATE_PROVIDER as TranslateProviderId) || 'mock',
    deeplKey: process.env.DEEPL_API_KEY || '',
    googleTranslateKey: process.env.GOOGLE_TRANSLATE_API_KEY || '',
  },
} as const;

export function paymentProviderForCountry(countryCode?: string): PaymentProviderId {
  if (!countryCode) return providersConfig.payments.primary;
  return (
    providersConfig.payments.byCountry[countryCode.toUpperCase()] ||
    providersConfig.payments.primary
  );
}
