/** Verification
 * Start KYC so Favorites can receive payouts.
 */
import { useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { GradientButton, GlassCard, SectionHeader } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { api, getToken } from '@/lib/api';
import { spacing, radii, type as typo } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';

export default function VerifyScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();

  const [session, setSession] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function start() {
    const token = getToken();
    if (!token) {
      setError('Please log in to start verification');
      return;
    }

    setLoading(true);
    setError('');
    impact('medium');

    try {
      const r = await api<{ session: any }>('/api/providers/kyc/start', {
        method: 'POST',
        token,
      });
      setSession(r.session);
      impact('success');
    } catch (e: any) {
      setError(e.message || 'Could not start verification');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SwipeBack>
      <Screen>
        <Text style={[styles.h1, { color: colors.text }]}>Verification</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Identity verification is required before you can receive payouts.
        </Text>

        <GlassCard style={{ marginTop: spacing.sm }}>
          <SectionHeader title="KYC check" />

          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20, marginBottom: 16 }}>
            We’ll guide you through a quick identity check with our verification partner.
            This only needs to be done once.
          </Text>

          <GradientButton
            label={loading ? 'Starting…' : session ? 'Restart verification' : 'Start KYC'}
            onPress={start}
            loading={loading}
            disabled={loading}
            fullWidth
          />

          {error ? (
            <Text
              style={{
                color: colors.danger,
                marginTop: 12,
                fontWeight: '600',
                fontSize: 13,
              }}
            >
              {error}
            </Text>
          ) : null}
        </GlassCard>

        {session && (
          <GlassCard style={{ marginTop: spacing.md }}>
            <SectionHeader title="Current session" />

            <View style={styles.row}>
              <Text style={{ color: colors.muted, fontSize: 14 }}>Provider</Text>
              <Text style={{ color: colors.text, fontWeight: '600' }}>
                {session.provider || '—'}
              </Text>
            </View>

            <View style={[styles.row, { marginTop: 10 }]}>
              <Text style={{ color: colors.muted, fontSize: 14 }}>Status</Text>
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor:
                      session.status === 'approved'
                        ? colors.success + '20'
                        : session.status === 'rejected'
                        ? colors.danger + '20'
                        : colors.primaryMuted,
                  },
                ]}
              >
                <Text
                  style={{
                    color:
                      session.status === 'approved'
                        ? colors.success
                        : session.status === 'rejected'
                        ? colors.danger
                        : colors.primary,
                    fontWeight: '700',
                    fontSize: 12,
                    textTransform: 'capitalize',
                  }}
                >
                  {session.status || 'pending'}
                </Text>
              </View>
            </View>
          </GlassCard>
        )}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: {
    ...typo.h1,
    marginTop: spacing.sm,
    marginBottom: 6,
  },
  subtitle: {
    ...typo.body,
    marginBottom: spacing.lg,
    lineHeight: 21,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
});
