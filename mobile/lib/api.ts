const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

let memoryToken: string | null = null;

export function getToken(): string | null {
  return memoryToken;
}

export function setToken(t: string | null) {
  memoryToken = t;
}

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...init } = options;
  const auth = token ?? memoryToken;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
  };
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.error?.message || 'Request failed');
  return data as T;
}
