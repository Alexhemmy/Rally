import { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SoundTextInput } from '@/components/SoundTextInput';
import { api, setToken } from '@/lib/api';
import { colors, spacing, radii } from '@/constants/theme';
import { useSounds } from '@/hooks/useSounds';
import { SwipeBack } from '@/components/SwipeBack';

export default function RegisterScreen() {
  const router = useRouter();
  const { success, error: errSound } = useSounds();
  const [form, setForm] = useState({ email: '', password: '', handle: '', displayName: '', role: 'FAN' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError('');
    try {
      const res = await api<{ token: string }>('/api/auth/register', {
        method: 'POST', skipAuth: true, body: JSON.stringify(form),
      });
      setToken(res.token);
      success();
      router.replace('/');
    } catch (e: any) {
      errSound();
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SwipeBack pullDown>
      <Screen>
        <Text style={styles.h1}>Create account</Text>
        <SoundTextInput style={styles.input} placeholder="Display name" placeholderTextColor={colors.muted}
          value={form.displayName} onChangeText={(v) => setForm({ ...form, displayName: v })} />
        <SoundTextInput style={styles.input} placeholder="Handle" placeholderTextColor={colors.muted} autoCapitalize="none"
          value={form.handle} onChangeText={(v) => setForm({ ...form, handle: v })} />
        <SoundTextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.muted} autoCapitalize="none" keyboardType="email-address"
          value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} />
        <SoundTextInput style={styles.input} placeholder="Password" placeholderTextColor={colors.muted} secureTextEntry
          value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} />
        {!!error && <Text style={styles.error}>{error}</Text>}
        <PrimaryButton label="Register" onPress={submit} loading={loading} />
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 12, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md,
    padding: 14, color: colors.text, marginBottom: 12, minHeight: 48, fontSize: 16,
  },
  error: { color: colors.danger, marginBottom: 8 },
});
