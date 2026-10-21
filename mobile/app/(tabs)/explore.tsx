/** Explore tab
 * Browse real categories (taxonomy) and trending Favorites from the API.
 * Grid adapts to phone / tablet.
 */
import { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GlassCard, Avatar, SectionHeader, EmptyState } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, radii, type as typo, useLayout } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { api } from '@/lib/api';

type Category = { id: string; slug: string; name: string };
type Industry = { id: string; slug: string; name: string; categories: Category[] };
type Trending = {
  handle: string;
  displayName: string;
  avatarUrl?: string | null;
  supporterCount: number;
  verificationStatus?: string;
  category?: string | null;
  industry?: string | null;
};

export default function ExploreTab() {
  const { colors } = useTheme();
  const router = useRouter();
  const { columns, isTablet } = useLayout();
  const { impact } = useHaptics();
  const { click } = useSounds();
  const [refreshing, setRefreshing] = useState(false);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [trending, setTrending] = useState<Trending[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    impact('selection');
    try {
      const [tax, trend] = await Promise.all([
        api<{ industries: Industry[] }>('/api/discover/taxonomy', { skipAuth: true }),
        api<{ trending: Trending[] }>('/api/discover/trending', { skipAuth: true }),
      ]);
      setIndustries(tax.industries || []);
      setTrending(trend.trending || []);
    } catch {
      // offline — keep whatever we had
    } finally {
      setRefreshing(false);
      setLoaded(true);
    }
  }, [impact]);

  useEffect(() => {
    load();
  }, [load]);

  const categories: Category[] = industries.flatMap((i) => i.categories || []);
  const widthPct = columns === 3 ? '31%' : '48%';

  return (
    <Screen refreshing={refreshing} onRefresh={load}>
      <Text style={[styles.h1, { color: colors.text }]}>Explore</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Discover Favorites by category · grid adapts to your device
      </Text>

      {/* Category grid — real taxonomy from the API */}
      {categories.length > 0 ? (
        <View style={styles.grid}>
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => {
                impact('selection');
                click();
                router.push('/search?category=' + cat.id);
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
              <Text style={[styles.chipText, { color: colors.text }]}>
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : loaded ? (
        <EmptyState
          icon="compass-outline"
          title="No categories yet"
          body="Categories are managed on the server. Pull to refresh once the backend has data."
        />
      ) : null}

      {/* Trending Favorites — real data, ranked by unique supporters */}
      <GlassCard style={{ marginTop: spacing.sm }}>
        <SectionHeader title="Trending Favorites" />
        {trending.length === 0 ? (
          <Text style={{ color: colors.muted, fontSize: 13, paddingVertical: 8 }}>
            No published Favorites yet. Once Favorites join Rally they appear here.
          </Text>
        ) : (
          trending.map((f) => (
            <Pressable
              key={f.handle}
              onPress={() => {
                impact('medium');
                click();
                router.push('/favorite/' + f.handle);
              }}
              style={({ pressed }) => [
                styles.featuredRow,
                {
                  backgroundColor: pressed ? colors.surfaceHover : colors.bg,
                  borderColor: colors.border,
                },
              ]}
            >
              <Avatar name={f.displayName || f.handle} size={48} ring />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.name, { color: colors.text }]}>{f.displayName}</Text>
                <Text style={{ color: colors.muted, fontSize: 13 }}>
                  @{f.handle}
                  {f.category ? ' · ' + f.category : ''}
                </Text>
              </View>
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>
                {f.supporterCount} supporters
              </Text>
            </Pressable>
          ))
        )}
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
    marginBottom: 8,
  },
  name: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 2,
  },
});
