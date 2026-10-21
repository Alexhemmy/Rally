/** Explore tab
 * Search for any user — Fan or Favorite — by name or handle, follow
 * them inline, or browse Moments by category.
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
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GlassCard, Avatar, EmptyState, Chip } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { spacing } from '@/constants/theme';
import { shareMoment } from '@/hooks/useShare';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { api, getToken } from '@/lib/api';

type SearchTab = 'people' | 'moments';

export default function ExploreTab() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const { click, success } = useSounds();

  const [mode, setMode] = useState<SearchTab>('people');
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [followBusy, setFollowBusy] = useState<string | null>(null);
  const [moments, setMoments] = useState<any[]>([]);
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
        // taxonomy unavailable — Explore falls back to unfiltered moments
      }
    })();
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

  return (
    <Screen refreshing={refreshing} onRefresh={loadMoments}>
      {/* Mode tabs */}
      <View style={[styles.modeRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Pressable
          onPress={() => {
            click();
            setMode('people');
          }}
          style={[styles.modePill, mode === 'people' && { backgroundColor: colors.primary }]}
        >
          <Text style={{ color: mode === 'people' ? '#fff' : colors.muted, fontWeight: '800', fontSize: 13 }}>
            People
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            click();
            setMode('moments');
          }}
          style={[styles.modePill, mode === 'moments' && { backgroundColor: colors.primary }]}
        >
          <Text style={{ color: mode === 'moments' ? '#fff' : colors.muted, fontWeight: '800', fontSize: 13 }}>
            Moments
          </Text>
        </Pressable>
      </View>

      {mode === 'people' ? (
        <>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
            placeholder="Search fans and Favorites by name or @handle"
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={(t) => {
              setQuery(t);
              searchUsers(t);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searching && <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />}
          {users.length > 0 && (
            <View style={{ gap: 10, marginBottom: spacing.md }}>
              {users.map((u) => (
                <GlassCard key={u.id}>
                  <View style={styles.userRow}>
                    <Avatar name={u.handle} size={44} ring uri={u.avatarUrl || undefined} />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>
                        {u.displayName}
                        {u.isFavorite ? ' ★' : ''}
                      </Text>
                      <Text style={{ color: colors.muted, fontSize: 13 }} numberOfLines={1}>
                        @{u.handle}
                        {u.isFavorite ? ' · Favorite' : ' · Fan'}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => toggleFollow(u)}
                      disabled={followBusy === u.id}
                      style={[
                        styles.followBtn,
                        { borderColor: colors.primary },
                        u.isFollowing && { backgroundColor: colors.primary },
                      ]}
                    >
                      <Text
                        style={{
                          color: u.isFollowing ? '#fff' : colors.primary,
                          fontWeight: '800',
                          fontSize: 12,
                        }}
                      >
                        {followBusy === u.id ? '…' : u.isFollowing ? 'Following' : 'Follow'}
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
          {categories.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexGrow: 0, marginBottom: 10 }}
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
                          {m.categoryTag ? ' · ' + m.categoryTag : ''}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          impact('light');
                          shareMoment(m.title, m.id);
                        }}
                        style={{ paddingHorizontal: 12 }}
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
  modeRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 999,
    padding: 4,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    gap: 4,
  },
  modePill: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 999,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 14,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
