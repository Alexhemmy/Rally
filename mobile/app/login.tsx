import { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { api, setToken } from '@/lib/api';
import { colors, spacing, radii } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useHaptics } from '@/hooks/useHaptics';

export default function Login() {
  const router = useRouter();
  const { impact } = useHaptics();
  const [email, setEmail] = useState('ada@rally.demo');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError('');
    try {
      const res = await api<{ token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(res.token);
      impact('success');
      router.replace('/');
    } catch (e: any) {
      impact('error');
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll>
      <Text style={styles.h1}>Log in</Text>
      <Text style={styles.muted}>Demo: ada@rally.demo / password123</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor={colors.muted}
      />
      <TextInput
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor={colors.muted}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <PrimaryButton label="Log in" onPress={submit} loading={loading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
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
