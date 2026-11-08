/** Discover (Explore) - Rally design
 * Search bar, RISING THIS WEEK gradient cards (trending Favorites),
 * BROWSE BY FIELD category buttons, and Moments by category.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  Text,
  StyleSheet,
  View,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GlassCard, Avatar, EmptyState } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, radii } from '@/constants/theme';
import { shareMoment } from '@/hooks/useShare';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const GRADIENTS: [string, string][] = [
  ['#FF5E00', '#FF0066'],
  ['#0066FF', '#00CCFF'],
  ['#F50057', '#FF8C00'],
  ['#7B1FA2', '#E040FB'],
];
const FIELD_COLORS = ['#9D00FF', '#FF0033', '#00BFA5', '#FF8C00', '#2196F3', '#E91E63'];
const FIELD_ICONS = ['musical-notes', 'happy', 'film', 'barbell', 'book', 'color-palette', 'mic', 'globe'];

type SearchTab = 'people' | 'moments';

function hashIndex(s: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973;
  return h % mod;
}

export default function DiscoverTab() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const { click, success } = useSounds();

  const [mode, setMode] = useState<SearchTab>('moments');
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [followBusy, setFollowBusy] = useState<string | null>(null);
  const [moments, setMoments] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [ranked, setRanked] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const searchUsers = useCallback(async (q: string) => {
    if (!q.trim()) {
      setUsers([]);
      setSearched(false);
      return;
    }
    setSearching(true);
    try {
      const res = await api<{ users: any[] }>(
        '/api/users/search?q=' + encodeURIComponent(q.trim()),
        { skipAuth: !getToken() }
      );
      setUsers(res.users || []);
      setSearched(true);
    } catch {
      setUsers([]);
      setSearched(true);
    } finally {
      setSearching(false);
    }
  }, []);

  const loadMoments = useCallback(async () => {
    setRefreshing(true);
    try {
      const path = category
        ? '/api/feed/explore?categoryId=' + encodeURIComponent(category)
        : '/api/feed/explore';
      const res = await api<{ moments: any[] }>(path, { skipAuth: true });
      setMoments(res.moments || []);
    } catch {
      setMoments([]);
    } finally {
      setRefreshing(false);
      setLoaded(true);
    }
  }, [category]);

  useEffect(() => {
    loadMoments();
  }, [loadMoments]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api<{ industries: any[] }>('/api/discover/taxonomy', { skipAuth: true });
        const cats = (res.industries || []).flatMap((ind: any) => ind.categories || []);
        if (alive) setCategories(cats);
      } catch {
        // taxonomy unavailable - Discover falls back to unfiltered moments
      }
    })();
    api<{ trending: any[] }>('/api/discover/trending', { skipAuth: true })
      .then((r) => setTrending(r.trending || []))
      .catch(() => setTrending([]));
    api<{ rankings: any[] }>('/api/rankings?window=all', { skipAuth: true })
      .then((r) => setRanked((r.rankings || []).slice(0, 5)))
      .catch(() => setRanked([]));
    return () => {
      alive = false;
    };
  }, []);

  async function toggleFollow(u: any) {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    setFollowBusy(u.id);
    impact('light');
    try {
      if (u.isFollowing) {
        await api('/api/users/' + u.handle + '/follow', { method: 'DELETE', body: '{}' });
        u.isFollowing = false;
      } else {
        await api('/api/users/' + u.handle + '/follow', { method: 'POST', body: '{}' });
        u.isFollowing = true;
      }
      setUsers((prev) => [...prev]);
      success();
    } catch {
      await searchUsers(query);
    } finally {
      setFollowBusy(null);
    }
  }

  const topCategories = categories.slice(0, 8);

  return (
    <Screen refreshing={refreshing} onRefresh={loadMoments}>
      {/* Search bar */}
      <TextInput
        style={[styles.searchInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
        placeholder="Search Favorites, specialties, places"
        placeholderTextColor={colors.muted}
        value={query}
        onChangeText={(t) => {
          setQuery(t);
          searchUsers(t);
          if (t.trim()) setMode('people');
        }}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />

      {/* Mode chips */}
      <View style={[styles.modeRow, { borderColor: colors.border }]}>
        <Pressable
          onPress={() => {
            click();
            setMode('people');
          }}
          style={[styles.modePill, mode === 'people' && { backgroundColor: GOLD, borderColor: GOLD }]}
        >
          <Text style={{ color: mode === 'people' ? '#111' : colors.muted, fontWeight: '800', fontSize: 13 }}>
            People
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            click();
            setMode('moments');
          }}
          style={[styles.modePill, mode === 'moments' && { backgroundColor: GOLD, borderColor: GOLD }]}
        >
          <Text style={{ color: mode === 'moments' ? '#111' : colors.muted, fontWeight: '800', fontSize: 13 }}>
            Discover
          </Text>
        </Pressable>
      </View>

      {mode === 'people' ? (
        <>
          {searching && <ActivityIndicator color={GOLD} style={{ marginTop: 12 }} />}
          {users.length > 0 && (
            <View style={{ gap: 10, marginBottom: spacing.md }}>
              {users.map((u) => (
                <GlassCard key={u.id}>
                  <View style={styles.userRow}>
                    <Avatar name={u.handle} size={44} ring uri={u.avatarUrl || undefined} />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>
                        {u.displayName}
                        {u.isFavorite ? ' \u2605' : ''}
                      </Text>
                      <Text style={{ color: colors.muted, fontSize: 13 }} numberOfLines={1}>
                        @{u.handle}
                        {u.isFavorite ? ' \u00b7 Favorite' : ' \u00b7 Fan'}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => toggleFollow(u)}
                      disabled={followBusy === u.id}
                      style={[
                        styles.followBtn,
                        { borderColor: GOLD },
                        u.isFollowing && { backgroundColor: GOLD },
                      ]}
                    >
                      <Text
                        style={{
                          color: u.isFollowing ? '#111' : GOLD,
                          fontWeight: '800',
                          fontSize: 12,
                        }}
                      >
                        {followBusy === u.id ? '\u2026' : u.isFollowing ? 'Following' : 'Follow'}
                      </Text>
                    </Pressable>
                  </View>
                </GlassCard>
              ))}
            </View>
          )}
          {searched && !searching && users.length === 0 && (
            <EmptyState icon="search-outline" title="No users found" body="Try a different name or handle." />
          )}
          {!searched && !searching && (
            <EmptyState
              icon="search-outline"
              title="Find people"
              body="Search for any fan or Favorite by their name or @handle."
            />
          )}
        </>
      ) : (
        <>
          {/* RISING THIS WEEK */}
          {trending.length > 0 && (
            <View>
              <Text style={[styles.sectionLabel, { color: colors.muted }]}>RISING THIS WEEK</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flexGrow: 0, marginBottom: spacing.lg }}
                contentContainerStyle={{ gap: 10, paddingRight: 16 }}
              >
                {trending.slice(0, 6).map((f: any, i: number) => (
                  <Pressable
                    key={f.handle}
                    onPress={() => {
                      click();
                      router.push('/u/' + f.handle);
                    }}
                    accessibilityLabel={f.displayName}
                  >
                    <LinearGradient
                      colors={GRADIENTS[i % GRADIENTS.length] as [string, string]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.risingCard}
                    >
                      <Text style={styles.risingInitials}>
                        {(f.displayName || f.handle || '?').slice(0, 2).toUpperCase()}
                      </Text>
                      <Text style={styles.risingName} numberOfLines={1}>{f.displayName}</Text>
                      <Text style={styles.risingSub} numberOfLines={1}>
                        {f.category ? f.category + ' \u00b7 ' : ''}
                        {(f.supporterCount || 0) >= 1000
                          ? ((f.supporterCount || 0) / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
                          : String(f.supporterCount || 0)}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* BROWSE BY FIELD */}
          {topCategories.length > 0 && (
            <View style={{ marginBottom: spacing.lg }}>
              <Text style={[styles.sectionLabel, { color: colors.muted }]}>BROWSE BY FIELD</Text>
              <View style={styles.fieldGrid}>
                {topCategories.map((c: any) => {
                  const active = category === c.id;
                  const color = FIELD_COLORS[hashIndex(String(c.id || c.name), FIELD_COLORS.length)];
                  const icon = (FIELD_ICONS[hashIndex(String(c.name || c.id), FIELD_ICONS.length)] +
                    '-outline') as keyof typeof Ionicons.glyphMap;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => {
                        click();
                        setCategory(active ? null : c.id);
                      }}
                      style={[
                        styles.fieldBtn,
                        { backgroundColor: colors.surface, borderColor: active ? GOLD : colors.border, borderWidth: active ? 2 : 1 },
                      ]}
                      accessibilityLabel={c.name}
                    >
                      <View style={[styles.fieldIcon, { backgroundColor: color + '22' }]}>
                        <Ionicons name={icon} size={18} color={color} />
                      </View>
                      <Text numberOfLines={1} style={[styles.fieldLabel, { color: colors.text }]}>
                        {c.name || c.slug || 'Category'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* MOST LOVED leaderboard */}
          {ranked.length > 0 && (
            <View style={{ marginBottom: spacing.lg }}>
              <Text style={[styles.sectionLabel, { color: colors.muted }]}>MOST LOVED</Text>
              {ranked.map((f: any, i: number) => (
                <Pressable
                  key={f.handle}
                  style={styles.rankRow}
                  onPress={() => {
                    click();
                    router.push('/u/' + f.handle);
                  }}
                >
                  <Text style={[styles.rankNum, { color: colors.muted }]}>{i + 1}</Text>
                  <Avatar name={f.handle} size={36} uri={f.avatarUrl || undefined} />
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>
                      {f.displayName}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 12 }}>
                      {f.cohort === 'rising' ? 'Rising' : f.cohort === 'legend' ? 'Legend' : 'Established'}{' \u00b7 '}{f.supporterCount} supporters
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                </Pressable>
              ))}
            </View>
          )}

          {/* Moments by category */}
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>MOMENTS</Text>
          {moments.length > 0 ? (
            <View style={{ gap: 12, marginBottom: spacing.md }}>
              {moments.map((m) => {
                const handle = m.favorite?.user?.handle || m.user?.handle || 'rally';
                return (
                  <GlassCard key={m.id}>
                    <View style={styles.row}>
                      <Avatar name={handle} size={40} ring uri={m.favorite?.user?.avatarUrl || undefined} />
                      <Pressable
                        style={{ marginLeft: 12, flex: 1 }}
                        onPress={() => {
                          click();
                          router.push('/moments/' + m.id);
                        }}
                      >
                        <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>
                          {m.title}
                        </Text>
                        <Text style={{ color: colors.muted, fontSize: 13 }}>
                          @{handle}
                          {m.categoryTag ? ' \u00b7 ' + m.categoryTag : ''}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          impact('light');
                          shareMoment(m.title, m.id);
                        }}
                        style={{ paddingHorizontal: 12 }}
                      >
                        <Text style={{ color: GOLD, fontWeight: '700', fontSize: 13 }}>
                          Share
                        </Text>
                      </Pressable>
                    </View>
                  </GlassCard>
                );
              })}
            </View>
          ) : (
            loaded && (
              <EmptyState
                icon="compass-outline"
                title="Nothing here yet"
                body="No Moments in this category yet."
              />
            )
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchInput: {
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: spacing.md,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  modePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followBtn: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    minWidth: 92,
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  risingCard: {
    width: 120,
    height: 130,
    borderRadius: radii.lg,
    padding: 12,
    justifyContent: 'flex-end',
  },
  risingInitials: {
    position: 'absolute',
    top: 10,
    left: 12,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 22,
    fontWeight: '900',
  },
  risingName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  risingSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 2,
  },
  fieldGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  fieldBtn: {
    width: '31%',
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  fieldIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rankNum: {
    width: 20,
    fontWeight: '800',
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
