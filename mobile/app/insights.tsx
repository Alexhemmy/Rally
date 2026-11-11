/** Insights (mock 15) - creator analytics over 7 / 28 / 90 days.
 * Stat cards, a bars chart and the top Moment, all from real data
 * (earnings summary + supporter count). Reach, watch time, deltas and
 * city/language breakdowns have no backend yet, so the screen says so
 * instead of inventing numbers.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#FFA726';

type Day = { day: string; total: number; gifts: number };
type MomentRow = { id: string; title: string; total: number; gifts: number };
type Summary = { series: Day[]; moments: MomentRow[]; balance: { available: number; pending: number } };

const RANGES = ['7 days', '28 days', '90 days'] as const;

function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

function compact(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function dayLabel(iso: string): string {
  try {
    return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
  } catch { return iso.slice(5); }
}

export default function InsightsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();

  const [range, setRange] = useState<(typeof RANGES)[number]>('28 days');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [supporters, setSupporters] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    setLoading(true);
    try {
      const period = range === '7 days' ? 'week' : 'month';
      const s = await api<Summary>('/api/money/earnings-summary?period=' + period);
      setSummary(s);
      try {
        const handleRaw = await AsyncStorage.getItem('rally.myHandle');
        const handle = handleRaw ? JSON.parse(handleRaw) : null;
        if (handle) {
          const u = await api<any>('/api/users/' + handle);
          setSupporters(Number(u.favoriteProfile && u.favoriteProfile.supporterCount ? u.favoriteProfile.supporterCount : 0));
        }
      } catch { /* supporters optional */ }
    } catch { /* offline */ }
    setLoading(false);
  }, [range]);

  useEffect(() => { load(); }, [load]);

  const series = summary ? summary.series : [];
  const giftsTotal = series.reduce((a, b) => a + b.total, 0);
  const giftsCount = series.reduce((a, b) => a + b.gifts, 0);
  const momentCount = summary ? summary.moments.length : 0;
  const avgPerMoment = momentCount > 0 ? Math.round(giftsTotal / momentCount) : 0;
  const maxTotal = series.length ? Math.max(...series.map((d) => d.total), 1) : 1;
  const top = summary && summary.moments.length ? summary.moments[0] : null;

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Insights</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* Range chips */}
        <View style={styles.chipRow}>
          {RANGES.map((r) => {
            const on = range === r;
            return (
              <Pressable
                key={r}
                onPress={() => { impact('light'); setRange(r); }}
                style={[styles.chip, on ? { borderColor: GOLD, backgroundColor: GOLD + '1a' } : { backgroundColor: colors.surfaceElevated, borderColor: 'transparent' }]}
                accessibilityLabel={r}
              >
                <Text style={{ color: on ? GOLD : colors.text, fontWeight: '800', fontSize: 14 }}>{r}</Text>
              </Pressable>
            );
          })}
        </View>

        {loading && !summary ? (
          <ActivityIndicator color={GOLD} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
            {/* Stat cards */}
            <View style={styles.grid}>
              {[
                { label: 'Gifts', value: '\u20A6' + compact(giftsTotal) },
                { label: 'Supporters', value: compact(supporters) },
                { label: 'Moments', value: String(momentCount) },
                { label: 'Avg per Moment', value: '\u20A6' + compact(avgPerMoment) },
              ].map((c) => (
                <View key={c.label} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={{ color: colors.muted, fontSize: 14 }}>{c.label}</Text>
                  <Text style={{ color: colors.text, fontSize: 30, fontWeight: '900', marginTop: 4 }}>{c.value}</Text>
                </View>
              ))}
            </View>

            {/* Bars */}
            <Text style={[styles.section, { color: colors.muted }]}>
              {range === '7 days' ? 'GIFTS PER DAY' : 'GIFTS PER DAY \u00b7 LAST ' + range.toUpperCase()}
            </Text>
            {series.length === 0 ? (
              <Text style={{ color: colors.muted, fontSize: 14 }}>No gift activity in this range yet.</Text>
            ) : (
              <View style={styles.chartRow}>
                {series.map((d) => {
                  const h = 10 + Math.round((d.total / maxTotal) * 72);
                  const isPeak = d.total === maxTotal;
                  return (
                    <View key={d.day} style={styles.barCol}>
                      {isPeak ? <Text style={styles.peak}>{fmt(d.total)}</Text> : <View style={styles.peakSpacer} />}
                      <LinearGradient
                        colors={[GOLD, '#F57C00'] as [string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={[styles.bar, { height: h, opacity: isPeak ? 1 : 0.75 }]}
                      />
                      <Text style={{ color: colors.muted, fontSize: 11, marginTop: 6 }}>
                        {series.length <= 8 ? dayLabel(d.day) : d.day.slice(8)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Top moment */}
            <Text style={[styles.section, { color: colors.muted }]}>TOP MOMENT</Text>
            {top ? (
              <View style={[styles.topCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <LinearGradient colors={['#B34FD1', GOLD] as [string, string]} style={styles.topThumb}>
                  <Ionicons name="videocam-outline" size={22} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 }} numberOfLines={1}>{top.title}</Text>
                  <Text style={{ color: colors.muted, fontSize: 13, marginTop: 3 }}>
                    {fmt(top.gifts) + ' Gifts \u00b7 \u20A6' + fmt(top.total)}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={{ color: colors.muted, fontSize: 14 }}>Post a Moment to see your top performer.</Text>
            )}

            {/* Honest scope note */}
            <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Ionicons name="globe-outline" size={16} color={GOLD} />
              <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                {'Reach, watch time, fan deltas and city or language breakdowns arrive with the analytics backend. ' + fmt(giftsCount) + ' gifts counted in this range.'}
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
  chipRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.md },
  chip: { borderWidth: 1.5, borderRadius: radii.full, paddingHorizontal: 18, paddingVertical: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { borderWidth: 1, borderRadius: radii.lg, padding: 16, width: '47.5%', flexGrow: 1 },
  section: { fontSize: 13, fontWeight: '900', letterSpacing: 0.8, marginTop: spacing.lg, marginBottom: 10 },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  barCol: { flex: 1, alignItems: 'center' },
  peak: { color: GOLD, fontSize: 10, fontWeight: '900', marginBottom: 4 },
  peakSpacer: { height: 16 },
  bar: { width: '100%', borderRadius: 6 },
  topCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radii.lg, padding: 14 },
  topThumb: { width: 64, height: 64, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
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
