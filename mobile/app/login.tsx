/** Log In - Rally design (screen 08)
 * Phone (NG +234) or email, password with show toggle, social buttons.
 * Inline errors under fields, never a dialog. Two-factor supported.
 */
import { useState } from 'react';
import { Text, StyleSheet, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GradientButton } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { SoundTextInput } from '@/components/SoundTextInput';
import { spacing, radii, type as typo } from '@/constants/theme';
import { api, setToken } from '@/lib/api';

const GOLD = '#FFA726';

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { impact } = useHaptics();
  const { success, error: errSound } = useSounds();

  const [mode, setMode] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [code, setCode] = useState('');

  async function submit() {
    if (loading) return;
    setLoading(true);
    setErr('');
    impact('medium');
    try {
      const fullPhone = '+234' + phone.replace(/[^0-9]/g, '').replace(/^0+/, '');
      const res = await api<any>('/api/auth/login', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify(mode === 'phone' ? { phone: fullPhone, password } : { email: email.trim(), password }),
      });
      if (res.twoFactorRequired && res.challengeToken) {
        setChallenge(res.challengeToken);
        return;
      }
      setToken(res.token);
      success();
      impact('success');
      router.replace('/(tabs)' as any);
    } catch (e: any) {
      errSound();
      impact('error');
      setErr(e.message || 'Login failed. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function verify2fa() {
    if (code.length < 6) return;
    setLoading(true);
    setErr('');
    impact('medium');
    try {
      const res = await api<{ token: string }>('/api/auth/login/2fa', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ challengeToken: challenge, code }),
      });
      setToken(res.token);
      success();
      router.replace('/(tabs)' as any);
    } catch (e: any) {
      errSound();
      setErr(e.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  async function social(provider: 'google' | 'apple') {
    if (loading) return;
    setLoading(true);
    setErr('');
    impact('medium');
    try {
      const handle = 'fan_' + String(Date.now()).slice(-8);
      const res = await api<{ token: string }>('/api/auth/social', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ provider, token: 'dev:' + provider + '-' + Date.now() + ':Fan', handle }),
      });
      setToken(res.token);
      success();
      router.replace('/(tabs)' as any);
    } catch (e: any) {
      errSound();
      setErr(e.message || 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  }

  if (challenge) {
    return (
      <SwipeBack pullDown>
        <Screen>
          <Text style={[styles.h1, { color: colors.text }]}>Two-factor check</Text>
          <Text style={[styles.sub, { color: colors.muted }]}>Enter the 6-digit code from your authenticator app, or one recovery code.</Text>
          <SoundTextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={code}
            onChangeText={setCode}
            placeholder={'123456'}
            keyboardType={'number-pad'}
            maxLength={8}
            placeholderTextColor={colors.muted}
            autoFocus
          />
          {err ? <Text style={[styles.err, { color: colors.danger }]}>{err}</Text> : null}
          <GradientButton label={'Verify'} onPress={verify2fa} loading={loading} disabled={code.length < 6} fullWidth />
          <View style={{ marginTop: 12 }}>
            <GradientButton
              label={'Back'}
              variant={'ghost'}
              onPress={() => { setChallenge(null); setCode(''); setErr(''); }}
              fullWidth
            />
          </View>
        </Screen>
      </SwipeBack>
    );
  }

  const filled = mode === 'phone' ? phone.replace(/[^0-9]/g, '').length >= 8 : email.indexOf('@') > 0;

  return (
    <SwipeBack pullDown>
      <Screen>
        <View style={styles.headRow}>
          <Text style={[styles.h1, { color: colors.text }]}>Welcome back</Text>
          <Pressable onPress={() => router.push('/forgot-password' as any)}>
            <Text style={[styles.forgot, { color: GOLD }]}>Forgot password?</Text>
          </Pressable>
        </View>
        <Text style={[styles.sub, { color: colors.muted }]}>Log in with your phone number or email.</Text>

        <View style={styles.modeRow}>
          {(['phone', 'email'] as const).map((m) => (
            <Pressable
              key={m}
              onPress={() => { impact('light'); setMode(m); setErr(''); }}
              style={[styles.modeChip, mode === m ? { backgroundColor: colors.surface, borderColor: GOLD } : { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <Text style={{ color: mode === m ? colors.text : colors.muted, fontWeight: '800', fontSize: 13 }}>{m === 'phone' ? 'Phone' : 'Email'}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.muted }]}>{mode === 'phone' ? 'Phone number' : 'Email'}</Text>
        {mode === 'phone' ? (
          <View style={[styles.phoneRow, { borderColor: GOLD, backgroundColor: colors.surface }]}>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }}>NG +234</Text>
            <View style={styles.phoneDivider} />
            <SoundTextInput
              style={[styles.phoneInput, { color: colors.text }]}
              placeholder={'803 555 0142'}
              placeholderTextColor={colors.muted}
              value={phone}
              onChangeText={(t: string) => { setPhone(t.replace(/[^0-9 ]/g, '')); setErr(''); }}
              keyboardType={'phone-pad'}
            />
          </View>
        ) : (
          <SoundTextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
            placeholder={'you@example.com'}
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={(t: string) => { setEmail(t); setErr(''); }}
            autoCapitalize={'none'}
            keyboardType={'email-address'}
          />
        )}

        <Text style={[styles.label, { color: colors.muted }]}>Password</Text>
        <View style={[styles.pwRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <SoundTextInput
            style={[styles.pwInput, { color: colors.text }]}
            value={password}
            onChangeText={(t: string) => { setPassword(t); setErr(''); }}
            secureTextEntry={!showPw}
            placeholder={'Password'}
            placeholderTextColor={colors.muted}
          />
          <Pressable onPress={() => { impact('light'); setShowPw(!showPw); }}>
            <Ionicons name={showPw ? 'eye-off' : 'eye'} size={20} color={colors.muted} />
          </Pressable>
        </View>

        {err ? <Text style={[styles.err, { color: colors.danger }]}>{err}</Text> : null}

        <GradientButton label={'Log in'} onPress={submit} loading={loading} disabled={!filled || !password} fullWidth />

        <View style={styles.dividerRow}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={{ color: colors.muted, fontSize: 12 }}>or</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </View>
        <View style={styles.socialRow}>
          <Pressable onPress={() => social('google')} style={[styles.socialBtn, { borderColor: colors.border, backgroundColor: colors.surface }]} accessibilityLabel={'Continue with Google'}>
            <Ionicons name={'logo-google'} size={18} color={colors.text} />
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>Google</Text>
          </Pressable>
          <Pressable onPress={() => social('apple')} style={[styles.socialBtn, { borderColor: colors.border, backgroundColor: colors.surface }]} accessibilityLabel={'Continue with Apple'}>
            <Ionicons name={'logo-apple'} size={18} color={colors.text} />
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>Apple</Text>
          </Pressable>
        </View>

        <Text style={[styles.footer, { color: colors.muted }]}>
          New to Rally? <Text style={{ color: GOLD, fontWeight: '800' }} onPress={() => router.push('/signup' as any)}>Create an account</Text>
        </Text>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  h1: { ...typo.h1, marginBottom: 4 },
  forgot: { fontWeight: '800', fontSize: 13 },
  sub: { fontSize: 13, lineHeight: 19, marginBottom: spacing.lg },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  modeChip: { borderWidth: 2, borderRadius: radii.full, paddingHorizontal: 18, paddingVertical: 8 },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderRadius: radii.md, paddingHorizontal: 14, minHeight: 52, marginBottom: 16 },
  phoneDivider: { width: 1, alignSelf: 'stretch', marginHorizontal: 10, backgroundColor: 'rgba(128,128,128,0.3)' },
  phoneInput: { flex: 1, fontSize: 15, paddingVertical: 13 },
  input: { borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, marginBottom: 16, minHeight: 52 },
  pwRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 14, minHeight: 52, marginBottom: 14 },
  pwInput: { flex: 1, fontSize: 15, paddingVertical: 13 },
  err: { fontSize: 13, fontWeight: '600', marginBottom: 12 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 16 },
  divider: { flex: 1, height: 1 },
  socialRow: { flexDirection: 'row', gap: 10 },
  socialBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: radii.full, paddingVertical: 12 },
  footer: { textAlign: 'center', fontSize: 13, marginTop: spacing.lg },
});