/** Giveaway results (mock 23) - winner card + provably-fair receipt.
 * Real data: GET /api/giveaways/:id (seedHash, publicRandom, seedRevealed,
 * status) + GET /:id/results (winners, own.isWinner). Honest deviations:
 * there is no entrant-list fingerprint in the API, so that row is omitted
 * with a note, and the draw is triggered here if it has not run yet.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const TEAL = '#34D399';

type Giv = { id: string; poolAmount: number; winnerCount: number; currency: string; seedHash: string | null; seedRevealed: string | null; publicRandom: string | null; status: string };
type Res = { winners: { rank: number; displayName: string; handle: string }[]; own: { isWinner: boolean; rank: number | null; scoreBand: string | null } };

function short(v: string | null): string {
  if (!v) return '';
  const s = String(v).replace(/\s+/g, '');
  if (s.length <= 12) return s;
  return s.slice(0, 4) + '  ' + s.slice(4, 8) + '  \u2026' + s.slice(-4);
}

export default function GiveawayResultsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { impact } = useHaptics();

  const [giv, setGiv] = useState<Giv | null>(null);
  const [res, setRes] = useState<Res | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const id = params.id;
    if (!id || !getToken()) { setLoading(false); return; }
    try {
      const g = await api<Giv>('/api/giveaways/' + id);
      setGiv(g);
      let r: Res | null = null;
      try { r = await api<Res>('/api/giveaways/' + id + '/results'); } catch { /* not drawn yet */ }
      setRes(r);
    } catch (e: any) {
      setErr(e.message || 'Could not load results');
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  async function drawNow() {
    if (!giv) return;
    impact('medium');
    try {
      await api('/api/giveaways/' + giv.id + '/draw', { method: 'POST' });
      await load();
    } catch { /* keep what we have */ }
  }

  if (loading) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={GOLD} />
        </View>
      </Screen>
    );
  }

  const isWinner = !!res && res.own.isWinner;

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Results</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {err ? <Text style={{ color: colors.danger, fontSize: 14 }}>{err}</Text> : null}

          {isWinner && giv ? (
            <LinearGradient colors={['#10B981', '#34D399']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.winCard}>
              <Ionicons name="sparkles-outline" size={22} color={GOLD} />
              <Text style={styles.winKicker}>YOU WERE PICKED</Text>
              <Text style={styles.winAmount}>{'\u20A6' + Math.round(giv.poolAmount / Math.max(1, giv.winnerCount)).toLocaleString('en-US')}</Text>
              <Text style={styles.winSub}>
                {'One of ' + giv.winnerCount + ' winners \u00b7 \u20A6' + giv.poolAmount.toLocaleString('en-US') + ' giveaway'}
              </Text>
            </LinearGradient>
          ) : giv ? (
            <View style={[styles.loseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 18 }}>Not picked this time</Text>
              <Text style={{ color: colors.muted, fontSize: 14, marginTop: 6, lineHeight: 20 }}>
                {'\u20A6' + giv.poolAmount.toLocaleString('en-US') + ' across ' + giv.winnerCount + ' winners. Entry is always free, and the next giveaway is one tap away.'}
              </Text>
            </View>
          ) : (
            <Text style={{ color: colors.muted, fontSize: 14 }}>Open a giveaway to see its results.</Text>
          )}

          {isWinner ? (
            <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Ionicons name="business-outline" size={16} color={GOLD} />
              <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                Confirm your verified payout account to receive the prize. It must be in your own name.
              </Text>
            </View>
          ) : null}

          {/* Provably fair receipt */}
          {giv ? (
            <>
              <Text style={[styles.section, { color: colors.muted }]}>CHECK THE DRAW YOURSELF</Text>
              <View style={[styles.receipt, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.receiptRow, { borderBottomColor: colors.border }]}>
                  <Ionicons name="lock-closed-outline" size={18} color={TEAL} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>Seed hash, published before entries opened</Text>
                    {giv.seedHash ? (
                      <View style={[styles.hashPill, { backgroundColor: colors.surfaceElevated }]}>
                        <Text style={{ color: colors.text, fontFamily: 'monospace', fontSize: 14 }}>{short(giv.seedHash)}</Text>
                      </View>
                    ) : (
                      <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>Publishing\u2026</Text>
                    )}
                  </View>
                </View>

                <View style={[styles.receiptRow, { borderBottomColor: colors.border }]}>
                  <Ionicons name="globe-outline" size={18} color={TEAL} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>Public random value</Text>
                    {giv.publicRandom ? (
                      <>
                        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>Round {giv.publicRandom.slice(0, 9)}</Text>
                        <View style={[styles.hashPill, { backgroundColor: colors.surfaceElevated }]}>
                          <Text style={{ color: colors.text, fontFamily: 'monospace', fontSize: 14 }}>{short(giv.publicRandom)}</Text>
                        </View>
                      </>
                    ) : (
                      <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>Announced with the draw</Text>
                    )}
                  </View>
                </View>

                <View style={[styles.receiptRow, { borderBottomColor: colors.border }]}>
                  <Ionicons name="key-outline" size={18} color={TEAL} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>Seed revealed after the draw</Text>
                    {giv.seedRevealed ? (
                      <View style={[styles.hashPill, { backgroundColor: colors.surfaceElevated }]}>
                        <Text style={{ color: colors.text, fontFamily: 'monospace', fontSize: 14 }}>{short(giv.seedRevealed)}</Text>
                      </View>
                    ) : (
                      <Pressable onPress={drawNow} style={[styles.drawBtn, { borderColor: colors.border }]} accessibilityLabel="Run the draw">
                        <Text style={{ color: GOLD, fontWeight: '800', fontSize: 14 }}>Run the draw</Text>
                      </Pressable>
                    )}
                  </View>
                </View>

                <View style={styles.receiptRow}>
                  <Ionicons name="people-outline" size={18} color={TEAL} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>Entrant list</Text>
                    <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
                      A public fingerprint of everyone who entered is on the roadmap.
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Ionicons name="shield-checkmark-outline" size={16} color={TEAL} />
                <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                  Scores were taken at a time Rally chose in the last 48 hours. Tokens and Gifts were never counted.
                </Text>
              </View>
            </>
          ) : null}
        </ScrollView>

        <Pressable onPress={() => { impact('light'); router.push('/payout-account'); }} accessibilityLabel="Confirm payout account">
          <View style={styles.confirmBtn}>
            <Text style={{ color: '#111', fontWeight: '900', fontSize: 18 }}>Confirm payout account</Text>
          </View>
        </Pressable>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  winCard: { borderRadius: radii.xl, padding: 20, minHeight: 190, justifyContent: 'flex-end' },
  winKicker: { color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 1, marginTop: 8 },
  winAmount: { color: '#fff', fontWeight: '900', fontSize: 44, marginTop: 4 },
  winSub: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 6 },
  loseCard: { borderWidth: 1, borderRadius: radii.xl, padding: 18 },
  section: { fontWeight: '900', fontSize: 13, letterSpacing: 1, marginTop: spacing.md, marginBottom: 8 },
  receipt: { borderWidth: 1, borderRadius: radii.lg },
  receiptRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, borderBottomWidth: 1 },
  hashPill: { alignSelf: 'flex-start', borderRadius: radii.sm, paddingHorizontal: 10, paddingVertical: 6, marginTop: 6 },
  drawBtn: { borderWidth: 1, borderRadius: radii.full, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start', marginTop: 6 },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 14,
    marginTop: 12,
  },
  noteText: { flex: 1, fontSize: 14, lineHeight: 20 },
  confirmBtn: { backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: radii.full },
});
