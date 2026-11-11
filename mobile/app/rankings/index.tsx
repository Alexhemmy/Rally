/** Rankings (UX 35)
 * Snapshot of the most-loved Favorites. Money cannot buy a spot and no
 * earnings are shown. Filter by cohort; weekly and monthly windows
 * arrive with the analytics backend.
 */
import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Avatar, EmptyState } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { api } from '@/lib/api';
import { spacing, radii, type as typo } from '@/constants/theme';
import { useSounds } from '@/hooks/useSounds';
import { useHaptics } from '@/hooks/useHaptics';

const GOLD = '#FFA726';
const TEAL = '#34D399';

type RankingEntry = {
  handle: string;
  name?: string;
  displayName?: string;
  score: number;
  avatarUrl?: string | null;
  cohort?: string;
  supporterCount?: number;
};

const COHORTS = ['All', 'Rising', 'Established', 'Legend'] as const;
type Cohort = (typeof COHORTS)[number];

export default function RankingsScreen() {
  const { colors } = useTheme();
  const { click } = useSounds();
  const { impact } = useHaptics();
  const router = useRouter();

  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [cohort, setCohort] = useState<Cohort>('All');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await api<{ rankings: RankingEntry[] }>('/api/rankings');
      setRankings(r.rankings || []);
    } catch {
      // offline
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = cohort === 'All'
    ? rankings
    : rankings.filter((e) => (e.cohort || '').toLowerCase() === cohort.toLowerCase());

  function howItWorks() {
    Alert.alert(
      'How Rankings work',
      'Rank blends unique supporters, gifts (soft-capped so money never dominates) and recent activity. It updates daily, money cannot buy a spot, and no earnings are shown.'
    );
  }

  return (
    <SwipeBack>
      <Screen refreshing={refreshing} onRefresh={load}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Rankings</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* Snapshot row */}
        <View style={styles.snapshotRow}>
          <Text style={{ color: colors.muted, fontSize: 13 }}>Snapshot · updated daily</Text>
          <Pressable onPress={howItWorks} hitSlop={6} accessibilityLabel="How it works">
            <Text style={{ color: GOLD, fontWeight: '800', fontSize: 13 }}>How it works</Text>
          </Pressable>
        </View>

        {/* Cohort chips */}
        <View style={styles.chipWrap}>
          {COHORTS.map((c) => {
            const on = cohort === c;
            return (
              <Pressable
                key={c}
                onPress={() => { impact('light'); setCohort(c); }}
                style={[styles.chip, on ? { borderColor: GOLD, backgroundColor: GOLD + '1a' } : { backgroundColor: colors.surfaceElevated, borderColor: 'transparent' }]}
                accessibilityLabel={c}
              >
                <Text style={{ color: on ? GOLD : colors.text, fontWeight: '800', fontSize: 13 }}>{c}</Text>
              </Pressable>
            );
          })}
        </View>

        {rankings.length === 0 && !refreshing ? (
          <EmptyState
            icon="trophy-outline"
            title="No rankings yet"
            body="Check back later — rankings update daily as Favorites earn support."
            action={
              <Pressable
                onPress={() => {
                  click();
                  router.push('/search');
                }}
              >
                <Text style={{ color: colors.primary, fontWeight: '700' }}>
                  Explore Favorites
                </Text>
              </Pressable>
            }
          />
        ) : filtered.length === 0 ? (
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: spacing.md }}>
            No {cohort.toLowerCase()} Favorites on the board right now.
          </Text>
        ) : (
          <View style={{ marginTop: spacing.sm }}>
            {filtered.map((entry, index) => (
              <Pressable
                key={entry.handle}
                onPress={() => {
                  click();
                  impact('light');
                  router.push('/favorite/' + entry.handle);
                }}
                style={({ pressed }) => [
                  styles.row,
                  {
                    borderBottomWidth: index < filtered.length - 1 ? StyleSheet.hairlineWidth : 0,
                    borderBottomColor: colors.border,
                    backgroundColor: pressed ? colors.surfaceHover : 'transparent',
                  },
                ]}
              >
                <Text style={[styles.rank, { color: GOLD }]}>{index + 1}</Text>
                <Avatar
                  uri={entry.avatarUrl || undefined}
                  name={entry.displayName || entry.name || entry.handle}
                  size={44}
                  ring={index < 3}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                    {entry.displayName || entry.name || entry.handle}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 13 }} numberOfLines={1}>
                    {(entry.cohort ? entry.cohort.charAt(0).toUpperCase() + entry.cohort.slice(1) : 'Favorite') +
                      ' · ' + (entry.supporterCount ? entry.supporterCount.toLocaleString('en-US') + ' supporters' : '@' + entry.handle)}
                  </Text>
                </View>
                <Text style={[styles.score, { color: colors.primary }]}>{entry.score}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Fair-play note */}
        <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Ionicons name="shield-checkmark-outline" size={16} color={TEAL} />
          <Text style={[styles.noteText, { color: colors.textSecondary }]}>
            Updated daily. Money cannot buy a spot, and no earnings are shown.
          </Text>
        </View>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.sm },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  snapshotRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: spacing.md, marginBottom: spacing.sm },
  chip: { borderWidth: 1.5, borderRadius: radii.full, paddingHorizontal: 18, paddingVertical: 9 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 10,
  },
  rank: { fontWeight: '900', fontSize: 18, width: 26 },
  name: { fontWeight: '700', fontSize: 15, marginBottom: 1 },
  score: { fontWeight: '800', fontSize: 15 },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 14,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  noteText: { flex: 1, fontSize: 13, lineHeight: 19 },
});
