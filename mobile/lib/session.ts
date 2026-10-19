import { storage } from './storage';

const TOKEN_KEY = 'rally_token';
const ACTIVE_KEY = 'rally_last_active';
export const INACTIVITY_MS = 7 * 24 * 60 * 60 * 1000;

let memoryToken: string | null = null;
let memoryActive = 0;
let booted = false;

type Listener = (hasSession: boolean) => void;
const listeners = new Set<Listener>();

export function onSessionChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify() {
  for (const l of listeners) l(!!memoryToken);
}

/** Restore persisted session on app start. Safe to call multiple times. */
export async function loadPersistedSession(): Promise<void> {
  if (booted) return;
  booted = true;
  const saved = await storage.getString(TOKEN_KEY);
  if (saved) {
    memoryToken = saved;
    touchActivity();
    notify();
  }
}

export function getToken(): string | null {
  return memoryToken;
}

export function setToken(t: string | null) {
  memoryToken = t;
  if (t) {
    touchActivity();
    storage.setString(TOKEN_KEY, t);
  } else {
    memoryActive = 0;
    storage.remove(TOKEN_KEY);
    storage.remove(ACTIVE_KEY);
  }
  notify();
}

export function touchActivity() {
  memoryActive = Date.now();
  storage.setString(ACTIVE_KEY, String(memoryActive));
}

export function clearToken() {
  setToken(null);
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
