/** Verify Phone - Rally design (screen 11)
 * Enter the code: six boxes, custom on-screen keypad with letters,
 * resend countdown in 0:24 style, Edit link back. Shake on a wrong code.
 */
import { useEffect, useRef, useState } from 'react';
import { Text, StyleSheet, View, Pressable, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { spacing, radii, type as typo } from '@/constants/theme';
import { api } from '@/lib/api';

const GOLD = '#FFA726';

function maskPhone(p: string): string {
  const local = p.replace('+234', '').replace(/[^0-9]/g, '');
  if (local.length < 7) return p;
  return '+234 ' + local.slice(0, 3) + ' *** ' + local.slice(-4);
}

export default function VerifyPhoneScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { impact } = useHaptics();
  const { success, error: errSound } = useSounds();
  const shake = useRef(new Animated.Value(0)).current;

  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [devCode, setDevCode] = useState('');
  const [countdown, setCountdown] = useState(24);
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
      router.replace(('/terms-consent?phone=' + String(phone)) as any);
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

  const keys = [
    { d: '1', l: '' },
    { d: '2', l: 'ABC' },
    { d: '3', l: 'DEF' },
    { d: '4', l: 'GHI' },
    { d: '5', l: 'JKL' },
    { d: '6', l: 'MNO' },
    { d: '7', l: 'PQRS' },
    { d: '8', l: 'TUV' },
    { d: '9', l: 'WXYZ' },
  ];

  return (
    <SwipeBack>
      <Screen>
        <Text style={[styles.h1, { color: colors.text }]}>Enter the code</Text>
        <Text style={[styles.sub, { color: colors.muted }]}>
          We sent a 6-digit code to {maskPhone(String(phone))}.{' '}
          <Text style={{ color: GOLD, fontWeight: '800' }} onPress={() => router.back()}>Edit</Text>
        </Text>

        <Animated.View style={{ flexDirection: 'row', gap: 10, transform: [{ translateX: shake }], marginBottom: 18, marginTop: spacing.lg }}>
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

        <Pressable
          disabled={countdown > 0 || loading}
          onPress={() => { setCountdown(24); requestOtp(true); }}
        >
          <Text style={{ color: countdown > 0 ? colors.muted : GOLD, fontWeight: '800', fontSize: 13, marginBottom: 10 }}>
            {countdown > 0 ? 'Resend code in 0:' + countdown : 'Resend code'}
          </Text>
        </Pressable>

        {devCode ? (
          <Text style={[styles.devNote, { color: colors.muted }]}>Dev code: {devCode}</Text>
        ) : null}
        {err ? <Text style={[styles.err, { color: colors.danger }]}>{err}</Text> : null}

        <View style={{ flex: 1 }} />
        <View style={styles.pad}>
          {[0, 1, 2].map((r) => (
            <View key={r} style={styles.padRow}>
              {keys.slice(r * 3, r * 3 + 3).map((k) => (
                <Pressable
                  key={k.d}
                  onPress={() => { impact('light'); setCode((c) => (c.length < 6 ? c + k.d : c)); setErr(''); }}
                  style={[styles.key, { backgroundColor: colors.surface }]}
                >
                  <Text style={{ color: colors.text, fontSize: 24, fontWeight: '700' }}>{k.d}</Text>
                  {k.l ? <Text style={{ color: colors.muted, fontSize: 9, letterSpacing: 1 }}>{k.l}</Text> : null}
                </Pressable>
              ))}
            </View>
          ))}
          <View style={styles.padRow}>
            <View style={styles.key} />
            <Pressable onPress={() => { impact('light'); setCode((c) => c.slice(0, -1)); }} style={[styles.key, { backgroundColor: colors.surface }]} accessibilityLabel={'Backspace'}>
              <Ionicons name={'backspace-outline'} size={26} color={colors.text} />
            </Pressable>
            <Pressable
              onPress={() => { impact('light'); setCode((c) => (c.length < 6 ? c + '0' : c)); setErr(''); }}
              style={[styles.key, { backgroundColor: colors.surface }]}
            >
              <Text style={{ color: colors.text, fontSize: 24, fontWeight: '700' }}>0</Text>
              <View style={{ height: 11 }} />
            </Pressable>
            <View style={styles.key} />
          </View>
        </View>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: { ...typo.h1, marginBottom: 6 },
  sub: { fontSize: 13, lineHeight: 19 },
  box: { width: 46, height: 56, borderRadius: radii.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  devNote: { fontSize: 12, marginBottom: 6 },
  err: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  pad: { marginBottom: spacing.lg },
  padRow: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  key: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: radii.md, minHeight: 58 },
});
