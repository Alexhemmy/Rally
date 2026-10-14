import { useCallback, useState } from 'react';
import { Platform } from 'react-native';

/** Optional local auth — no-ops until expo-local-authentication is installed */
export function useBiometrics() {
  const [unlocked, setUnlocked] = useState(true);

  const authenticate = useCallback(async () => {
    if (Platform.OS === 'web') {
      setUnlocked(true);
      return true;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const LocalAuth = require('expo-local-authentication');
      const ok = await LocalAuth.hasHardwareAsync();
      if (!ok) {
        setUnlocked(true);
        return true;
      }
      const res = await LocalAuth.authenticateAsync({
        promptMessage: 'Unlock Rally',
        fallbackLabel: 'Use passcode',
      });
      setUnlocked(res.success);
      return res.success;
    } catch {
      setUnlocked(true);
      return true;
    }
  }, []);

  return { unlocked, authenticate, setUnlocked };
}
