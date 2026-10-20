/** Forgot Password
 * Request a password reset link.
 */
import { useState } from 'react';
import { Text, StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GradientButton, GlassCard } from '@/components/ui';
import { SoundTextInput } from '@/components/SoundTextInput';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { api } from '@/lib/api';
import { spacing, radii, type as typo } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const { success, error: errSound } = useSounds();

  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email.trim()) {
      setMsg({ type: 'error', text: 'Please enter your email' });
      return;
    }

    setLoading(true);
    setMsg(null);
    impact('medium');

    try {
      await api('/api/auth/password-reset/request', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ email: email.trim() }),
      });

      setMsg({
        type: 'success',
        text: 'If that email exists, reset instructions were sent.',
      });
      success();
      impact('success');
    } catch (e: any) {
      errSound();
      setMsg({ type: 'error', text: e.message || 'Request failed' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SwipeBack pullDown>
      <Screen>
        <Text style={[styles.hint, { color: colors.muted }]}>
          Pull down to dismiss
        </Text>

        <Text style={[styles.h1, { color: colors.text }]}>Forgot password</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Enter the email associated with your account and we’ll send a reset link.
        </Text>

        <GlassCard style={{ marginTop: spacing.sm }}>
          <Text style={[styles.label, { color: colors.muted }]}>Email</Text>
          <SoundTextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.bg,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="you@example.com"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />

          {msg && (
            <View
              style={[
                styles.feedback,
                {
                  backgroundColor:
                    msg.type === 'success'
                      ? colors.success + '18'
                      : colors.danger + '18',
                },
              ]}
            >
              <Text
                style={{
                  color: msg.type === 'success' ? colors.success : colors.danger,
                  fontWeight: '700',
                  fontSize: 13,
                }}
              >
                {msg.text}
              </Text>
            </View>
          )}

          <GradientButton
            label="Send reset link"
            onPress={submit}
            loading={loading}
            disabled={loading || !email.trim()}
            fullWidth
          />

          <View style={styles.footer}>
            <Pressable onPress={() => router.push('/login')}>
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>
                Back to log in
              </Text>
            </Pressable>
          </View>
        </GlassCard>
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
    marginBottom: spacing.md,
    lineHeight: 21,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    marginBottom: 14,
    minHeight: 50,
  },
  feedback: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    marginBottom: 14,
  },
  footer: {
    alignItems: 'center',
    marginTop: 18,
  },
});
