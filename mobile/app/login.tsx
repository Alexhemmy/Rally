import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { api } from '@/lib/api';
import { colors, spacing, radii } from '@/constants/theme';
import { useRouter } from 'expo-router';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('ada@rally.demo');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError('');
    try {
      await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      router.replace('/');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.pad}>
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
      <Pressable style={styles.btn} onPress={submit} disabled={loading}>
        <Text style={styles.btnText}>{loading ? '…' : 'Log in'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { flex: 1, padding: spacing.md },
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
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
  },
  btnText: { color: '#04101F', fontWeight: '700', fontSize: 16 },
  error: { color: colors.danger, marginBottom: 8 },
});
