/** Verify Phone - Rally design (screen 11)
 * Six boxes that fill as digits are typed or pasted. A wrong code
 * shakes and clears. Resend unlocks after the countdown. Edit returns
 * to Sign Up with the number kept.
 */
import { useEffect, useRef, useState } from 'react';
import { Text, StyleSheet, View, Pressable, Animated, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GradientButton } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { spacing, radii, type as typo } from '@/constants/theme';
import { api } from '@/lib/api';

const GOLD = '#FFA726';

export default function VerifyPhoneScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { impact } = useHaptics();
  const { success, error: errSound } = useSounds();
  const inputRef = useRef<TextInput>(null);
  const shake = useRef(new Animated.Value(0)).current;

  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [devCode, setDevCode] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [loading, setLoading] = useState(false);

  async function requestOtp(showTip: boolean) {
    setLoading(true);
    try {
      const r: any = await api('/api/auth/otp/request', { method: 'POST', body: JSON.stringify({ phone: String(phone) }) });
      const dc = r.devCode || r.code || '';
      setDevCode(dc ? String(dc) : '');
      if (showTip) impact('light');
    } catch (e: any) {
      setErr(e.message || 'Could not send the code.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    requestOtp(false);
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    if (code.length === 6) verify();
  }, [code]);

  function doShake() {
    Animated.sequence([
      Animated.timing(shake, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  async function verify() {
    if (loading || code.length !== 6) return;
    setLoading(true);
    setErr('');
    impact('medium');
    try {
      await api('/api/auth/otp/verify', { method: 'POST', body: JSON.stringify({ phone: String(phone), code }) });
      success();
      impact('success');
      api('/api/auth/onboarding/progress', { method: 'POST', body: JSON.stringify({ step: 3 }) }).catch(() => {});
      router.replace('/onboarding-preferences' as any);
    } catch (e: any) {
      errSound();
      impact('error');
      doShake();
      setCode('');
      setErr(e.message || 'That code did not work. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SwipeBack pullDown>
      <Screen>
        <Text style={[styles.h1, { color: colors.text }]}>Verify your phone</Text>
        <Text style={[styles.sub, { color: colors.muted }]}>
          Step 2 of 5. We sent a 6-digit code to {String(phone)}.
        </Text>

        <Pressable onPress={() => inputRef.current && inputRef.current.focus()}>
          <Animated.View style={{ flexDirection: 'row', gap: 10, transform: [{ translateX: shake }] }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <View
                key={i}
                style={[
                  styles.box,
                  { borderColor: code.length === i ? GOLD : colors.border, backgroundColor: colors.surface },
                  code.length === i && { borderWidth: 2 },
                ]}
              >
                <Text style={{ color: colors.text, fontSize: 22, fontWeight: '900' }}>{code[i] || ''}</Text>
              </View>
            ))}
          </Animated.View>
        </Pressable>
        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
          keyboardType={'number-pad'}
          autoFocus
          style={styles.hidden}
        />

        {devCode ? (
          <Text style={[styles.devNote, { color: colors.muted }]}>Dev code: {devCode}</Text>
        ) : null}
        {err ? <Text style={[styles.err, { color: colors.danger }]}>{err}</Text> : null}

        <GradientButton
          label={loading ? 'Verifying' : 'Verify'}
          onPress={verify}
          loading={loading}
          disabled={code.length !== 6 || loading}
          fullWidth
        />

        <View style={styles.linkRow}>
          <Pressable
            disabled={countdown > 0 || loading}
            onPress={() => { setCountdown(30); requestOtp(true); }}
          >
            <Text style={[styles.link, { color: countdown > 0 ? colors.muted : GOLD }]}>
              {countdown > 0 ? 'Resend code in ' + countdown + 's' : 'Resend code'}
            </Text>
          </Pressable>
          <Text style={{ color: colors.muted }}>{'\u00b7'}</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={[styles.link, { color: GOLD }]}>Edit number</Text>
          </Pressable>
        </View>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: { ...typo.h1, marginBottom: 6 },
  sub: { fontSize: 13, lineHeight: 19, marginBottom: spacing.lg },
  box: { width: 46, height: 56, borderRadius: radii.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  hidden: { position: 'absolute', opacity: 0, height: 0, width: 0 },
  devNote: { fontSize: 12, marginTop: 14 },
  err: { fontSize: 13, fontWeight: '600', marginTop: 14 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'center', marginTop: 18 },
  link: { fontWeight: '800', fontSize: 14 },
});
