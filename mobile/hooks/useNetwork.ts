import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

/** Mobile-only connectivity probe against Rally API */
export function useNetwork() {
  const [online, setOnline] = useState(true);
  const [checking, setChecking] = useState(false);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(`${API}/health`, { signal: ctrl.signal });
      clearTimeout(t);
      setOnline(res.ok);
    } catch {
      setOnline(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    check();
    const id = setInterval(check, 30000);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') check();
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [check]);

  return { online, checking, recheck: check };
}
