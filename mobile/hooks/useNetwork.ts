import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { getApiUrl } from '@/lib/config';

type NetState = {
  online: boolean;
  checking: boolean;
  /** false = no server configured (build had no EXPO_PUBLIC_API_URL) */
  configured: boolean;
  recheck: () => Promise<void>;
};

/**
 * Reachability probe against the configured Rally API.
 * - Probes the configured server (baked EXPO_PUBLIC_API_URL, or the one set
 *   in the Connection screen) — never a blind localhost on a real device.
 * - Starts optimistic so a slow first probe doesn't flash an offline banner.
 */
export function useNetwork(): NetState {
  const [online, setOnline] = useState(true);
  const [checking, setChecking] = useState(false);
  const [configured, setConfigured] = useState(true);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const base = await getApiUrl();
      if (!base) {
        setConfigured(false);
        setOnline(false);
        return;
      }
      setConfigured(true);
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 5000);
      try {
        const res = await fetch(base + '/health', { signal: ctrl.signal });
        clearTimeout(t);
        setOnline(res.ok);
      } catch {
        clearTimeout(t);
        setOnline(false);
      }
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    check();
    const id = setInterval(check, 20000);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') check();
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [check]);

  return { online, checking, configured, recheck: check };
}
