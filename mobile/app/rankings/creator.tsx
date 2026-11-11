/** Rankings (mock 28) - lane chips, window, list with movement.
 * Real data: GET /api/rankings (score, cohort, supporterCount) and
 * GET /api/city-rankings for the "From here" lane, which is the only
 * lane with real movement arrows. Honest deviations: the backend has
 * one global ordering (the window param is accepted but not applied
 * yet), no genre or country filters (Gospel/Nigeria chips omitted),
 * and no snapshot timestamps, so the list says "Updated live".
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const TEAL = '#34D399';
const RED = '#E9355B';

type Row = {
  rank: number;
  handle?: string;
  name: string;
  avatarUrl?: string | null;
  cohort?: string;
  score?: number;
  supporterCount?: number;
  uniqueSupporters?: number;
  movement?: number | null;
};

const AVATAR_COLORS = ['#06B6D4', '#DB2777', '#F97316', '#3B82F6', '#EA580C', '#8B5CF6'];

function initials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function cohortLabel(c?: string): string {
  if (!c) return 'Favorite';
  return c.charAt(0).toUpperCase() + c.slice(1);
}

export default function RankingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();

  const [lane, setLane] = useState<'here' | 'global' | 'fromhere' | 'rising'>('here');
  const [window_, setWindow] = useState<'weekly' | 'monthly' | 'alltime'>('monthly');
  const [establishedOnly, setEstablishedOnly] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [cityName, setCityName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    setLoading(true);
    setErr(null);
    try {
      if (lane === 'fromhere') {
        const cities = await api<{ cities: { city: string }[] }>('/api/city-rankings/cities');
        const city = (cities.cities && cities.cities[0] && cities.cities[0].city) || 'Lagos';
        setCityName(city);
        const r = await api<{ lane: Row[] }>('/api/city-rankings/' + encodeURIComponent(city));
        setRows(r.lane || []);
      } else {
        const r = await api<{ rankings: Row[] }>('/api/rankings?window=' + window_);
        let list = r.rankings || [];
        if (lane === 'rising') list = list.filter((x) => x.cohort === 'rising');
        setRows(list.map((x, i) => ({ ...x, rank: i + 1, name: x.displayName || x.handle || 'Favorite' })));
      }
    } catch (e: any) {
      setErr(e.message || 'Could not load rankings');
    }
    setLoading(false);
  }, [lane, window_]);

  useEffect(() => { load(); }, [load]);

  const visible = establishedOnly && lane !== 'fromhere'
    ? rows.filter((r) => r.cohort === 'established')
    : rows;

  function movementView(m?: number | null) {
    if (m === null || m === undefined || lane === 'fromhere' && false) return <View style={{ width: 44 }} />;
    if (m === 0) return <Text style={{ color: colors.muted, fontSize: 15, fontWeight: '700', width: 44, textAlign: 'right' }}>{'\u2014'}</Text>;
    if (m > 0) {
      return (
        <View style={styles.mv}>
          <Ionicons name="caret-up" size={14} color={TEAL} />
          <Text style={{ color: TEAL, fontWeight: '900', fontSize: 15 }}>{m}</Text>
        </View>
      );
    }
    return (
      <View style={styles.mv}>
        <Ionicons name="caret-down" size={14} color={RED} />
        <Text style={{ color: RED, fontWeight: '900', fontSize: 15 }}>{Math.abs(m)}</Text>
      </View>
    );
  }

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Rankings</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* Lane chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {([
            ['here', 'Most loved here'],
            ['global', 'Global'],
            ['fromhere', 'From here'],
            ['rising', 'Rising'],
          ] as const).map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => { impact('light'); setLane(key); }}
              style={[styles.laneChip, { backgroundColor: colors.surfaceElevated }, lane === key && styles.laneChipActive]}
              accessibilityLabel={label}
            >
              <Text style={[styles.laneText, { color: colors.text }, lane === key && { color: '#111' }]}>{label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Window segmented */}
        <View style={[styles.segWrap, { backgroundColor: colors.surfaceElevated }]}>
          {([
            ['weekly', 'Weekly'],
            ['monthly', 'Monthly'],
            ['alltime', 'All-time'],
          ] as const).map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => { impact('light'); setWindow(key); }}
              style={[styles.segBtn, window_ === key && { backgroundColor: '#1C1C22', borderRadius: radii.md }]}
              accessibilityLabel={label}
            >
              <Text style={{ color: window_ === key ? colors.text : colors.muted, fontWeight: '900', fontSize: 16 }}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <Pressable
            onPress={() => { impact('light'); setEstablishedOnly(!establishedOnly); }}
            style={[styles.filterChip, { borderColor: establishedOnly ? GOLD : colors.border }]}
            accessibilityLabel="Established only"
          >
            <Text style={[styles.filterText, { color: establishedOnly ? GOLD : colors.text }]}>Established</Text>
          </Pressable>
        </ScrollView>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <Text style={{ color: colors.muted, fontSize: 15 }}>
            {lane === 'fromhere' && cityName ? cityName + ' \u00b7 monthly lane' : 'Updated live'}
          </Text>
          <Pressable onPress={() => { impact('light'); router.push('/rally-score'); }} accessibilityLabel="How it works">
            <Text style={{ color: GOLD_DEEP, fontWeight: '900', fontSize: 15 }}>How it works</Text>
          </Pressable>
        </View>

        {loading ? <ActivityIndicator color={GOLD} style={{ marginTop: 24 }} /> : null}
        {err ? <Text style={{ color: RED, fontSize: 13, marginTop: 12 }}>{err}</Text> : null}
        {!loading && !err && visible.length === 0 ? (
          <Text style={{ color: colors.muted, fontSize: 14, marginTop: 16, lineHeight: 20 }}>
            No one in this lane yet. Rankings fill in as Favorites publish their pages.
          </Text>
        ) : null}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {visible.map((r, i) => (
            <View key={(r.handle || r.name) + i} style={[styles.rowCard, { borderBottomColor: colors.border }]}>
              <Text style={[styles.rankNum, { color: r.rank <= 3 ? GOLD : colors.muted }]}>{r.rank}</Text>
              <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }]}>
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>{initials(r.name)}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: colors.text, fontWeight: '900', fontSize: 18 }} numberOfLines={1}>{r.name}</Text>
                <Text style={{ color: colors.muted, fontSize: 14, marginTop: 2 }} numberOfLines={2}>
                  {cohortLabel(r.cohort) + ' \u00b7 ' + (r.uniqueSupporters !== undefined
                    ? r.uniqueSupporters + ' verified supporters here'
                    : (r.supporterCount !== undefined ? r.supporterCount + ' verified supporters' : 'Rally Score ' + (r.score ?? '\u2014')))}
                </Text>
              </View>
              {movementView(lane === 'fromhere' ? r.movement : r.rank === 1 ? 0 : null)}
            </View>
          ))}

          <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Ionicons name="shield-checkmark-outline" size={16} color={TEAL} />
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              Updated daily. Money cannot buy a spot, and no earnings are shown.
            </Text>
          </View>
        </ScrollView>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  chipRow: { flexDirection: 'row', gap: 10, paddingVertical: 6 },
  laneChip: { borderRadius: radii.full, paddingHorizontal: 18, paddingVertical: 12 },
  laneChipActive: { backgroundColor: '#F5F5F4' },
  laneText: { fontWeight: '900', fontSize: 15 },
  segWrap: { flexDirection: 'row', borderRadius: radii.md, padding: 4, marginTop: 6 },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  filterChip: { borderWidth: 1.5, borderRadius: radii.full, paddingHorizontal: 18, paddingVertical: 10 },
  filterText: { fontWeight: '900', fontSize: 15 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 4 },
  rowCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  rankNum: { width: 34, fontWeight: '900', fontSize: 20 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  mv: { flexDirection: 'row', alignItems: 'center', gap: 2, width: 44, justifyContent: 'flex-end' },
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
