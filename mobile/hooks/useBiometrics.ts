/** useBiometrics
 * Optional local authentication.
 * Gracefully no-ops until expo-local-authentication is installed,
 * and always unlocks on web or when hardware is unavailable.
 */
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';

export function useBiometrics() {
  const [unlocked, setUnlocked] = useState(true);

  const authenticate = useCallback(async (): Promise<boolean> => {
    // Web has no biometrics — always allow
    if (Platform.OS === 'web') {
      setUnlocked(true);
      return true;
    }

    try {
      // Dynamically require so the app still runs without the package
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const LocalAuth = require('expo-local-authentication');

      const hasHardware = await LocalAuth.hasHardwareAsync();
      if (!hasHardware) {
        setUnlocked(true);
        return true;
      }

      const result = await LocalAuth.authenticateAsync({
        promptMessage: 'Unlock Rally',
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
      });

      setUnlocked(result.success);
      return result.success;
    } catch {
      // Package missing or unexpected error — fail open
      setUnlocked(true);
      return true;
    }
  }, []);

  return {
    unlocked,
    authenticate,
    setUnlocked,
  };
}
