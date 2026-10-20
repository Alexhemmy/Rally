/** Register
 * Create a new Rally account (Fan or Favorite).
 */
import { useState } from 'react';
import { Text, StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GradientButton, GlassCard, Chip } from '@/components/ui';
import { SoundTextInput } from '@/components/SoundTextInput';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { api, setToken } from '@/lib/api';
import { spacing, radii, type as typo } from '@/constants/theme';
import { useSounds } from '@/hooks/useSounds';
import { useHaptics } from '@/hooks/useHaptics';

export default function RegisterScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { success, error: errSound } = useSounds();
  const { impact } = useHaptics();

  const [form, setForm] = useState({
    email: '',
    password: '',
    handle: '',
    displayName: '',
    role: 'FAN' as 'FAN' | 'FAVORITE',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    if (!form.displayName.trim() || !form.handle.trim() || !form.email.trim() || !form.password) {
      setError('Please fill in all fields');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');
    impact('medium');

    try {
      const res = await api<{ token: string }>('/api/auth/register', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify(form),
      });

      setToken(res.token);
      success();
      impact('success');
      router.replace('/');
    } catch (e: any) {
      errSound();
      impact('error');
      setError(e.message || 'Registration failed');
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

        <Text style={[styles.h1, { color: colors.text }]}>Create account</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Join Rally as a Fan or Favorite.
        </Text>

        <GlassCard style={{ marginTop: spacing.sm }}>
          {/* Role selector */}
          <Text style={[styles.label, { color: colors.muted }]}>I am a…</Text>
          <View style={styles.roleRow}>
            <Chip
              label="Fan"
              active={form.role === 'FAN'}
              onPress={() => update('role', 'FAN')}
            />
            <Chip
              label="Favorite"
              active={form.role === 'FAVORITE'}
              onPress={() => update('role', 'FAVORITE')}
            />
          </View>

          <Text style={[styles.label, { color: colors.muted }]}>Display name</Text>
          <SoundTextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.bg,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="How you’ll appear"
            placeholderTextColor={colors.muted}
            value={form.displayName}
            onChangeText={(v) => update('displayName', v)}
            maxLength={40}
          />

          <Text style={[styles.label, { color: colors.muted }]}>Handle</Text>
          <SoundTextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.bg,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="@yourhandle"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            value={form.handle}
            onChangeText={(v) => update('handle', v.replace(/\s/g, ''))}
            maxLength={24}
          />

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
            value={form.email}
            onChangeText={(v) => update('email', v)}
          />

          <Text style={[styles.label, { color: colors.muted }]}>Password</Text>
          <SoundTextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.bg,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="At least 8 characters"
            placeholderTextColor={colors.muted}
            secureTextEntry
            value={form.password}
            onChangeText={(v) => update('password', v)}
          />

          {!!error && (
            <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
          )}

          <GradientButton
            label="Create account"
            onPress={submit}
            loading={loading}
            disabled={loading}
            fullWidth
          />

          <View style={styles.footer}>
            <Text style={{ color: colors.muted, fontSize: 14 }}>
              Already have an account?{' '}
            </Text>
            <Pressable onPress={() => router.push('/login')}>
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>
                Log in
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
  roleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
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
  error: {
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
});
