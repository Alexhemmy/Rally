/** Client session: token + last activity. Backend enforces 7-day inactivity. */

const TOKEN_KEY = 'rally_token';
const ACTIVE_KEY = 'rally_last_active';
export const INACTIVITY_MS = 7 * 24 * 60 * 60 * 1000;

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(t: string) {
  localStorage.setItem(TOKEN_KEY, t);
  touchActivity();
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ACTIVE_KEY);
}

export function touchActivity() {
  localStorage.setItem(ACTIVE_KEY, String(Date.now()));
}

export function isSessionActiveLocally(): boolean {
  const token = getToken();
  if (!token) return false;
  const last = Number(localStorage.getItem(ACTIVE_KEY) || 0);
  if (!last) return true; // rely on server
  return Date.now() - last <= INACTIVITY_MS;
}

export function requireSessionOrClear(): string | null {
  if (!isSessionActiveLocally()) {
    clearToken();
    return null;
  }
  touchActivity();
  return getToken();
}
