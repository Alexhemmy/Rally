/** Home tab
 * For You · Feed · Explore — one TikTok-style screen with selectable top tabs.
 * For You = algorithmic Moments from people you follow.
 * Feed = random Moments. Explore = Moments filtered by category.
 * Real API data only.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GlassCard, Avatar, EmptyState, Chip } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, type as typo } from '@/constants/theme';
import { shareMoment } from '@/hooks/useShare';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { api, getToken } from '@/lib/api';

type TabId = 'foryou' | 'feed' | 'explore';

const TABS: { id: TabId; label: string }[] = [
  { id: 'foryou', label: 'For You' },
  { id: 'feed', label: 'Feed' },
  { id: 'explore', label: 'Explore' },
];

export default function HomeTab() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const { click } = useSounds();

  const [tab, setTab] = useState<TabId>('foryou');
  const [moments, setMoments] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [category, setCategory] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    impact('selection');
    try {
      if (tab === 'foryou') {
        const token = getToken();
        if (!token) {
          setMoments([]);
        } else {
          const res = await api<{ moments: any[] }>('/api/feed/for-you', { token });
          setMoments(res.moments || []);
        }
      } else if (tab === 'feed') {
        const res = await api<{ moments: any[] }>('/api/feed/random', { skipAuth: true });
        setMoments(res.moments || []);
      } else {
        const path = category
          ? '/api/feed/explore?categoryId=' + encodeURIComponent(category)
          : '/api/feed/explore';
        const res = await api<{ moments: any[] }>(path, { skipAuth: true });
        setMoments(res.moments || []);
      }
    } catch {
      setMoments([]);
    } finally {
      setRefreshing(false);
      setLoaded(true);
    }
  }, [tab, category, impact]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api<{ industries: any[] }>('/api/discover/taxonomy', { skipAuth: true });
        const cats = (res.industries || []).flatMap((ind: any) => ind.categories || []);
        if (alive) setCategories(cats);
      } catch {
        // taxonomy unavailable — Explore falls back to unfiltered moments
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  function switchTab(id: TabId) {
    if (id === tab) return;
    click();
    impact('light');
    setLoaded(false);
    setMoments([]);
    setTab(id);
  }

  const emptyCopy =
    tab === 'foryou'
      ? getToken()
        ? 'Follow fans and Favorites to personalize your For You feed.'
        : 'Log in to see Moments picked for you.'
      : tab === 'feed'
        ? 'No Moments yet. Be the first to share one!'
        : 'No Moments in this category yet.';

  return (
    <Screen refreshing={refreshing} onRefresh={load}>
      {/* TikTok-style top tabs */}
      <View style={[styles.tabRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {TABS.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => switchTab(t.id)}
            style={[styles.tabPill, tab === t.id && { backgroundColor: colors.primary }]}
            accessibilityRole="tab"
            accessibilityLabel={t.label}
          >
            <Text style={[styles.tabLabel, { color: tab === t.id ? '#fff' : colors.muted }]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Explore category chips */}
      {tab === 'explore' && categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipRow}
          contentContainerStyle={{ gap: 8, paddingRight: 16 }}
        >
          <Chip
            label="All"
            active={category === null}
            onPress={() => {
              click();
              setCategory(null);
            }}
          />
          {categories.map((c) => (
            <Chip
              key={c.id}
              label={c.name || c.slug || 'Category'}
              active={category === c.id}
              onPress={() => {
                click();
                setCategory(c.id);
              }}
            />
          ))}
        </ScrollView>
      )}

      {moments.length > 0 && (
        <View style={{ gap: 12, marginBottom: spacing.md }}>
          {moments.map((m) => {
            const handle = m.favorite?.user?.handle || m.user?.handle || 'rally';
            return (
              <GlassCard key={m.id}>
                <View style={styles.authorRow}>
                  <Avatar name={handle} size={40} ring />
                  <Pressable
                    style={{ marginLeft: 12, flex: 1 }}
                    onPress={() => {
                      click();
                      router.push('/moments/' + m.id);
                    }}
                  >
                    <Text style={[styles.title, { color: colors.text }]}>
                      {m.title}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 13 }}>
                      @{handle}
                      {m.categoryTag ? ' · ' + m.categoryTag : ''}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      impact('light');
                      shareMoment(m.title, m.id);
                    }}
                    style={styles.shareBtn}
                  >
                    <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>
                      Share
                    </Text>
                  </Pressable>
                </View>
              </GlassCard>
            );
          })}
        </View>
      )}

      {loaded && moments.length === 0 && (
        <View style={{ marginTop: spacing.lg }}>
          <EmptyState
            icon={tab === 'foryou' ? 'sparkles-outline' : tab === 'feed' ? 'shuffle-outline' : 'compass-outline'}
            title={tab === 'feed' ? 'Quiet for now' : 'Nothing here yet'}
            body={emptyCopy}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 999,
    padding: 4,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    gap: 4,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  chipRow: {
    flexGrow: 0,
    marginBottom: spacing.sm,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 2,
  },
  shareBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
