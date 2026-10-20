/** Earnings
 * View available and pending Gift Points balance.
 */
import { useEffect, useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GradientButton, GlassCard, SectionHeader, StatTile } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { api, getToken } from '@/lib/api';
import { spacing, radii, type as typo } from '@/constants/theme';

export default function EarningsScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setError('Please log in to view earnings');
      setLoading(false);
      return;
    }

    api('/api/favorites/me/earnings', { token })
      .then(setData)
      .catch((e: any) => setError(e.message || 'Failed to load earnings'))
      .finally(() => setLoading(false));
  }, []);

  const available = data?.balance?.available ?? '—';
  const pending = data?.balance?.pending ?? '—';

  return (
    <SwipeBack>
      <Screen>
        <Text style={[styles.h1, { color: colors.text }]}>Earnings</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Gift Points convert at the published rate.
        </Text>

        {error ? (
          <GlassCard style={{ marginBottom: spacing.md }}>
            <Text style={{ color: colors.danger, fontWeight: '600', textAlign: 'center' }}>
              {error}
            </Text>
          </GlassCard>
        ) : null}

        {data && (
          <>
            {/* Balance tiles */}
            <View style={styles.tiles}>
              <StatTile
                label="Available"
                value={String(available)}
                icon="wallet-outline"
                tone="primary"
              />
              <StatTile
                label="Pending"
                value={String(pending)}
                icon="time-outline"
                tone="accent"
              />
            </View>

            <GlassCard style={{ marginTop: spacing.md }}>
              <SectionHeader title="Next step" />
              <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20, marginBottom: 14 }}>
                Ready to withdraw? Head to Payouts to request a transfer of your available balance.
              </Text>
              <GradientButton
                label="Go to payouts"
                onPress={() => router.push('/dashboard/payouts')}
                fullWidth
              />
            </GlassCard>
          </>
        )}

        {loading && !data && !error && (
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 24 }}>
            Loading earnings…
          </Text>
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
  tiles: {
    flexDirection: 'row',
    gap: 12,
  },
});
