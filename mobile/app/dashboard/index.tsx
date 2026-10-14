import { useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '@/components/Screen';
import { api, getToken } from '@/lib/api';
import { colors, spacing, radii } from '@/constants/theme';
import { useSounds } from '@/hooks/useSounds';
import { SwipeBack } from '@/components/SwipeBack';

export default function DashboardScreen() {
  const [me, setMe] = useState<any>(null);
  const [error, setError] = useState('');
  const { click } = useSounds();

  useEffect(() => {
    const token = getToken();
    if (!token) { setError('Log in as a Favorite'); return; }
    api<{ user: any }>('/api/auth/me', { token })
      .then((r) => setMe(r.user))
      .catch((e) => setError(e.message));
  }, []);

  const links = [
    { href: '/dashboard/earnings', label: 'Earnings' },
    { href: '/dashboard/payouts', label: 'Payouts' },
    { href: '/dashboard/verify', label: 'Verify KYC' },
    { href: '/onboarding', label: 'Onboarding' },
    { href: '/compose-moment', label: 'New Moment' },
  ];

  return (
    <SwipeBack>
      <Screen>
        <Text style={styles.h1}>Dashboard</Text>
        {!!error && <Text style={styles.err}>{error}</Text>}
        {me && (
          <View style={styles.card}>
            <Text style={styles.name}>{me.displayName} · @{me.handle}</Text>
            <Text style={styles.muted}>Gift Points: {String(me.favoriteProfile?.giftPointsBalance ?? '—')}</Text>
          </View>
        )}
        {links.map((l) => (
          <Link key={l.href} href={l.href as any} asChild>
            <Pressable style={styles.row} onPress={() => click()}>
              <Text style={styles.name}>{l.label}</Text>
              <Text style={styles.muted}>›</Text>
            </Pressable>
          </Link>
        ))}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: spacing.sm, marginBottom: 12 },
  muted: { color: colors.muted, fontSize: 14 },
  name: { color: colors.text, fontWeight: '600', fontSize: 16 },
  err: { color: colors.danger, marginBottom: 8 },
  card: {
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1,
    borderColor: colors.border, padding: spacing.md, marginBottom: 10,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
});
