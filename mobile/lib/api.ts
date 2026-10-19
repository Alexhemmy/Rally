import { requireSessionOrClear, setToken, getToken, clearToken, touchActivity } from './session';
import { getApiUrl } from './config';

export { getToken, setToken, clearToken };

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string; skipAuth?: boolean } = {}
): Promise<T> {
  const { token: tokenOpt, skipAuth, ...init } = options;
  let token = tokenOpt;
  if (!skipAuth && !token) token = requireSessionOrClear() || undefined;

  const base = await getApiUrl();
  if (!base) {
    throw new Error('No server connected yet. Open Connection settings to add your Rally server.');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: 'Bearer ' + token } : {}),
  };
  const res = await fetch(base + path, { ...init, headers });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    const msg = String((data as any)?.error?.message || '');
    if (msg.toLowerCase().includes('inactivity') || msg.toLowerCase().includes('expired')) {
      clearToken();
    }
  }
  if (!res.ok) throw new Error((data as any)?.error?.message || 'Request failed');
  if (token) touchActivity();
  return data as T;
}
