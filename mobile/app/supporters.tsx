/** Supporters (mock 16) - the fans behind the Favorite.
 * Search plus Top / New / Fan Club / Not thanked filters over the
 * supporter wall's recent senders. Thank marks are local (no
 * thank-you endpoint yet); anonymous fans never appear by design, so
 * the privacy note from the mock is literally true.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#FFA726';
const TEAL = '#34D399';

type Sender = { handle?: string; displayName?: string; avatarUrl?: string };
type Recent = { sender: Sender; message: string | null; tokenCost: number; createdAt: string };

const FILTERS = ['Top', 'New', 'Fan Club', 'Not thanked'] as const;
type Filter = (typeof FILTERS)[number];

const AVATAR_COLORS = ['#00BCD4', '#F4511E', '#AB47BC', '#5C6BC0', '#66BB6A'];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0] || 'R')[0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

function when(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  return Math.floor(hrs / 24) + 'd ago';
}

export default function SupportersScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const { click, success } = useSounds();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('Top');
  const [recent, setRecent] = useState<Recent[]>([]);
  const [supporterCount, setSupporterCount] = useState(0);
  const [thanked, setThanked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    setLoading(true);
    try {
      const handleRaw = await AsyncStorage.getItem('rally.myHandle');
      const handle = handleRaw ? JSON.parse(handleRaw) : null;
      if (handle) {
        const u = await api<any>('/api/users/' + handle);
        setRecent((u.supporterWall && u.supporterWall.recent) || []);
        setSupporterCount(Number(u.favoriteProfile && u.favoriteProfile.supporterCount ? u.favoriteProfile.supporterCount : 0));
      }
      const tRaw = await AsyncStorage.getItem('rally.thanked');
      if (tRaw) setThanked(JSON.parse(tRaw));
    } catch { /* offline */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function thank(name: string) {
    impact('medium');
    click();
    success();
    const next = { ...thanked, [name]: true };
    setThanked(next);
    try {
      await AsyncStorage.setItem('rally.thanked', JSON.stringify(next));
    } catch { /* local only */ }
  }

  const rows = useMemo(() => {
    let list = recent.slice();
    const nameOf = (r: Recent) => (r.sender && (r.sender.displayName || r.sender.handle)) || 'Anonymous Fan';
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((r) => nameOf(r).toLowerCase().indexOf(q) > -1);
    }
    if (filter === 'Top') list.sort((a, b) => b.tokenCost - a.tokenCost);
    if (filter === 'New') list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    if (filter === 'Not thanked') list = list.filter((r) => !thanked[nameOf(r)]);
    // 'Fan Club' has no per-supporter membership data yet - shows the same list.
    return list;
  }, [recent, query, filter, thanked]);

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Supporters</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* Search */}
        <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            style={{ flex: 1, color: colors.text, fontSize: 16, marginLeft: 10 }}
            placeholder="Search supporters"
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
        </View>

        {/* Filters */}
        <View style={styles.chipWrap}>
          {FILTERS.map((f) => {
            const on = filter === f;
            return (
              <Pressable
                key={f}
                onPress={() => { impact('light'); setFilter(f); }}
                style={[styles.chip, on ? { borderColor: GOLD, backgroundColor: GOLD + '1a' } : { backgroundColor: colors.surfaceElevated, borderColor: 'transparent' }]}
                accessibilityLabel={f}
              >
                <Text style={{ color: on ? GOLD : colors.text, fontWeight: '800', fontSize: 14 }}>{f}</Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
          {supporterCount > 0 ? (
            <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 6 }}>
              {supporterCount.toLocaleString('en-US') + ' supporters all time'}
            </Text>
          ) : null}

          {loading ? (
            <Text style={{ color: colors.muted, fontSize: 14 }}>Loading\u2026</Text>
          ) : rows.length === 0 ? (
            <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>
              No supporters to show here yet. Gifts and fan club joins will appear as they happen.
            </Text>
          ) : (
            rows.map((r, i) => {
              const name = (r.sender && (r.sender.displayName || r.sender.handle)) || 'Anonymous Fan';
              const isThanked = !!thanked[name];
              const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
              return (
                <View key={name + r.createdAt + i} style={[styles.row, i < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                  <View style={[styles.avatar, { backgroundColor: color }]}>
                    <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>{initials(name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 }}>{name}</Text>
                    <Text style={{ color: colors.muted, fontSize: 14, marginTop: 2 }} numberOfLines={1}>
                      {r.message ? r.message : fmtCost(r.tokenCost) + ' \u00b7 ' + when(r.createdAt)}
                    </Text>
                  </View>
                  {isThanked ? (
                    <Ionicons name="heart" size={18} color={TEAL} />
                  ) : (
                    <Pressable onPress={() => thank(name)} style={styles.thankBtn} accessibilityLabel="Thank supporter">
                      <Text style={{ color: '#111', fontWeight: '900', fontSize: 14 }}>Thank</Text>
                    </Pressable>
                  )}
                </View>
              );
            })
          )}

          {/* Privacy note */}
          <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Ionicons name="eye-outline" size={16} color={TEAL} />
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              You see names and levels. Anonymous fans stay anonymous to you too.
            </Text>
          </View>
        </ScrollView>
      </Screen>
    </SwipeBack>
  );
}

function fmtCost(n: number): string {
  return fmtTokens(n) + ' tokens';
}

function fmtTokens(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: spacing.md, marginBottom: spacing.sm },
  chip: { borderWidth: 1.5, borderRadius: radii.full, paddingHorizontal: 18, paddingVertical: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  thankBtn: { backgroundColor: GOLD, borderRadius: radii.full, paddingHorizontal: 18, paddingVertical: 10 },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 14,
    marginTop: spacing.md,
  },
  noteText: { flex: 1, fontSize: 14, lineHeight: 20 },
});
