/** Earnings Statement (mock 14) - this month's money in and out.
 * Filter chips (All / Gifts / Orders / Fan Club / Cash-outs), grouped
 * rows with green credits and white debits, an Export action and the
 * platform-fee note. Built from /api/favorites/me/earnings: gift and
 * subscription earnings plus payouts. Orders have no favorite-side
 * earnings rows yet, so that filter shows an honest empty note.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const TEAL = '#2BD9A9';

type Earning = { id: string; source_type: string; source_id: string; amount: number; currency: string; status: string; created_at: string };
type Payout = { id: string; amount: number; status: string; created_at: string; destination?: string };

type Row = {
  key: string;
  kind: 'gift' | 'subscription' | 'payout';
  title: string;
  sub: string;
  amount: number;
  day: string;
};

const FILTERS = ['All', 'Gifts', 'Orders', 'Fan Club', 'Cash-outs'] as const;
type Filter = (typeof FILTERS)[number];

function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

function dayLabel(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch { return iso.slice(0, 10); }
}

function sameMonth(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getUTCMonth() === now.getUTCMonth() && d.getUTCFullYear() === now.getUTCFullYear();
}

export default function StatementScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();

  const [filter, setFilter] = useState<Filter>('All');
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await api<{ earnings: Earning[]; payouts: Payout[] }>('/api/favorites/me/earnings');
      setEarnings(res.earnings || []);
      setPayouts(res.payouts || []);
    } catch { /* offline */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    // Group gift earnings by day: "Fri 7 Nov - 41 Gifts"
    const giftDays = new Map<string, { total: number; count: number }>();
    earnings.filter((e) => e.source_type === 'gift').forEach((e) => {
      const day = e.created_at.slice(0, 10);
      const cur = giftDays.get(day) || { total: 0, count: 0 };
      cur.total += Number(e.amount || 0);
      cur.count += 1;
      giftDays.set(day, cur);
    });
    giftDays.forEach((v, day) => {
      out.push({ key: 'gift-' + day, kind: 'gift', title: 'Gifts', sub: dayLabel(day) + ' \u00b7 ' + v.count + ' Gifts', amount: v.total, day });
    });
    // Fan club
    const subDays = new Map<string, { total: number; count: number }>();
    earnings.filter((e) => e.source_type === 'subscription').forEach((e) => {
      const day = e.created_at.slice(0, 10);
      const cur = subDays.get(day) || { total: 0, count: 0 };
      cur.total += Number(e.amount || 0);
      cur.count += 1;
      subDays.set(day, cur);
    });
    subDays.forEach((v, day) => {
      out.push({ key: 'sub-' + day, kind: 'subscription', title: 'Fan Club', sub: dayLabel(day) + ' \u00b7 ' + v.count + (v.count === 1 ? ' member' : ' members'), amount: v.total, day });
    });
    // Cash-outs (debits)
    payouts.forEach((p) => {
      const dest = p.destination ? String(p.destination) : '';
      const bank = dest.replace(/["{}]/g, '').split(':')[0] || 'bank';
      out.push({
        key: 'payout-' + p.id,
        kind: 'payout',
        title: 'Cash-out to ' + bank.charAt(0).toUpperCase() + bank.slice(1),
        sub: dayLabel(p.created_at) + ' \u00b7 ' + (p.status === 'completed' || p.status === 'paid' ? 'Paid' : 'Processing'),
        amount: -Number(p.amount || 0),
        day: p.created_at.slice(0, 10),
      });
    });
    return out.sort((a, b) => (a.day < b.day ? 1 : -1)).filter((r) => sameMonth(r.day + 'T00:00:00Z') || r.kind === 'payout');
  }, [earnings, payouts]);

  const visible = rows.filter((r) => {
    if (filter === 'All') return true;
    if (filter === 'Gifts') return r.kind === 'gift';
    if (filter === 'Fan Club') return r.kind === 'subscription';
    if (filter === 'Cash-outs') return r.kind === 'payout';
    return false;
  });

  async function exportStatement() {
    impact('medium');
    const lines = rows.map((r) => r.day + '  ' + r.title + '  ' + (r.amount >= 0 ? '+' : '-') + '\u20A6' + fmt(Math.abs(r.amount)) + '  (' + r.sub + ')');
    try {
      await Share.share({ message: 'Rally statement\n' + lines.join('\n') });
    } catch { /* dismissed */ }
  }

  const iconFor = (kind: Row['kind']) =>
    kind === 'gift' ? 'gift-outline' : kind === 'subscription' ? 'ticket-outline' : 'business-outline';

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Statement</Text>
          <Pressable onPress={exportStatement} hitSlop={10} accessibilityLabel="Export statement">
            <Text style={{ color: GOLD, fontWeight: '900', fontSize: 16 }}>Export</Text>
          </Pressable>
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

        <Text style={[styles.section, { color: colors.muted }]}>THIS MONTH</Text>

        {loading ? (
          <Text style={{ color: colors.muted, fontSize: 14 }}>Loading\u2026</Text>
        ) : filter === 'Orders' ? (
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>
            Store order earnings will appear here once sale payouts land in the earnings feed.
          </Text>
        ) : visible.length === 0 ? (
          <Text style={{ color: colors.muted, fontSize: 14 }}>Nothing here yet this month.</Text>
        ) : (
          <View>
            {visible.map((r, i) => (
              <View key={r.key} style={[styles.row, i < visible.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <View style={[styles.rowIcon, { backgroundColor: colors.surfaceElevated }]}>
                  <Ionicons name={iconFor(r.kind) as any} size={18} color={r.kind === 'payout' ? colors.text : GOLD} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16 }}>{r.title}</Text>
                  <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>{r.sub}</Text>
                </View>
                <Text style={{ color: r.amount >= 0 ? TEAL : colors.text, fontWeight: '900', fontSize: 16 }}>
                  {(r.amount >= 0 ? '+' : '-') + '\u20A6' + fmt(Math.abs(r.amount))}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Fee note */}
        <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Ionicons name="shield-checkmark-outline" size={16} color={TEAL} />
          <Text style={[styles.noteText, { color: colors.textSecondary }]}>
            Amounts are after the 30% platform fee. Tokens fans spend never appear here.
          </Text>
        </View>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { borderWidth: 1.5, borderRadius: radii.full, paddingHorizontal: 18, paddingVertical: 10 },
  section: { fontSize: 13, fontWeight: '900', letterSpacing: 0.8, marginTop: spacing.lg, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  rowIcon: { width: 44, height: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 14,
    marginTop: spacing.lg,
  },
  noteText: { flex: 1, fontSize: 14, lineHeight: 20 },
});
