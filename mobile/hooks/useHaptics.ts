import { Platform, Vibration } from 'react-native';

/** Light haptic feedback without requiring native module install at runtime */
export function useHaptics() {
  const impact = (style: 'light' | 'medium' | 'success' | 'error' = 'light') => {
    if (Platform.OS === 'web') return;
    const ms = style === 'light' ? 10 : style === 'medium' ? 25 : style === 'success' ? [10, 40, 10] : [30, 50, 30];
    try {
      Vibration.vibrate(ms as any);
    } catch {
      /* no-op */
    }
  };
  return { impact };
}
