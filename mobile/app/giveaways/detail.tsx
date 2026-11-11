/** Giveaway detail (mock 24) - fan-side entry screen.
 * Real giveaway from GET /api/giveaways/:id and real entry via
 * POST /api/giveaways/:id/enter. Entry is always free and the draw is
 * weighted by activeness, dedication and passion - never by spend.
 * Honest deviations: the backend stores weights without percentages and
 * does not expose an eligibility checklist, so the bars show relative
 * weights and the checklist states the real server-side rules
 * (account 14+ days old, following 7+ days, 18+ to enter).
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const TEAL = '#34D399';

type Giveaway = {
  id: string;
  favoriteId: string;
  poolAmount: number;
  currency: string;
  winnerCount: number;
  entryClosesAt: string;
  status: string;
  seedHash: string | null;
  entryCount: number;
  weights?: { activeness?: number; dedication?: number; passion?: number } | null;
};

function naira(amount: number, currency: string): string {
  const sym = currency === 'NGN' ? '\u20A6' : currency === 'USD' ? '$' : currency + ' ';
  return sym + Math.round(amount).toLocaleString('en-US');
}

function countdown(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'Closed';
  const h = Math.floor(ms / 3600000);
  const d = Math.floor(h / 24);
  if (d > 0) return d + 'd ' + (h % 24) + 'h';
  return h + 'h ' + Math.floor((ms % 3600000) / 60000) + 'm';
}

const CRITERIA = [
  { label: 'Activeness', hint: 'Reactions, comments, live sessions.', color: TEAL, key: 'activeness' },
  { label: 'Dedication', hint: 'Weeks active and moments attended.', color: '#7B61FF', key: 'dedication' },
  { label: 'Passion', hint: 'Translations, welcomes, helpful replies.', color: '#F0663F', key: 'passion' },
];

export default function GiveawayDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { impact } = useHaptics();
  const { success } = useSounds();

  const [g, setG] = useState<Giveaway | null>(null);
  const [loading, setLoading] = useState(true);
  const [entering, setEntering] = useState(false);
  const [entered, setEntered] = useState(false);

  const load = useCallback(async () => {
    if (!id) { setLoading(false); return; }
    try {
      const r = await api<{ giveaway: Giveaway }>('/api/giveaways/' + id, { skipAuth: true });
      setG(r.giveaway || null);
    } catch { /* offline */ }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function enter() {
    if (!g || entering) return;
    if (!getToken()) { router.push('/login'); return; }
    setEntering(true);
    impact('medium');
    try {
      await api('/api/giveaways/' + g.id + '/enter', { method: 'POST' });
      success();
      impact('success');
      setEntered(true);
    } catch (e: any) {
      Alert.alert('Enter giveaway', e.message || 'Could not enter right now');
    } finally {
      setEntering(false);
    }
  }

  const weights = g && g.weights ? g.weights : null;
  const wMax = weights ? Math.max(weights.activeness || 0, weights.dedication || 0, weights.passion || 0, 0.01) : 1;
  const open = !!g && ['funded', 'announced'].includes(g.status);

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <View style={{ width: 26 }} />
      </View>

      {loading ? <ActivityIndicator color={GOLD} style={{ marginTop: 30 }} /> : null}

      {!loading && !g ? (
        <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>Giveaway not found.</Text>
      ) : null}

      {g ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          {/* Hero */}
          <LinearGradient
            colors={['#8E3B6B', GOLD] as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18, letterSpacing: 1 }}>
              CASH GIVEAWAY
            </Text>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 30, marginTop: 6 }}>
              {naira(g.poolAmount, g.currency) + ' \u00b7 ' + g.winnerCount + ' winners'}
            </Text>
          </LinearGradient>

          {/* Stat chips */}
          <View style={styles.statRow}>
            <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 }}>{countdown(g.entryClosesAt)}</Text>
              <Text style={{ color: colors.muted, fontSize: 13 }}>Closes in</Text>
            </View>
            <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ color: TEAL, fontWeight: '900', fontSize: 17 }}>
                {g.status === 'draft' ? 'Pending' : 'Funded'}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 13 }}>In escrow</Text>
            </View>
            <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 }}>
                {g.entryCount.toLocaleString('en-US')}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 13 }}>Entered</Text>
            </View>
          </View>

          {/* How winners are picked */}
          <Text style={[styles.section, { color: colors.muted }]}>HOW WINNERS ARE PICKED</Text>
          {CRITERIA.map((c) => {
            const w = weights ? weights[c.key as 'activeness'] || 0 : 0;
            const pct = weights ? Math.round((w / wMax) * 100) : 50;
            return (
              <View key={c.key} style={{ marginBottom: 16 }}>
                <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 }}>{c.label}</Text>
                <Text style={{ color: colors.muted, fontSize: 14, marginTop: 2 }}>{c.hint}</Text>
                <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
                  <View style={[styles.barFill, { width: pct + '%', backgroundColor: c.color }]} />
                </View>
              </View>
            );
          })}

          {/* Money never counts */}
          <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Ionicons name="shield-checkmark-outline" size={16} color={TEAL} />
            <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20, flex: 1 }}>
              Money never counts. Tokens, Gifts and subscriptions are not part of the draw. Entry is always free.
            </Text>
          </View>

          {/* Eligibility (real server rules) */}
          <Text style={[styles.section, { color: colors.muted }]}>YOU CAN ENTER IF</Text>
          {[
            'Your account is at least 14 days old',
            'You have followed this Favorite for 7+ days',
            'You are 18 or over',
          ].map((line) => (
            <View key={line} style={styles.checkRow}>
              <Ionicons name="checkmark-circle" size={20} color={TEAL} />
              <Text style={{ color: colors.text, fontSize: 16, marginLeft: 12, flex: 1 }}>{line}</Text>
            </View>
          ))}
        </ScrollView>
      ) : null}

      {/* Enter bar */}
      {g ? (
        <View style={styles.enterWrap}>
          <Pressable onPress={enter} disabled={entering || !open || entered} accessibilityLabel="Enter giveaway">
            <LinearGradient
              colors={[GOLD, GOLD_DEEP] as [string, string]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.enterBtn, (!open || entered) && { opacity: 0.5 }]}
            >
              {entering ? (
                <ActivityIndicator color="#111" />
              ) : (
                <Text style={{ color: '#111', fontWeight: '900', fontSize: 18 }}>
                  {entered ? 'You are in \u2713' : !open ? 'Entries closed' : 'Enter giveaway \u00b7 Free'}
                </Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  hero: { borderRadius: radii.xl, padding: 20, marginBottom: spacing.md },
  statRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.md },
  stat: { flex: 1, borderWidth: 1, borderRadius: radii.lg, padding: 14 },
  section: { fontSize: 13, fontWeight: '900', letterSpacing: 1, marginTop: spacing.md, marginBottom: 10 },
  barTrack: { height: 5, borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  barFill: { height: 5, borderRadius: 3 },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 14,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  enterWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  enterBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: radii.full },
});
