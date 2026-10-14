import { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { api, setToken } from '@/lib/api';
import { colors, spacing, radii } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { SoundTextInput } from '@/components/SoundTextInput';
import { SwipeBack } from '@/components/SwipeBack';

export default function Login() {
  const router = useRouter();
  const { impact } = useHaptics();
  const { success, error } = useSounds();
  const [email, setEmail] = useState('ada@rally.demo');
  const [password, setPassword] = useState('password123');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setErr('');
    try {
      const res = await api<{ token: string }>('/api/auth/login', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ email, password }),
      });
      setToken(res.token);
      success();
      impact('success');
      router.replace('/');
    } catch (e: any) {
      error();
      impact('error');
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SwipeBack pullDown>
      <Screen scroll>
        <Text style={styles.hint}>Pull down to dismiss</Text>
        <Text style={styles.h1}>Log in</Text>
        <Text style={styles.muted}>Demo: ada@rally.demo / password123</Text>
        <SoundTextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={colors.muted}
        />
        <SoundTextInput
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={colors.muted}
        />
        {!!err && <Text style={styles.error}>{err}</Text>}
        <PrimaryButton label="Log in" onPress={submit} loading={loading} />
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  hint: { color: colors.muted, fontSize: 12, marginTop: spacing.sm },
  h1: { fontSize: 24, fontWeight: '700', color: colors.text },
  muted: { color: colors.muted, marginBottom: 16 },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 14,
    color: colors.text,
    marginBottom: 12,
    minHeight: 48,
    fontSize: 16,
  },
  error: { color: colors.danger, marginBottom: 8 },
});
