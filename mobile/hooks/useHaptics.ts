import { Platform, Vibration } from 'react-native';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'rally_haptics_enabled';

/** In-memory + optional AsyncStorage-free preference (defaults on). */
let globalEnabled = true;

export function setHapticsEnabled(on: boolean) {
  globalEnabled = on;
}

export function getHapticsEnabled() {
  return globalEnabled;
}

type ImpactStyle = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'selection';

/**
 * Mobile haptics via Vibration API (works without native module).
 * Patterns approximate iOS impact / notification feedback.
 */
export function useHaptics() {
  const [enabled, setEnabled] = useState(globalEnabled);

  useEffect(() => {
    setEnabled(globalEnabled);
  }, []);

  const setEnabledPref = useCallback((on: boolean) => {
    globalEnabled = on;
    setEnabled(on);
  }, []);

  const impact = useCallback(
    (style: ImpactStyle = 'light') => {
      if (!globalEnabled || Platform.OS === 'web') return;
      try {
        const patterns: Record<ImpactStyle, number | number[]> = {
          light: 10,
          medium: 25,
          heavy: 40,
          selection: 8,
          success: [12, 40, 12],
          error: [30, 50, 30, 50, 30],
        };
        Vibration.vibrate(patterns[style] as any);
      } catch {
        /* device may block vibration */
      }
    },
    []
  );

  /** Fire when pull-to-refresh finishes */
  const refreshComplete = useCallback(() => {
    impact('light');
  }, [impact]);

  return { impact, refreshComplete, enabled, setEnabled: setEnabledPref };
}
