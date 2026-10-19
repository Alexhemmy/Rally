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
  // P3: two-factor challenge
  const [challenge, setChallenge] = useState<string | null>(null);
  const [code, setCode] = useState('');

  async function submit() {
    setLoading(true);
    setErr('');
    try {
      const res = await api<
        { token: string } & { twoFactorRequired?: boolean; challengeToken?: string }
      >('/api/auth/login', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ email, password }),
      });
      if (res.twoFactorRequired && res.challengeToken) {
        setChallenge(res.challengeToken);
        return;
      }
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

  async function verify2fa() {
    setLoading(true);
    setErr('');
    try {
      const res = await api<{ token: string }>('/api/auth/login/2fa', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ challengeToken: challenge, code }),
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

  if (challenge) {
    return (
      <SwipeBack pullDown>
        <Screen scroll>
          <Text style={styles.hint}>Pull down to dismiss</Text>
          <Text style={styles.h1}>Two-factor check</Text>
          <Text style={styles.muted}>
            Enter the 6-digit code from your authenticator app, or one recovery code (works once).
          </Text>
          <SoundTextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder="123456"
            keyboardType="number-pad"
            placeholderTextColor={colors.muted}
          />
          {!!err && <Text style={styles.error}>{err}</Text>}
          <PrimaryButton label="Verify" onPress={verify2fa} loading={loading} />
          <PrimaryButton
            label="Back"
            variant="ghost"
            onPress={() => { setChallenge(null); setCode(''); }}
          />
        </Screen>
      </SwipeBack>
    );
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
        <Text style={styles.muted}>
          <Text style={styles.link} onPress={() => router.push('/forgot-password')}>Forgot password?</Text>
          {' · '}
          <Text style={styles.link} onPress={() => router.push('/register')}>Register</Text>
        </Text>
        <Text style={styles.muted}>
          Rally never asks for your password or a code in a message.
        </Text>
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
  link: { color: colors.primary, fontWeight: '700' },
});
