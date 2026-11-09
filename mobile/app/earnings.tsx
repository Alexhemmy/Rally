/** Favorite Earnings (UX 20) - Rally design
 * Week or Month switch, available balance with pending and next payout
 * day, Cash out button, a bar chart of gifts per day with the peak
 * labelled, and the Moments that drove support. Favorites only.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const TEAL = '#00897B';
const TEAL_DEEP = '#00695C';

type Day = { day: string; total: number; gifts: number };
type MomentRow = { id: string; title: string; total: number; gifts: number };
type Summary = {
  balance: { available: number; pending: number };
  nextPayoutDay: string;
  series: Day[];
  moments: MomentRow[];
};

function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export default function EarningsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();

  const [authed, setAuthed] = useState(!!getToken());
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [data, setData] = useState<Summary | null>(null);

  const load = useCallback(async () => {
    if (!getToken()) { setAuthed(false); setLoading(false); return; }
    setAuthed(true);
    setLoading(true);
    try {
      const res = await api<Summary>('/api/money/earnings-summary?period=' + period);
      setData(res);
      setDenied(false);
    } catch (e: any) {
      if (e && e.message && e.message.toLowerCase().includes('favorite')) setDenied(true);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const peak = data && data.series.length
    ? data.series.reduce((a, b) => (b.total > a.total ? b : a), data.series[0])
    : null;
  const maxTotal = peak ? Math.max(peak.total, 1) : 1;

  return (
    <SwipeBack>
      <Screen refreshing={loading} onRefresh={load}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Earnings</Text>
        </View>

        {!authed ? (
          <EmptyState
            icon="lock-closed-outline"
            title="Log in to see earnings"
            body="Earnings are visible only to the Favorite and their permitted team."
          />
        ) : loading && !data ? (
          <ActivityIndicator color={GOLD} style={{ marginTop: 60 }} />
        ) : denied ? (
          <EmptyState
            icon="sparkles-outline"
            title="For Favorites"
            body="Apply as a Favorite to unlock earnings, payouts and supporter tools."
          />
        ) : data ? (
          <>
            {/* Week / Month switch */}
            <View style={[styles.chipRow, { borderColor: colors.border }]}>
              {(['week', 'month'] as const).map((p) => (
                <Pressable
                  key={p}
                  onPress={() => { impact('light'); setPeriod(p); }}
                  style={[styles.chip, period === p && styles.chipOn]}
                  accessibilityLabel={p === 'week' ? 'Week' : 'Month'}
                >
                  <Text style={[styles.chipText, { color: period === p ? '#111' : colors.muted }]}>
                    {p === 'week' ? 'Week' : 'Month'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Balance card */}
            <LinearGradient
              colors={[TEAL, TEAL_DEEP] as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceCard}
            >
              <Text style={styles.balanceLabel}>AVAILABLE TO CASH OUT</Text>
              <Text style={styles.balanceValue}>{'\u20A6' + fmt(data.balance.available)}</Text>
              <Text style={styles.balanceSub}>{'\u20A6' + fmt(data.balance.pending) + ' pending'}</Text>
              <Text style={styles.balanceSub}>
                {'Next payout day: ' + data.nextPayoutDay}
              </Text>
            </LinearGradient>

            {/* Cash out */}
            <Pressable
              style={({ pressed }) => [styles.cashBtn, pressed && { opacity: 0.85 }]}
              onPress={() => { impact('medium'); router.push('/cash-out'); }}
              accessibilityLabel="Cash out"
            >
              <LinearGradient
                colors={[GOLD, GOLD_DEEP] as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cashGradient}
              >
                <Text style={styles.cashText}>Cash out</Text>
              </LinearGradient>
            </Pressable>

            {/* Gifts per day bar chart */}
            <Text style={[styles.section, { color: colors.muted }]}>GIFTS PER DAY</Text>
            <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {data.series.length === 0 ? (
                <Text style={{ color: colors.muted, fontSize: 13, padding: 16 }}>
                  No gifts in this period yet. Share a Moment to rally your fans.
                </Text>
              ) : (
                <View style={styles.chartRow}>
                  {data.series.map((d) => {
                    const isPeak = peak ? d.day === peak.day : false;
                    const h = 8 + Math.round((d.total / maxTotal) * 64);
                    return (
                      <View key={d.day} style={styles.barCol}>
                        {isPeak ? (
                          <Text style={styles.peakLabel}>{'\u20A6' + fmt(d.total)}</Text>
                        ) : (
                          <View style={styles.peakSpacer} />
                        )}
                        <View style={[styles.bar, { height: h, backgroundColor: isPeak ? GOLD : TEAL + '99' }]} />
                        <Text style={[styles.barDay, { color: colors.muted }]}>{d.day.slice(8)}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Moments that drove support */}
            <Text style={[styles.section, { color: colors.muted }]}>MOMENTS THAT DROVE SUPPORT</Text>
            {data.moments.length === 0 ? (
              <Text style={{ color: colors.muted, fontSize: 13 }}>No Moment gifts yet this period.</Text>
            ) : (
              <View style={{ gap: 10, marginBottom: spacing.lg }}>
                {data.moments.map((m) => (
                  <View
                    key={m.id}
                    style={[styles.momentRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }} numberOfLines={1}>
                        {m.title}
                      </Text>
                      <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                        {m.gifts + ' gifts'}
                      </Text>
                    </View>
                    <Text style={{ color: TEAL, fontWeight: '900', fontSize: 16 }}>{'\u20A6' + fmt(m.total)}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : null}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.sm },
  h1: { fontSize: 24, fontWeight: '900' },
  chipRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radii.full,
    padding: 3,
    marginTop: spacing.md,
  },
  chip: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radii.full },
  chipOn: { backgroundColor: GOLD },
  chipText: { fontWeight: '800', fontSize: 13 },
  balanceCard: { borderRadius: radii.lg, padding: 18, marginTop: spacing.md },
  balanceLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  balanceValue: { color: '#fff', fontSize: 34, fontWeight: '900', marginTop: 4 },
  balanceSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 3 },
  cashBtn: { borderRadius: radii.full, marginTop: spacing.md, overflow: 'hidden' },
  cashGradient: { alignItems: 'center', justifyContent: 'center', paddingVertical: 15 },
  cashText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  section: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: spacing.lg, marginBottom: 10 },
  chartCard: { borderWidth: 1, borderRadius: radii.lg, padding: 14 },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  barCol: { flex: 1, alignItems: 'center' },
  peakLabel: { color: GOLD, fontSize: 10, fontWeight: '900', marginBottom: 4 },
  peakSpacer: { height: 14 },
  bar: { width: '70%', borderRadius: 4 },
  barDay: { fontSize: 10, marginTop: 4 },
  momentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 14,
  },
});
