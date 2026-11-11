/** Badges and Levels (UX 36) - Rally design
 * Your level for one Favorite with progress to the next, then earned and
 * locked badges. Locked badges say how to earn them. Recognition never
 * affects giveaways, thresholds or rankings.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const GREEN = '#34D399';
const PURPLE = '#A78BFA';
const RED = '#F87171';
const BLUE = '#60A5FA';
const TEAL = '#2DD4BF';
const PINK = '#F472B6';
const ORANGE = '#FB923C';

const ICONS: Record<string, string> = {
  'first-supporter': 'heart',
  'day-one': 'flag',
  'top-10': 'podium',
  'one-year': 'ribbon',
  streak: 'flame',
  translator: 'language',
  impact: 'leaf',
  'fan-club': 'people',
};
const COLORS: Record<string, string> = {
  'first-supporter': ORANGE,
  'day-one': GREEN,
  'top-10': PURPLE,
  'one-year': BLUE,
  streak: RED,
  translator: TEAL,
  impact: GREEN,
  'fan-club': PINK,
};

type Badge = { slug: string; name: string; earned: boolean; context: string | null; hint: string };
type Data = {
  favorite: { displayName: string };
  level: { name: string; progress: number; next: string | null };
  badges: Badge[];
  earnedCount: number;
  total: number;
  note: string;
};

export default function BadgesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const params = useLocalSearchParams<{ handle?: string; name?: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!params.handle) { setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api<Data>('/api/badges/' + params.handle);
      setData(res);
    } catch (e: any) {
      setError(e && e.message ? e.message : 'Could not load badges.');
    } finally { setLoading(false); }
  }, [params.handle]);

  useEffect(() => { load(); }, [load]);

  const earned = data ? data.badges.filter((b) => b.earned) : [];
  const locked = data ? data.badges.filter((b) => !b.earned) : [];

  return (
    <SwipeBack>
      <Screen refreshing={loading} onRefresh={load}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Badges</Text>
        </View>

        {!params.handle ? (
          <EmptyState icon="sparkles-outline" title="Pick a Favorite" body="Open a Favorite page, then Badges to see your level there." />
        ) : !getToken() ? (
          <EmptyState icon="lock-closed-outline" title="Log in to see your badges" body="Badges recognize you as a fan. They never affect giveaways or rankings." />
        ) : loading && !data ? (
          <ActivityIndicator color={GOLD} style={{ marginTop: 60 }} />
        ) : error ? (
          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 20 }}>{error}</Text>
        ) : data ? (
          <>
            {/* Level card */}
            <View style={[styles.levelCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>
                {'YOUR LEVEL FOR ' + data.favorite.displayName.toUpperCase()}
              </Text>
              <View style={styles.levelRow}>
                <Text style={{ color: GOLD, fontSize: 30, fontWeight: '900' }}>{data.level.name}</Text>
                {data.level.next ? (
                  <View style={styles.nextChip}>
                    <Text style={styles.nextText}>{'NEXT: ' + data.level.next}</Text>
                  </View>
                ) : null}
              </View>
              <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
                <View style={[styles.barFill, { width: data.level.progress + '%' }]} />
              </View>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 8, lineHeight: 17 }}>
                {data.level.progress + '% of the way. Levels are set by ' + data.favorite.displayName + ' and never affect giveaways or rankings.'}
              </Text>
              <Pressable onPress={() => router.push('/level-progress?handle=' + params.handle)} hitSlop={6} accessibilityLabel="How points work">
                <Text style={{ color: GOLD, fontWeight: '800', fontSize: 13, marginTop: 10 }}>How points work</Text>
              </Pressable>
            </View>

            {/* Earned */}
            <Text style={[styles.section, { color: colors.muted }]}>{'EARNED \u00B7 ' + data.earnedCount + ' OF ' + data.total}</Text>
            <View style={styles.grid}>
              {earned.map((b) => (
                <View key={b.slug} style={[styles.badgeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={[styles.badgeIcon, { backgroundColor: (COLORS[b.slug] || GOLD) + '22' }]}>
                    <Ionicons name={(ICONS[b.slug] || 'ribbon') + ''} size={22} color={COLORS[b.slug] || GOLD} />
                  </View>
                  <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13, marginTop: 8, textAlign: 'center' }}>{b.name}</Text>
                  {b.context ? (
                    <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2, textAlign: 'center' }}>{b.context}</Text>
                  ) : null}
                </View>
              ))}
              {earned.length === 0 ? (
                <Text style={{ color: colors.muted, fontSize: 12 }}>No badges yet. Keep showing up.</Text>
              ) : null}
            </View>

            {/* Locked */}
            <Text style={[styles.section, { color: colors.muted }]}>LOCKED</Text>
            <View style={styles.grid}>
              {locked.map((b) => (
                <View key={b.slug} style={[styles.badgeCard, { backgroundColor: colors.surface, borderColor: colors.border, opacity: 0.55 }]}>
                  <View style={[styles.badgeIcon, { backgroundColor: colors.border }]}>
                    <Ionicons name={ICONS[b.slug] || 'ribbon'} size={22} color={colors.muted} />
                  </View>
                  <Text style={{ color: colors.muted, fontWeight: '800', fontSize: 13, marginTop: 8, textAlign: 'center' }}>{b.name}</Text>
                  <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2, textAlign: 'center' }}>{b.hint}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.note, { color: colors.muted }]}>{data.note}</Text>
          </>
        ) : null}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.sm },
  h1: { fontSize: 24, fontWeight: '900' },
  levelCard: { borderWidth: 1, borderRadius: radii.lg, padding: 18, marginTop: spacing.sm },
  levelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  nextChip: { backgroundColor: GOLD + '22', borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 4 },
  nextText: { color: GOLD, fontSize: 10, fontWeight: '900' },
  barTrack: { height: 8, borderRadius: 4, marginTop: 12, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: GOLD },
  section: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: spacing.lg, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeCard: {
    width: '31%',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 12,
    alignItems: 'center',
  },
  badgeIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  note: { fontSize: 12, lineHeight: 18, marginTop: spacing.lg, marginBottom: spacing.lg },
});
