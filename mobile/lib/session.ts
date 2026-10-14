const TOKEN_KEY = 'rally_token';
const ACTIVE_KEY = 'rally_last_active';
export const INACTIVITY_MS = 7 * 24 * 60 * 60 * 1000;

let memoryToken: string | null = null;
let memoryActive = 0;

export function getToken(): string | null {
  return memoryToken;
}

export function setToken(t: string | null) {
  memoryToken = t;
  if (t) touchActivity();
  else memoryActive = 0;
}

export function touchActivity() {
  memoryActive = Date.now();
}

export function clearToken() {
  memoryToken = null;
  memoryActive = 0;
}

export function requireSessionOrClear(): string | null {
  if (!memoryToken) return null;
  if (memoryActive && Date.now() - memoryActive > INACTIVITY_MS) {
    clearToken();
    return null;
  }
  touchActivity();
  return memoryToken;
}
