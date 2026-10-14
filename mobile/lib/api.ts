import { requireSessionOrClear, setToken, getToken, clearToken, touchActivity } from './session';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export { getToken, setToken, clearToken };

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string; skipAuth?: boolean } = {}
): Promise<T> {
  const { token: tokenOpt, skipAuth, ...init } = options;
  let token = tokenOpt;
  if (!skipAuth && !token) token = requireSessionOrClear() || undefined;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
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
