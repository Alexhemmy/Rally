/** Your Rally Score (mock 27) - score ring, factors, privacy toggles.
 * Real data: GET /api/rankings, your entry matched by handle, gives the
 * score and cohort. Honest deviations: the backend computes one score
 * from unique supporters (log scale), soft-capped gifts, published
 * Moments and recency - there are no per-component numbers yet, so the
 * breakdown shows the real factors with plain-language weights instead
 * of the mock's U/G/R/E/P rows. Hide-my-rank and opt-out have no
 * backend field yet, so they persist on-device with a note.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#FFA726';
const TEAL = '#34D399';

type Entry = { handle: string; displayName: string; score: number; cohort: string; supporterCount: number };

const FACTORS = [
  { key: 'U', color: '#8B5CF6', title: 'Unique verified supporters', body: 'The heart of the score. Ten real fans beat one big spender.' },
  { key: 'G', color: '#059669', title: 'Support, soft-capped', body: 'Gift points count, but with a cap so money never dominates.' },
  { key: 'C', color: '#3B82F6', title: 'Published Moments', body: 'Showing up for your community adds a small, steady bonus.' },
  { key: 'R', color: '#EC4899', title: 'Recency', body: 'New and active Favorites get a rising boost in their first months.' },
];

export default function RallyScoreScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();

  const [entry, setEntry] = useState<Entry | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [hideRank, setHideRank] = useState(false);
  const [optOut, setOptOut] = useState(false);

  const load = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    try {
      const handleRaw = await AsyncStorage.getItem('rally.myHandle');
      const handle = handleRaw ? JSON.parse(handleRaw) : null;
      const r = await api<{ rankings: Entry[] }>('/api/rankings');
      const list = r.rankings || [];
      const mine = handle ? list.findIndex((x) => x.handle === handle) : -1;
      if (mine >= 0) {
        setEntry(list[mine]);
        setRank(mine + 1);
      } else if (list.length > 0) {
        setEntry(null);
      }
    } catch { /* offline */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('rally.scorePrefs');
        if (raw) {
          const p = JSON.parse(raw);
          setHideRank(!!p.hideRank);
          setOptOut(!!p.optOut);
        }
      } catch { /* fresh */ }
    })();
    load();
  }, [load]);

  function persist(hide: boolean, opt: boolean) {
    AsyncStorage.setItem('rally.scorePrefs', JSON.stringify({ hideRank: hide, optOut: opt })).catch(() => {});
  }

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Your Rally Score</Text>
          <View style={{ width: 26 }} />
        </View>

        {loading ? <ActivityIndicator color={GOLD} style={{ marginTop: 24 }} /> : null}

        {!loading && entry ? (
          <>
            {/* Score card */}
            <View style={[styles.scoreCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.ring, { borderColor: GOLD }]}>
                <Text style={{ color: colors.text, fontWeight: '900', fontSize: 40 }}>{entry.score}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 18 }}>
                <Text style={{ color: colors.text, fontWeight: '900', fontSize: 20 }}>
                  {entry.cohort.charAt(0).toUpperCase() + entry.cohort.slice(1)}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 15, marginTop: 4, lineHeight: 21 }}>
                  {rank ? 'Rank #' + rank + ' overall. ' : ''}Recalculated as support arrives.
                </Text>
              </View>
            </View>

            {/* Factors */}
            <Text style={[styles.section, { color: colors.muted }]}>WHAT MAKES UP YOUR SCORE</Text>
            {FACTORS.map((f) => (
              <View key={f.key} style={styles.factorRow}>
                <View style={[styles.factorIcon, { backgroundColor: f.color + '33' }]}>
                  <Text style={{ color: f.color, fontWeight: '900', fontSize: 15 }}>{f.key}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>{f.title}</Text>
                  <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2, lineHeight: 18 }}>{f.body}</Text>
                </View>
              </View>
            ))}

            <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Ionicons name="shield-checkmark-outline" size={16} color={TEAL} />
              <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                Money is not a direct term. One fan can only add so much, and new or linked accounts count for less.
              </Text>
            </View>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 8, lineHeight: 18 }}>
              Per-component numbers like the weekly breakdown arrive with the scoring v2 update.
            </Text>
          </>
        ) : null}

        {!loading && !entry ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="trophy-outline" size={24} color={GOLD} />
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16, marginTop: 10 }}>No score yet</Text>
            <Text style={{ color: colors.muted, fontSize: 14, marginTop: 6, lineHeight: 20, textAlign: 'center' }}>
              Publish your Favorite page and gather a few verified supporters - your score appears here automatically.
            </Text>
          </View>
        ) : null}

        {/* Privacy toggles */}
        <View style={[styles.prefCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.prefRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.prefIcon, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons name="eye-outline" size={18} color={GOLD} />
            </View>
            <Text style={[styles.prefLabel, { color: colors.text }]}>Hide my rank</Text>
            <Switch
              value={hideRank}
              onValueChange={(v) => { impact('light'); setHideRank(v); persist(v, optOut); }}
              trackColor={{ true: GOLD, false: colors.border }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.prefRow}>
            <View style={[styles.prefIcon, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons name="ban-outline" size={18} color={GOLD} />
            </View>
            <Text style={[styles.prefLabel, { color: colors.text }]}>Opt out of public ranking</Text>
            <Switch
              value={optOut}
              onValueChange={(v) => { impact('light'); setOptOut(v); persist(hideRank, v); }}
              trackColor={{ true: GOLD, false: colors.border }}
              thumbColor="#fff"
            />
          </View>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 10, lineHeight: 18 }}>
            Saved on this phone for now - they apply to the public rankings once the preferences backend ships.
          </Text>
        </View>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  scoreCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radii.xl, padding: 20 },
  ring: { width: 108, height: 108, borderRadius: 54, borderWidth: 8, alignItems: 'center', justifyContent: 'center' },
  section: { fontWeight: '900', fontSize: 13, letterSpacing: 1, marginTop: spacing.md, marginBottom: 8 },
  factorRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10 },
  factorIcon: { width: 44, height: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
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
  emptyCard: { borderWidth: 1, borderRadius: radii.lg, padding: 20, alignItems: 'center', marginTop: spacing.sm },
  prefCard: { borderWidth: 1, borderRadius: radii.lg, padding: 16, marginTop: spacing.md },
  prefRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  prefIcon: { width: 44, height: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  prefLabel: { flex: 1, fontSize: 17, fontWeight: '800' },
});
