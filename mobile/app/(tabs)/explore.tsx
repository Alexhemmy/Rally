/** Explore tab
 * Browse categories and featured Favorites.
 * Grid adapts to phone / tablet.
 */
import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GlassCard, Avatar, SectionHeader } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, radii, type as typo, useLayout } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';

const CATEGORIES = [
  { name: 'Music', emoji: '🎵' },
  { name: 'Sports', emoji: '⚽' },
  { name: 'Comedy', emoji: '😂' },
  { name: 'Gaming', emoji: '🎮' },
  { name: 'Artisans', emoji: '🛠️' },
  { name: 'Writers', emoji: '✍️' },
  { name: 'Film & TV', emoji: '🎬' },
  { name: 'Dance', emoji: '💃' },
];

export default function ExploreTab() {
  const { colors } = useTheme();
  const router = useRouter();
  const { columns, isTablet } = useLayout();
  const { impact } = useHaptics();
  const { click } = useSounds();
  const [refreshing, setRefreshing] = useState(false);

  const widthPct = columns === 3 ? '31%' : '48%';

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    impact('selection');
    await new Promise((r) => setTimeout(r, 500));
    setRefreshing(false);
  }, [impact]);

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Text style={[styles.h1, { color: colors.text }]}>Explore</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Discover Favorites by category · grid adapts to your device
      </Text>

      {/* Category grid */}
      <View style={styles.grid}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.name}
            onPress={() => {
              impact('selection');
              click();
              // Future: filter by category
            }}
            style={({ pressed }) => [
              styles.chip,
              {
                width: widthPct as any,
                minWidth: isTablet ? 140 : undefined,
                backgroundColor: pressed ? colors.primaryMuted : colors.surface,
                borderColor: pressed ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={{ fontSize: 22, marginBottom: 6 }}>{cat.emoji}</Text>
            <Text style={[styles.chipText, { color: colors.text }]}>
              {cat.name}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Featured */}
      <GlassCard style={{ marginTop: spacing.sm }}>
        <SectionHeader title="Featured" />

        <Pressable
          onPress={() => {
            impact('medium');
            click();
            router.push('/favorite/mia');
          }}
          style={({ pressed }) => [
            styles.featuredRow,
            {
              backgroundColor: pressed ? colors.surfaceHover : colors.bg,
              borderColor: colors.border,
            },
          ]}
        >
          <Avatar name="Mia" size={48} ring />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.name, { color: colors.text }]}>Mia</Text>
            <Text style={{ color: colors.muted, fontSize: 13 }}>
              @mia · Afrobeats
            </Text>
          </View>
          <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>
            Open
          </Text>
        </Pressable>
      </GlassCard>
    </Screen>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: spacing.md,
    justifyContent: 'space-between',
  },
  chip: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginBottom: 2,
  },
  chipText: {
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
  },
  featuredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 12,
  },
  name: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 2,
  },
});
