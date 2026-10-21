/** Home tab
 * Welcome hub — discover Favorites, features, and start supporting.
 */
import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GradientButton, GlassCard, SectionHeader } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, radii, type as typo, useLayout, scaleFont } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { LinearGradient } from 'expo-linear-gradient';

const DISCOVER = [
  { href: '/search', label: 'Search', emoji: '🔍' },
  { href: '/rankings', label: 'Rankings', emoji: '🏆' },
  { href: '/cityrankings', label: 'City lanes', emoji: '📍' },
  { href: '/campaigns', label: 'Campaigns', emoji: '❤️' },
  { href: '/rivalries', label: 'Rivalries', emoji: '⚡' },
  { href: '/giveaways', label: 'Giveaways', emoji: '🎁' },
  { href: '/store', label: 'Store', emoji: '🛍️' },
  { href: '/merch', label: 'Merch', emoji: '👕' },
  { href: '/predictions', label: 'Predictions', emoji: '🎯' },
  { href: '/subscriptions', label: 'Fan Clubs', emoji: '⭐' },
  { href: '/fangifts', label: 'Fan Gifts', emoji: '💝' },
  { href: '/collections', label: 'Collections', emoji: '📚' },
  { href: '/live', label: 'Live', emoji: '📡' },
  { href: '/junior', label: 'Junior Favorites', emoji: '🌱' },
  { href: '/security', label: 'Security', emoji: '🔒' },
];

export default function HomeTab() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isTablet, fontScale } = useLayout();
  const { impact } = useHaptics();
  const { click } = useSounds();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    impact('selection');
    await new Promise((r) => setTimeout(r, 500));
    setRefreshing(false);
  }, [impact]);

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      {/* Brand header */}
      <View style={styles.brandRow}>
        <Image
          source={require('@/assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View
          style={[
            styles.badge,
            {
              backgroundColor: colors.primaryMuted,
              borderColor: colors.primary + '55',
            },
          ]}
        >
          <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>
            Fan support
          </Text>
        </View>
      </View>

      <Text
        style={[
          styles.title,
          {
            color: colors.primary,
            fontSize: scaleFont(isTablet ? 40 : 34, fontScale),
          },
        ]}
      >
        Rally
      </Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Support Favorites with Gifts, Moments, and live sessions.
      </Text>

      {/* Primary actions */}
      <View style={{ gap: 10, marginBottom: spacing.lg }}>
        <GradientButton
          label="Open demo @mia"
          icon="person-outline"
          onPress={() => {
            click();
            impact('light');
            router.push('/favorite/mia');
          }}
          fullWidth
        />
        <GradientButton
          label="Compose Moment"
          variant="ghost"
          icon="create-outline"
          onPress={() => {
            click();
            impact('light');
            router.push('/compose-moment');
          }}
          fullWidth
        />
      </View>

      {/* Discover */}
      <GlassCard padded={false}>
        <SectionHeader
          title="Discover"
          style={{ paddingHorizontal: 16, paddingTop: 14 }}
        />

        {DISCOVER.map((item, index) => (
          <Pressable
            key={item.href}
            onPress={() => {
              click();
              impact('selection');
              router.push(item.href as any);
            }}
            style={({ pressed }) => [
              styles.linkRow,
              {
                borderBottomWidth: index < DISCOVER.length - 1 ? StyleSheet.hairlineWidth : 0,
                borderBottomColor: colors.border,
                backgroundColor: pressed ? colors.surfaceHover : 'transparent',
              },
            ]}
          >
            <Text style={{ fontSize: 18, marginRight: 12 }}>{item.emoji}</Text>
            <Text style={[styles.linkText, { color: colors.text }]}>
              {item.label}
            </Text>
            <Text style={{ color: colors.primary, fontSize: 18 }}>›</Text>
          </Pressable>
        ))}
      </GlassCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: spacing.sm,
    marginBottom: 8,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  linkText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
});
