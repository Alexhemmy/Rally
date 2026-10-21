import { Platform } from 'react-native';
import { storage } from './storage';

const OVERRIDE_KEY = 'rally_api_url';

/** Production backend — baked in so store builds work with zero config. */
export const PRODUCTION_API_URL = 'https://rally-backend-twkb.onrender.com';

/**
 * URL baked in at build time via EXPO_PUBLIC_API_URL, else dev default,
 * else the production Rally backend. The user can still override in the
 * Connection screen (persisted here).
 */
export const DEFAULT_API_URL = (() => {
  const env = process.env.EXPO_PUBLIC_API_URL;
  if (env) return env.replace(/\/$/, '');
  if (__DEV__) {
    return Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
  }
  return PRODUCTION_API_URL;
})();

export function hasBakedUrl(): boolean {
  return DEFAULT_API_URL.length > 0;
}

let cachedOverride: string | null = null;

/** Effective API base: user override > baked env/dev default. */
export async function getApiUrl(): Promise<string> {
  if (cachedOverride) return cachedOverride;
  if (DEFAULT_API_URL) return DEFAULT_API_URL;
  cachedOverride = (await storage.getString(OVERRIDE_KEY)) || '';
  return cachedOverride;
}

export async function setApiUrl(url: string): Promise<void> {
  const clean = url.trim().replace(/\/$/, '');
  cachedOverride = clean;
  if (clean) await storage.setString(OVERRIDE_KEY, clean);
  else await storage.remove(OVERRIDE_KEY);
}
