/** Following (UX 41) - Rally design
 * Search Favorites and manage who you follow. Follow state is real
 * (/api/users/search + follow/unfollow endpoints). Live-now and genre
 * filters arrive with the feed backend.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const TEAL = '#34D399';

type UserRow = {
  handle: string;
  displayName: string;
  avatarUrl?: string | null;
  isFollowing?: boolean;
  favoriteProfile?: { supporterCount?: number } | null;
};

const FILTERS = ['All', 'Following', 'Not following'] as const;
type Filter = (typeof FILTERS)[number];

const AVATAR_COLORS = ['#F4511E', '#00BCD4', '#7C4DFF', '#5C6BC0', '#AB47BC', '#66BB6A'];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0] || 'R')[0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

export default function FollowingScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();

  const [q, setQ] = useState('');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [filter, setFilter] = useState<Filter>('All');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!getToken()) return;
    setLoading(true);
    try {
      const r: any = await api('/api/users/search?q=' + encodeURIComponent(query) + '&role=FAVORITE');
      setUsers(r.users || []);
    } catch { /* offline */ }
    setSearched(true);
    setLoading(false);
  }, []);

  useEffect(() => { search(''); }, [search]);

  async function toggleFollow(u: UserRow) {
    if (busy) return;
    setBusy(u.handle);
    impact('medium');
    try {
      if (u.isFollowing) {
        await api('/api/users/' + u.handle + '/follow', { method: 'DELETE' });
      } else {
        await api('/api/users/' + u.handle + '/follow', { method: 'POST' });
      }
      setUsers((prev) => prev.map((x) => (x.handle === u.handle ? { ...x, isFollowing: !u.isFollowing } : x)));
    } catch { /* keep state */ }
    setBusy(null);
  }

  const filtered = users.filter((u) => {
    if (filter === 'Following') return u.isFollowing;
    if (filter === 'Not following') return !u.isFollowing;
    return true;
  });
  const followingCount = users.filter((u) => u.isFollowing).length;

  return (
    <SwipeBack>
      <Screen>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Following</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* Search */}
        <View style={[styles.searchBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search Favorites you follow"
            placeholderTextColor={colors.muted}
            value={q}
            onChangeText={setQ}
            onSubmitEditing={() => search(q)}
            returnKeyType="search"
          />
        </View>

        {/* Filters */}
        <View style={styles.chipWrap}>
          {FILTERS.map((f) => {
            const on = filter === f;
            const label = f === 'All' ? 'All ' + users.length : f === 'Following' ? 'Following ' + followingCount : f;
            return (
              <Pressable
                key={f}
                onPress={() => { impact('light'); setFilter(f); }}
                style={[styles.chip, on ? { borderColor: GOLD, backgroundColor: GOLD + '1a' } : { backgroundColor: colors.surfaceElevated, borderColor: 'transparent' }]}
                accessibilityLabel={f}
              >
                <Text style={{ color: on ? GOLD : colors.text, fontWeight: '800', fontSize: 14 }}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <ActivityIndicator color={GOLD} style={{ marginTop: 30 }} />
        ) : filtered.length === 0 ? (
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: spacing.md }}>
            {searched && q
              ? 'No Favorites match "' + q + '".'
              : 'Search to find Favorites. Live-now and genre filters arrive with the feed backend.'}
          </Text>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {filtered.map((u, i) => (
              <View
                key={u.handle}
                style={[styles.row, i < filtered.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
              >
                <Pressable style={styles.rowMain} onPress={() => router.push('/favorite/' + u.handle)} accessibilityLabel={u.displayName}>
                  <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }]}>
                    <Text style={styles.avatarText}>{initials(u.displayName)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16 }}>{u.displayName}</Text>
                    <Text style={{ color: colors.muted, fontSize: 13, marginTop: 1 }}>
                      @{u.handle}
                      {u.favoriteProfile && u.favoriteProfile.supporterCount
                        ? ' · ' + Number(u.favoriteProfile.supporterCount).toLocaleString('en-US') + ' supporters'
                        : ''}
                    </Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => toggleFollow(u)}
                  disabled={busy === u.handle}
                  style={[styles.followPill, u.isFollowing ? { backgroundColor: colors.surfaceElevated } : { backgroundColor: GOLD }]}
                  accessibilityLabel={u.isFollowing ? 'Unfollow' : 'Follow'}
                >
                  <Text style={{ color: u.isFollowing ? colors.text : '#111', fontWeight: '800', fontSize: 13 }}>
                    {busy === u.handle ? '…' : u.isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </Pressable>
              </View>
            ))}

            {/* Note */}
            <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, marginTop: spacing.md }]}>
              <Ionicons name="notifications-outline" size={16} color={TEAL} />
              <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                Tap a Favorite to visit their page. Per-Favorite notification settings arrive with the notifications backend.
              </Text>
            </View>
          </ScrollView>
        )}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: radii.full, paddingHorizontal: 16, paddingVertical: 12 },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: spacing.md, marginBottom: spacing.xs },
  chip: { borderWidth: 1.5, borderRadius: radii.full, paddingHorizontal: 18, paddingVertical: 9 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  rowMain: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  followPill: { borderRadius: radii.full, paddingHorizontal: 18, paddingVertical: 10 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: radii.lg, padding: 12 },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
