import { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SoundTextInput } from '@/components/SoundTextInput';
import { api } from '@/lib/api';
import { colors, spacing, radii } from '@/constants/theme';
import { SwipeBack } from '@/components/SwipeBack';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function submit() {
    try {
      await api('/api/auth/password-reset/request', {
        method: 'POST', skipAuth: true, body: JSON.stringify({ email }),
      });
      setMsg('If that email exists, reset instructions were sent.');
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <SwipeBack pullDown>
      <Screen>
        <Text style={styles.h1}>Forgot password</Text>
        <SoundTextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.muted}
          autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        {!!msg && <Text style={styles.ok}>{msg}</Text>}
        {!!error && <Text style={styles.err}>{error}</Text>}
        <PrimaryButton label="Send reset link" onPress={submit} />
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
  ok: { color: colors.success, marginBottom: 8 },
  err: { color: colors.danger, marginBottom: 8 },
});
