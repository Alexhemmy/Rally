import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  loadPersistedSession,
  onSessionChange,
  setToken,
  clearToken,
} from '@/lib/session';

type SessionCtx = {
  session: boolean;
  loading: boolean;
  signIn: (token: string) => void;
  signOut: () => void;
};

const Ctx = createContext<SessionCtx>({ session: false, loading: true, signIn: () => {}, signOut: () => {} });

/** Boots the persisted session and reacts to login/logout anywhere in the app. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await loadPersistedSession();
      setLoading(false);
    })();
    return onSessionChange(setSession);
  }, []);

  return (
    <Ctx.Provider
      value={{
        session,
        loading,
        signIn: (token: string) => setToken(token),
        signOut: () => clearToken(),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useSession() {
  return useContext(Ctx);
}
