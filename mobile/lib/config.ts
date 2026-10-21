import { Platform } from 'react-native';
import { storage } from './storage';

const OVERRIDE_KEY = 'rally_api_url';

/**
 * API base URL is NOT hardcoded in the app. It is inlined at build time
 * from EXPO_PUBLIC_API_URL, which EAS injects from:
 *  - eas.json build profile env (see mobile/eas.json), or
 *  - the expo.dev dashboard: Project -> Environment Variables
 *    (or Build Profiles -> profile -> Environment variables).
 * Local dev: create mobile/.env (see .env.example) or rely on the
 * __DEV__ localhost defaults below.
 */
export const PRODUCTION_API_URL = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/+$/, '');

export const DEFAULT_API_URL = (() => {
  const env = process.env.EXPO_PUBLIC_API_URL;
  if (env) return env.replace(/\/+$/, '');
  if (__DEV__) {
    return Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
  }
  // Release build without EXPO_PUBLIC_API_URL: fall back to empty so the
  // Connection screen override (persisted) can supply a URL. Warn loudly
  // so misconfigured builds are obvious.
  console.warn(
    '[config] EXPO_PUBLIC_API_URL is not set for this build. ' +
    'Set it in the EAS build profile (eas.json) or on the expo.dev dashboard.'
  );
  return '';
})();

export function hasBakedUrl(): boolean {
  return DEFAULT_API_URL.length > 0;
}

let cachedOverride: string | null = null;

/** Effective API base: baked env value > user override (Connection screen). */
export async function getApiUrl(): Promise<string> {
  if (DEFAULT_API_URL) return DEFAULT_API_URL;
  if (cachedOverride) return cachedOverride;
  cachedOverride = (await storage.getString(OVERRIDE_KEY)) || '';
  return cachedOverride;
}

export async function setApiUrl(url: string): Promise<void> {
  const clean = url.trim().replace(/\/+$/, '');
  cachedOverride = clean;
  if (clean) await storage.setString(OVERRIDE_KEY, clean);
  else await storage.remove(OVERRIDE_KEY);
}
