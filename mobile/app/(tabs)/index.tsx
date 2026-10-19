import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, spacing, useLayout, scaleFont } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';

export default function HomeTab() {
  const router = useRouter();
  const { isTablet, fontScale } = useLayout();
  const { impact } = useHaptics();
  const { click } = useSounds();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    impact('selection');
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  }, [impact]);

  const links = [
    { href: '/search', label: 'Search' },
    { href: '/rankings', label: 'Rankings' },
    { href: '/campaigns', label: 'Campaigns' },
    { href: '/rivalries', label: 'Rivalries' },
    { href: '/giveaways', label: 'Giveaways' },
    { href: '/store', label: 'Store' },
    { href: '/subscriptions', label: 'Fan Clubs' },
    { href: '/fangifts', label: 'Fan Gifts' },
    { href: '/collections', label: 'Collections' },
    { href: '/live', label: 'Live' },
  ];

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Text style={styles.badge}>Fan support</Text>
      <Text style={[styles.title, { fontSize: scaleFont(isTablet ? 40 : 34, fontScale) }]}>
        Rally
      </Text>
      <Text style={styles.subtitle}>
        Support Favorites with Gifts, Moments, and live sessions.
      </Text>

      <PrimaryButton
        label="Open demo @mia"
        onPress={() => {
          click();
          router.push('/favorite/mia');
        }}
      />
      <PrimaryButton
        label="Compose Moment"
        variant="ghost"
        onPress={() => {
          click();
          router.push('/compose-moment');
        }}
        style={{ marginTop: 10 }}
      />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Discover</Text>
        {links.map((item) => (
          <Link key={item.href} href={item.href as any} asChild>
            <Pressable style={styles.linkRow} onPress={() => click()}>
              <Text style={styles.linkText}>{item.label}</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    color: colors.primaryHover,
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.35)',
  },
  title: { fontWeight: '800', color: colors.primary, marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.muted, marginBottom: spacing.lg, lineHeight: 22 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  cardTitle: { color: colors.primaryHover, fontWeight: '700', marginBottom: 8 },
  linkText: { color: colors.text, fontSize: 16 },
  chevron: { color: colors.muted, fontSize: 22 },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});
EOF
echo wrote_index
