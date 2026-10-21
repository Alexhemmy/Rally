/** BiometricGate
 * App lock with FaceID / fingerprint (biometrics) and automatic fallback
 * to the device passcode. Enabled from Onboarding or Security settings.
 */
import { ReactNode, useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, AppState } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTheme } from '@/components/ThemeProvider';
import { storage } from '@/lib/storage';

const KEY = 'rally_biometric_lock';

export async function isBiometricLockEnabled(): Promise<boolean> {
  return (await storage.getString(KEY)) === '1';
}

export async function setBiometricLockEnabled(on: boolean): Promise<void> {
  if (on) {
    await storage.setString(KEY, '1');
  } else {
    await storage.remove(KEY);
  }
}

export async function biometricAvailable(): Promise<{ available: boolean; biometry: boolean }> {
  try {
    const [hasHardware, enrolled, types] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);
    return { available: hasHardware && enrolled, biometry: types.length > 0 };
  } catch {
    return { available: false, biometry: false };
  }
}

export function BiometricGate({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const [locked, setLocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const mounted = useRef(true);

  const authenticate = async () => {
    if (!(await isBiometricLockEnabled())) {
      if (mounted.current) {
        setLocked(false);
        setChecking(false);
      }
      return;
    }
    if (mounted.current) {
      setLocked(true);
      setChecking(false);
    }
    try {
      // Falls back to the device passcode automatically when biometrics
      // are unavailable, fail too many times, or the user taps the fallback.
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Rally',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      if (mounted.current) {
        setLocked(!res.success);
      }
    } catch {
      if (mounted.current) setLocked(true);
    }
  };

  useEffect(() => {
    mounted.current = true;
    authenticate();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') authenticate();
    });
    return () => {
      mounted.current = false;
      sub.remove();
    };
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {children}
      {locked && (
        <View style={[styles.overlay, { backgroundColor: colors.bg }]}>
          <Text style={[styles.title, { color: colors.text }]}>Rally is locked</Text>
          <Text style={[styles.body, { color: colors.muted }]}>
            Confirm with FaceID, fingerprint or your device passcode.
          </Text>
          {checking ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text
              style={{ color: colors.primary, fontWeight: '800', marginTop: 24 }}
              onPress={authenticate}
            >
              Try again
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
