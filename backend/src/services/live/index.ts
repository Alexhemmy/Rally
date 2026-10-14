import { providersConfig, LiveProviderId } from '../../config/providers';
import { randomUUID } from 'crypto';

export type LiveRoom = {
  provider: LiveProviderId;
  roomName: string;
  token: string;
  url?: string;
  expiresAt: string;
};

/** LiveKit recommended for web+RN; Agora alternative */
export async function createLiveSession(favoriteId: string, hostUserId: string): Promise<LiveRoom> {
  const provider = providersConfig.live.primary;
  const roomName = `rally-live-${favoriteId.slice(0, 8)}-${randomUUID().slice(0, 6)}`;
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  if (provider === 'mock' || !providersConfig.live.livekit.apiKey) {
    return {
      provider: 'mock',
      roomName,
      token: `mock_token_${hostUserId}`,
      url: 'wss://mock.live.rally.local',
      expiresAt,
    };
  }

  return {
    provider,
    roomName,
    token: `lk_or_agora_token_placeholder`,
    url: providersConfig.live.livekit.url || undefined,
    expiresAt,
  };
}
