/** Login
 * Email + password login with optional two-factor challenge.
 * Clean, friendly, and fully theme-aware.
 */
import { useState } from 'react';
import { Text, StyleSheet, View, Pressable } from 'react-native';
import { api, setToken } from '@/lib/api';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GradientButton, GlassCard } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, radii, type as typo } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { SoundTextInput } from '@/components/SoundTextInput';
import { SwipeBack } from '@/components/SwipeBack';

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { impact } = useHaptics();
  const { success, error } = useSounds();

  const [email, setEmail] = useState('ada@rally.demo');
  const [password, setPassword] = useState('password123');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  // Two-factor challenge
  const [challenge, setChallenge] = useState<string | null>(null);
  const [code, setCode] = useState('');

  async function submit() {
    setLoading(true);
    setErr('');
    impact('medium');

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
      setErr(e.message || 'Login failed');
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
      impact('success');
      router.replace('/');
    } catch (e: any) {
      error();
      impact('error');
      setErr(e.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  // ───────────────── Two-factor challenge view ─────────────────
  if (challenge) {
    return (
      <SwipeBack pullDown>
        <Screen>
          <Text style={[styles.hint, { color: colors.muted }]}>
            Pull down to dismiss
          </Text>

          <Text style={[styles.h1, { color: colors.text }]}>
            Two-factor check
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Enter the 6-digit code from your authenticator app, or one recovery code (works once).
          </Text>

          <GlassCard style={{ marginTop: spacing.sm }}>
            <SoundTextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              keyboardType="number-pad"
              maxLength={8}
              placeholderTextColor={colors.muted}
              autoFocus
            />

            {!!err && (
              <Text style={[styles.error, { color: colors.danger }]}>{err}</Text>
            )}

            <GradientButton
              label="Verify"
              onPress={verify2fa}
              loading={loading}
              disabled={loading || code.length < 6}
              fullWidth
            />

            <View style={{ marginTop: 12 }}>
              <GradientButton
                label="Back"
                variant="ghost"
                onPress={() => {
                  setChallenge(null);
                  setCode('');
                  setErr('');
                }}
                fullWidth
              />
            </View>
          </GlassCard>
        </Screen>
      </SwipeBack>
    );
  }

  // ───────────────── Main login view ─────────────────
  return (
    <SwipeBack pullDown>
      <Screen>
        <Text style={[styles.hint, { color: colors.muted }]}>
          Pull down to dismiss
        </Text>

        <Text style={[styles.h1, { color: colors.text }]}>Log in</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Demo: ada@rally.demo / password123
        </Text>

        <GlassCard style={{ marginTop: spacing.sm }}>
          <SoundTextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.bg,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={colors.muted}
          />

          <SoundTextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.bg,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.muted}
          />

          {!!err && (
            <Text style={[styles.error, { color: colors.danger }]}>{err}</Text>
          )}

          <GradientButton
            label="Log in"
            onPress={submit}
            loading={loading}
            disabled={loading || !email || !password}
            fullWidth
          />

          <View style={styles.links}>
            <Pressable onPress={() => router.push('/forgot-password')}>
              <Text style={[styles.link, { color: colors.primary }]}>
                Forgot password?
              </Text>
            </Pressable>

            <Text style={{ color: colors.muted }}>·</Text>

            <Pressable onPress={() => router.push('/register')}>
              <Text style={[styles.link, { color: colors.primary }]}>
                Register
              </Text>
            </Pressable>
          </View>
        </GlassCard>

        <Text
          style={[
            styles.footerNote,
            { color: colors.muted },
          ]}
        >
          Rally never asks for your password or a code in a message.
        </Text>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  hint: {
    fontSize: 12,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  h1: {
    ...typo.h1,
    marginBottom: 6,
  },
  subtitle: {
    ...typo.body,
    marginBottom: spacing.lg,
    lineHeight: 21,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    marginBottom: 12,
    minHeight: 50,
  },
  error: {
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
  },
  link: {
    fontWeight: '700',
    fontSize: 14,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: spacing.xl,
    lineHeight: 18,
  },
});
