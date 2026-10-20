/** SessionProvider
 * Boots the persisted session and reacts to login / logout anywhere in the app.
 * Provides a simple, typed API: session, loading, signIn, signOut.
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  ReactNode,
} from 'react';
import {
  loadPersistedSession,
  onSessionChange,
  setToken,
  clearToken,
} from '@/lib/session';

type SessionContextValue = {
  /** Whether the user currently has a valid session */
  session: boolean;
  /** True while we are restoring the session from storage */
  loading: boolean;
  /** Call after a successful login */
  signIn: (token: string) => void;
  /** Call to log the user out */
  signOut: () => void;
};

const SessionContext = createContext<SessionContextValue>({
  session: false,
  loading: true,
  signIn: () => {},
  signOut: () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await loadPersistedSession();
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    // Subscribe to session changes (login / logout from anywhere)
    const unsubscribe = onSessionChange((isLoggedIn) => {
      if (mounted) {
        setSession(isLoggedIn);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      loading,
      signIn: (token: string) => setToken(token),
      signOut: () => clearToken(),
    }),
    [session, loading],
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return ctx;
}
