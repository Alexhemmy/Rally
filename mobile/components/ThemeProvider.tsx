/** Rally ThemeProvider
 * App-wide theme: sky-blue primary, dark / light / system, persisted choice.
 * Fully compatible with the refined Ink & Frost design system.
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  ReactNode,
} from 'react';
import { useColorScheme, Appearance } from 'react-native';
import { palettes, ThemeColors } from '@/constants/theme';
import { storage } from '@/lib/storage';

export type ThemeMode = 'system' | 'light' | 'dark';

const MODE_KEY = 'rally_theme';

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
  colors: ThemeColors;
  /** Convenience: toggle between light ↔ dark (ignores system) */
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'system',
  setMode: () => {},
  isDark: true,
  colors: palettes.dark,
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [hydrated, setHydrated] = useState(false);

  // Load persisted preference once
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const saved = await storage.getString(MODE_KEY);
        if (mounted && (saved === 'light' || saved === 'dark' || saved === 'system')) {
          setModeState(saved);
        }
      } catch {
        // silently fall back to system
      } finally {
        if (mounted) setHydrated(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    storage.setString(MODE_KEY, next).catch(() => {
      // ignore persistence errors
    });
  };

  const toggle = () => {
    setMode(isDark ? 'light' : 'dark');
  };

  // Resolve the actual scheme we should use
  const resolvedScheme: 'light' | 'dark' =
    mode === 'system'
      ? systemScheme === 'light'
        ? 'light'
        : 'dark'
      : mode;

  const isDark = resolvedScheme === 'dark';
  const colors = palettes[resolvedScheme];

  // Memoize the context value so consumers don't re-render unnecessarily
  const value = useMemo(
    () => ({
      mode,
      setMode,
      isDark,
      colors,
      toggle,
    }),
    [mode, isDark, colors],
  );

  // Optional: prevent a flash of the wrong theme while we hydrate
  // (you can remove the !hydrated check if you prefer instant render)
  if (!hydrated) {
    return null; // or a minimal splash / previous theme if you want
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
