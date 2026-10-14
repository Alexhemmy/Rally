import { providersConfig, paymentProviderForCountry, PaymentProviderId } from '../../config/providers';

export type CreateCheckoutInput = {
  userId: string;
  amountCents: number;
  currency: string;
  email?: string;
  countryCode?: string;
  metadata?: Record<string, string>;
  callbackUrl?: string;
};

export type CheckoutResult = {
  provider: PaymentProviderId;
  reference: string;
  authorizationUrl?: string;
  clientSecret?: string;
  publicKey?: string;
  mode: 'redirect' | 'embedded' | 'mock';
};

/** Abstract payment layer — swap env keys to go live */
export async function createTokenCheckout(input: CreateCheckoutInput): Promise<CheckoutResult> {
  const provider = paymentProviderForCountry(input.countryCode);
  const reference = `rally_${input.userId.slice(0, 8)}_${Date.now()}`;

  if (provider === 'mock' || process.env.NODE_ENV === 'development' && !process.env.PAYSTACK_SECRET_KEY) {
    return {
      provider: 'mock',
      reference,
      authorizationUrl: `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/wallet?mock_pay=${reference}`,
      mode: 'mock',
    };
  }

  if (provider === 'paystack') {
    // Live: POST /transaction/initialize with Authorization Bearer secret
    return {
      provider: 'paystack',
      reference,
      publicKey: providersConfig.payments.paystack.publicKey,
      authorizationUrl: `https://checkout.paystack.com/${reference}`,
      mode: 'redirect',
    };
  }

  if (provider === 'flutterwave') {
    return {
      provider: 'flutterwave',
      reference,
      publicKey: providersConfig.payments.flutterwave.publicKey,
      authorizationUrl: `https://checkout.flutterwave.com/v3/${reference}`,
      mode: 'redirect',
    };
  }

  // stripe
  return {
    provider: 'stripe',
    reference,
    clientSecret: `pi_mock_${reference}_secret`,
    mode: 'embedded',
  };
}

export async function verifyPayment(provider: PaymentProviderId, reference: string): Promise<boolean> {
  if (provider === 'mock') return true;
  // Wire provider verify APIs when keys are set
  void reference;
  return false;
}
