/** Sign Up - Rally design (screens 09-10)
 * Phone or Email chips, contact field, date of birth with safety note,
 * password with strength note, profile fields, social and Terms footnote.
 * Phone mode sends a code, email mode continues. Inline errors only.
 */
import { useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GradientButton } from '@/components/ui';
import { SoundTextInput } from '@/components/SoundTextInput';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { spacing, radii, type as typo } from '@/constants/theme';
import { api, setToken } from '@/lib/api';

const GOLD = '#FFA726';
const GREEN = '#34D399';

function ageFromDob(dob: string): number | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dob);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  if (d.getDate() !== Number(m[1]) || d.getMonth() !== Number(m[2]) - 1) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

function Bar({ pct }: { pct: number }) {
  return (
    <View style={styles.track}>
      <View style={{ flex: pct, backgroundColor: GOLD, borderRadius: 2 }} />
      <View style={{ flex: 1 - pct }} />
    </View>
  );
}

export default function SignUpScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const { success, error: errSound } = useSounds();

  const [mode, setMode] = useState<'phone' | 'email'>('phone');
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');
  const [err, setErr] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const pwNote = password.length === 0
    ? ''
    : password.length < 8
      ? 'Use at least 8 characters.'
      : /[^a-zA-Z0-9]/.test(password)
        ? 'Strong password.'
        : 'Good. Add a symbol to make it strong.';
  const pwNoteColor = pwNote === 'Strong password.' ? GREEN : colors.muted;

  function onDob(v: string) {
    const t = v.replace(/[^0-9]/g, '').slice(0, 8);
    let out = t;
    if (t.length > 4) out = t.slice(0, 2) + '/' + t.slice(2, 4) + '/' + t.slice(4);
    else if (t.length > 2) out = t.slice(0, 2) + '/' + t.slice(2);
    setDob(out);
    setAge(ageFromDob(out));
    setErr('');
  }

  function valid(): string | null {
    if (!displayName.trim()) return 'Enter your name.';
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(handle)) return 'Handles are 3-30 letters, numbers or underscores.';
    if (mode === 'phone' && phone.replace(/[^0-9]/g, '').length < 8) return 'Enter a valid phone number.';
    if (mode === 'email' && !emailOk) return 'Enter a valid email address.';
    if (password.length < 8) return 'Passwords are at least 8 characters.';
    if (age === null) return 'Enter your date of birth as DD/MM/YYYY.';
    if (age < 13) return 'You must be at least 13 to join Rally.';
    return null;
  }

  async function submit() {
    const problem = valid();
    if (problem) { setErr(problem); errSound(); impact('error'); return; }
    if (loading) return;
    setLoading(true);
    setErr('');
    impact('medium');
    try {
      const digits = dob.replace(/[^0-9]/g, '');
      const iso = digits.slice(4, 8) + '-' + digits.slice(2, 4) + '-' + digits.slice(0, 2);
      const fullPhone = '+234' + phone.replace(/[^0-9]/g, '').replace(/^0+/, '');
      const res = await api<{ token: string }>('/api/auth/register', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({
          handle,
          displayName: displayName.trim(),
          password,
          dateOfBirth: iso,
          countryCode: 'NG',
          ...(mode === 'phone' ? { phone: fullPhone } : { email: email.trim() }),
        }),
      });
      setToken(res.token);
      success();
      impact('success');
      if (mode === 'phone') {
        router.replace(('/verify-phone?phone=' + fullPhone) as any);
      } else {
        router.replace(('/terms-consent?email=' + email.trim()) as any);
      }
    } catch (e: any) {
      errSound();
      impact('error');
      setErr(e.message || 'Could not create your account.');
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
      const name = displayName.trim() || 'New Fan';
      const h = handle || ('fan_' + String(Date.now()).slice(-8));
      const res = await api<{ token: string }>('/api/auth/social', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ provider, token: 'dev:' + provider + '-' + Date.now() + ':' + name, handle: h, displayName: name }),
      });
      setToken(res.token);
      success();
      router.replace('/terms-consent' as any);
    } catch (e: any) {
      errSound();
      setErr(e.message || 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SwipeBack pullDown>
      <Screen>
        <Bar pct={0.2} />
        <Text style={[styles.h1, { color: colors.text }]}>Create your account</Text>
        <Text style={[styles.sub, { color: colors.muted }]}>
          {mode === 'phone'
            ? 'One account for fans and Favorites. You can browse without one, but you need it to buy Tokens.'
            : 'We will send a code to your email to confirm it is you.'}
        </Text>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
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
            <View style={[styles.withIcon, { borderColor: emailOk ? GREEN : colors.border, backgroundColor: colors.surface }]}>
              <SoundTextInput
                style={[styles.iconInput, { color: colors.text }]}
                placeholder={'tola@example.com'}
                placeholderTextColor={colors.muted}
                value={email}
                onChangeText={(t: string) => { setEmail(t); setErr(''); }}
                autoCapitalize={'none'}
                keyboardType={'email-address'}
              />
              {emailOk ? <Ionicons name={'checkmark-circle'} size={20} color={GREEN} /> : null}
            </View>
          )}

          <Text style={[styles.label, { color: colors.muted }]}>Password</Text>
          <SoundTextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
            placeholder={'Password'}
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={(t: string) => { setPassword(t); setErr(''); }}
            secureTextEntry
          />
          {pwNote ? <Text style={[styles.pwNote, { color: pwNoteColor }]}>{pwNote}</Text> : null}

          <Text style={[styles.label, { color: colors.muted }]}>Date of birth</Text>
          <View style={[styles.withIcon, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <SoundTextInput
              style={[styles.iconInput, { color: colors.text }]}
              placeholder={'14 / 03 / 1998'}
              placeholderTextColor={colors.muted}
              value={dob}
              onChangeText={onDob}
              keyboardType={'number-pad'}
              maxLength={10}
            />
            <Ionicons name={'calendar-outline'} size={20} color={colors.muted} />
          </View>
          <Text style={[styles.dobNote, { color: colors.muted }]}>Used to keep younger fans safe. Never shown on your profile. You must be 13 or older.</Text>
          {age !== null && age < 13 ? (
            <Text style={[styles.fieldErr, { color: colors.danger }]}>Rally is for ages 13 and up.</Text>
          ) : age !== null && age < 18 ? (
            <Text style={[styles.fieldNote, { color: colors.muted }]}>Ages 13 to 17 get Safe mode: tighter spend caps and no rivalry content.</Text>
          ) : null}

          <SoundTextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholder={'Your name'}
            placeholderTextColor={colors.muted}
            value={displayName}
            onChangeText={(t: string) => { setDisplayName(t); setErr(''); }}
            maxLength={80}
          />
          <SoundTextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholder={'Handle (letters, numbers, underscores)'}
            placeholderTextColor={colors.muted}
            value={handle}
            onChangeText={(t: string) => { setHandle(t.replace(/[^a-zA-Z0-9_]/g, '')); setErr(''); }}
            autoCapitalize={'none'}
            maxLength={30}
          />

          {err ? <Text style={[styles.fieldErr, { color: colors.danger }]}>{err}</Text> : null}

          <GradientButton
            label={mode === 'phone' ? 'Send code' : 'Continue'}
            onPress={submit}
            loading={loading}
            fullWidth
          />

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

          <Text style={[styles.footnote, { color: colors.muted }]}>
            By continuing you agree to the <Text style={{ color: GOLD, fontWeight: '700' }} onPress={() => router.push('/terms' as any)}>Terms</Text> and <Text style={{ color: GOLD, fontWeight: '700' }} onPress={() => router.push('/privacy' as any)}>Privacy Policy</Text>. Tokens cannot be withdrawn or sold.
          </Text>
        </ScrollView>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', height: 4, borderRadius: 2, backgroundColor: 'rgba(128,128,128,0.25)', marginBottom: spacing.lg },
  h1: { ...typo.h1, marginBottom: 4 },
  sub: { fontSize: 13, lineHeight: 19, marginBottom: spacing.lg },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  modeChip: { borderWidth: 2, borderRadius: radii.full, paddingHorizontal: 18, paddingVertical: 8 },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderRadius: radii.md, paddingHorizontal: 14, minHeight: 52, marginBottom: 16 },
  phoneDivider: { width: 1, alignSelf: 'stretch', marginHorizontal: 10, backgroundColor: 'rgba(128,128,128,0.3)' },
  phoneInput: { flex: 1, fontSize: 15, paddingVertical: 13 },
  withIcon: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderRadius: radii.md, paddingHorizontal: 14, minHeight: 52, marginBottom: 16 },
  iconInput: { flex: 1, fontSize: 15, paddingVertical: 13 },
  input: { borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, marginBottom: 16, minHeight: 52 },
  pwNote: { fontSize: 12, marginTop: -8, marginBottom: 12, lineHeight: 16 },
  dobNote: { fontSize: 12, lineHeight: 17, marginTop: -6, marginBottom: 14 },
  fieldErr: { fontSize: 12, fontWeight: '600', marginBottom: 10 },
  fieldNote: { fontSize: 12, marginBottom: 10, lineHeight: 17 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 16 },
  divider: { flex: 1, height: 1 },
  socialRow: { flexDirection: 'row', gap: 10 },
  socialBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: radii.full, paddingVertical: 12 },
  footnote: { fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 14 },
});
