import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { palettes } from '@/constants/theme';
import { storage } from '@/lib/storage';

export type ThemeMode = 'system' | 'light' | 'dark';
const MODE_KEY = 'rally_theme';

type ThemeCtx = {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  isDark: boolean;
  colors: typeof palettes.dark;
};

const Ctx = createContext<ThemeCtx>({
  mode: 'system',
  setMode: () => {},
  isDark: true,
  colors: palettes.dark,
});

/** App-wide theme: sky-blue primary, dark/light/system, persisted choice. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const sys = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    storage.getString(MODE_KEY).then((m) => {
      if (m === 'light' || m === 'dark' || m === 'system') setModeState(m);
    });
  }, []);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    storage.setString(MODE_KEY, m);
  };

  const scheme = mode === 'system' ? (sys === 'light' ? 'light' : 'dark') : mode;
  const isDark = scheme === 'dark';

  return (
    <Ctx.Provider value={{ mode, setMode, isDark, colors: palettes[scheme] }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTheme() {
  return useContext(Ctx);
}
