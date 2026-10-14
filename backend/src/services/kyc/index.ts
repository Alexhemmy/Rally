import { providersConfig, KycProviderId } from '../../config/providers';

export type KycSession = {
  provider: KycProviderId;
  sessionId: string;
  uploadUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
};

/** Smile Identity (Africa) or Sumsub (global) — mock until keys set */
export async function startFavoriteKyc(userId: string, countryCode?: string): Promise<KycSession> {
  const provider = providersConfig.kyc.primary;
  const sessionId = `kyc_${userId.slice(0, 8)}_${Date.now()}`;

  if (provider === 'mock' || !providersConfig.kyc.smile.apiKey) {
    return { provider: 'mock', sessionId, status: 'pending', uploadUrl: `/api/kyc/mock-upload/${sessionId}` };
  }

  return {
    provider,
    sessionId,
    status: 'pending',
    uploadUrl: provider === 'smile_identity'
      ? `${providersConfig.kyc.smile.baseUrl}/upload`
      : `${providersConfig.kyc.sumsub.baseUrl}/resources/sdkIntegrations`,
  };
}

export async function getKycStatus(sessionId: string): Promise<KycSession['status']> {
  void sessionId;
  return 'pending';
}
