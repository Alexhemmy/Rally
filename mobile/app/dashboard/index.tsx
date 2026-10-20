/** Dashboard
 * Creator hub for Favorites — earnings, payouts, verification, and more.
 */
import { useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GlassCard, Avatar, SectionHeader, EmptyState } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { api, getToken } from '@/lib/api';
import { spacing, radii, type as typo } from '@/constants/theme';
import { useSounds } from '@/hooks/useSounds';
import { useHaptics } from '@/hooks/useHaptics';

const LINKS = [
  { href: '/dashboard/earnings', label: 'Earnings', icon: '💰' },
  { href: '/dashboard/payouts', label: 'Payouts', icon: '🏦' },
  { href: '/dashboard/verify', label: 'Verify KYC', icon: '✅' },
  { href: '/onboarding', label: 'Onboarding', icon: '🚀' },
  { href: '/compose-moment', label: 'New Moment', icon: '✨' },
];

export default function DashboardScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { click } = useSounds();
  const { impact } = useHaptics();

  const [me, setMe] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setError('Log in as a Favorite to access the dashboard');
      setLoading(false);
      return;
    }

    api<{ user: any }>('/api/auth/me', { token })
      .then((r) => setMe(r.user))
      .catch((e) => setError(e.message || 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SwipeBack>
      <Screen>
        <Text style={[styles.h1, { color: colors.text }]}>Dashboard</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Manage your creator tools and earnings.
        </Text>

        {error ? (
          <GlassCard style={{ marginBottom: spacing.md }}>
            <Text style={{ color: colors.danger, fontWeight: '600', textAlign: 'center' }}>
              {error}
            </Text>
          </GlassCard>
        ) : null}

        {/* Profile summary */}
        {me && (
          <GlassCard style={{ marginBottom: spacing.md }}>
            <View style={styles.profileRow}>
              <Avatar name={me.displayName || me.handle} size={52} ring />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.displayName, { color: colors.text }]}>
                  {me.displayName}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 14 }}>
                  @{me.handle}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.balanceBox,
                { backgroundColor: colors.primaryMuted },
              ]}
            >
              <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '600' }}>
                Gift Points
              </Text>
              <Text style={[styles.balance, { color: colors.primary }]}>
                {String(me.favoriteProfile?.giftPointsBalance ?? '—')}
              </Text>
            </View>
          </GlassCard>
        )}

        {/* Quick links */}
        {!error && (
          <GlassCard padded={false}>
            <SectionHeader
              title="Quick actions"
              style={{ paddingHorizontal: 16, paddingTop: 14 }}
            />

            {LINKS.map((link, index) => (
              <Pressable
                key={link.href}
                onPress={() => {
                  click();
                  impact('light');
                  router.push(link.href as any);
                }}
                style={({ pressed }) => [
                  styles.row,
                  {
                    borderBottomWidth: index < LINKS.length - 1 ? StyleSheet.hairlineWidth : 0,
                    borderBottomColor: colors.border,
                    backgroundColor: pressed ? colors.surfaceHover : 'transparent',
                  },
                ]}
              >
                <Text style={{ fontSize: 18, marginRight: 12 }}>{link.icon}</Text>
                <Text style={[styles.linkLabel, { color: colors.text }]}>
                  {link.label}
                </Text>
                <Text style={{ color: colors.primary, fontSize: 18 }}>›</Text>
              </Pressable>
            ))}
          </GlassCard>
        )}

        {loading && !me && !error && (
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 24 }}>
            Loading…
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
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  displayName: {
    fontWeight: '700',
    fontSize: 17,
    marginBottom: 2,
  },
  balanceBox: {
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'flex-start',
  },
  balance: {
    fontWeight: '800',
    fontSize: 22,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  linkLabel: {
    flex: 1,
    fontWeight: '600',
    fontSize: 15,
  },
});
