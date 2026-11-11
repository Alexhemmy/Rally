/** Face-Off (mock 32) - one question, two sides, one vote each.
 * Real votes via POST /api/rivalries/faceoffs/:id/vote {side}; the
 * face-off and counts come from GET /api/rivalries. Honest deviations:
 * the backend does not count Gifts per side or expose a gifts total, so
 * only votes are shown, and gifting happens on the Favorite's page.
 * Under-18s cannot vote (server rule, mirrored in the note).
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const TEAL = '#34D399';

type FaceOff = { id: string; question: string; favoriteAId: string; favoriteBId: string; votesA: number; votesB: number; closesAt: string };
type Rivalry = { id: string; favoriteA: { id: string; name: string | null }; favoriteB: { id: string; name: string | null }; heatLevel: number; faceOffs: FaceOff[] };

function countdown(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'Ended';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return pad(h) + ':' + pad(m) + ':' + pad(s);
}

export default function FaceOffScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { impact } = useHaptics();
  const { success } = useSounds();

  const [fo, setFo] = useState<FaceOff | null>(null);
  const [rivalry, setRivalry] = useState<Rivalry | null>(null);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState<'A' | 'B' | null>(null);
  const [voting, setVoting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api<{ rivalries: Rivalry[] }>('/api/rivalries', { skipAuth: true });
      for (const r of res.rivalries || []) {
        const f = (r.faceOffs || []).find((x) => x.id === id);
        if (f) { setFo(f); setRivalry(r); break; }
      }
    } catch { /* offline */ }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // live countdown
  const [, forceTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  async function vote(side: 'A' | 'B') {
    if (!fo || voting || voted) return;
    if (!getToken()) { router.push('/login'); return; }
    setVoting(true);
    impact('medium');
    try {
      const r = await api<{ faceOff: { votesA: number; votesB: number } }>(
        '/api/rivalries/faceoffs/' + fo.id + '/vote',
        { method: 'POST', body: JSON.stringify({ side }) }
      );
      setFo({ ...fo, votesA: r.faceOff.votesA, votesB: r.faceOff.votesB });
      setVoted(side);
      AsyncStorage.getItem('rally.faceOffVotes')
        .then((v) => AsyncStorage.setItem('rally.faceOffVotes', String(Number(v || '0') + 1)))
        .catch(() => undefined);
      success();
      impact('success');
    } catch (e: any) {
      const msg = e.message || 'Could not vote';
      if (msg.indexOf('already voted') > -1) setVoted(side);
      else Alert.alert('Face-Off', msg);
    } finally {
      setVoting(false);
    }
  }

  const nameA = rivalry ? rivalry.favoriteA.name || 'Side A' : 'Side A';
  const nameB = rivalry ? rivalry.favoriteB.name || 'Side B' : 'Side B';
  const total = fo ? fo.votesA + fo.votesB : 0;
  const pctA = total ? Math.round((fo!.votesA / total) * 100) : 50;
  const pctB = 100 - pctA;

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={[styles.h1, { color: colors.text }]}>Face-Off</Text>
        <View style={{ width: 26 }} />
      </View>

      {loading ? <ActivityIndicator color={GOLD} style={{ marginTop: 30 }} /> : null}

      {!loading && !fo ? (
        <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>
          This Face-Off has closed. Results stay on the Rivalry Hub.
        </Text>
      ) : null}

      {fo && rivalry ? (
        <>
          {/* Meta chips */}
          <View style={styles.chipRow}>
            <View style={[styles.chip, { borderColor: GOLD }]}>
              <Text style={{ color: GOLD, fontWeight: '800', fontSize: 14 }}>Rivalry</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: colors.surfaceElevated, borderColor: 'transparent' }]}>
              <Ionicons name="time-outline" size={14} color={colors.text} />
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14, marginLeft: 6 }}>
                {'Ends in ' + countdown(fo.closesAt)}
              </Text>
            </View>
            <View style={[styles.heatChip, { backgroundColor: TEAL + '22' }]}>
              <Text style={{ color: TEAL, fontWeight: '900', fontSize: 12 }}>{'HEAT ' + rivalry.heatLevel}</Text>
            </View>
          </View>

          <Text style={{ color: colors.text, fontWeight: '900', fontSize: 30, lineHeight: 38, marginTop: spacing.md }}>
            {fo.question}
          </Text>

          {/* Side A */}
          <Pressable
            onPress={() => vote('A')}
            disabled={voting || !!voted}
            accessibilityLabel={'Vote ' + nameA}
          >
            <LinearGradient
              colors={['#A855F7', '#EC4899'] as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.sideCard, voted === 'A' && { borderWidth: 2, borderColor: GOLD }]}
            >
              <View style={styles.record}>
                <Ionicons name="radio-button-on-outline" size={30} color="#fff" />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                {voted === 'A' ? <Text style={styles.yourVote}>YOUR VOTE</Text> : null}
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 20 }}>{nameA}</Text>
              </View>
              <Text style={styles.pct}>{pctA + '%'}</Text>
            </LinearGradient>
          </Pressable>

          {/* Side B */}
          <Pressable
            onPress={() => vote('B')}
            disabled={voting || !!voted}
            accessibilityLabel={'Vote ' + nameB}
          >
            <LinearGradient
              colors={['#1D4ED8', '#2DD4BF'] as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.sideCard, voted === 'B' && { borderWidth: 2, borderColor: GOLD }]}
            >
              <View style={styles.record}>
                <Ionicons name="radio-button-on-outline" size={30} color="#fff" />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                {voted === 'B' ? <Text style={styles.yourVote}>YOUR VOTE</Text> : null}
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 20 }}>{nameB}</Text>
              </View>
              <Text style={styles.pct}>{pctB + '%'}</Text>
            </LinearGradient>
          </Pressable>

          {/* Split bar + counts */}
          <View style={styles.splitBar}>
            <View style={{ width: pctA + '%', backgroundColor: '#EC4899', height: '100%' }} />
            <View style={{ width: pctB + '%', backgroundColor: TEAL, height: '100%' }} />
          </View>
          <View style={styles.countRow}>
            <Text style={{ color: colors.muted, fontSize: 15 }}>{total.toLocaleString('en-US') + ' votes'}</Text>
            <Text style={{ color: colors.muted, fontSize: 15 }}>Gifts on the Favorite pages</Text>
          </View>

          {countdown(fo.closesAt) === 'Ended' ? (
            <Pressable
              onPress={() => router.push({ pathname: '/rivalries/faceoff-result', params: { faceOffId: fo.id, votesA: String(fo.votesA), votesB: String(fo.votesB), nameA, nameB, question: fo.question, votedSide: voted || '', rivalryId: rivalry.id } })}
              style={styles.resultBtn}
              accessibilityLabel="See result"
            >
              <Text style={{ color: '#111', fontWeight: '900', fontSize: 15 }}>See result</Text>
            </Pressable>
          ) : null}

          {/* Conduct note */}
          <View style={[styles.note, { backgroundColor: GOLD + '0F', borderColor: GOLD + '44' }]}>
            <Ionicons name="shield-checkmark-outline" size={16} color={GOLD} />
            <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 21, flex: 1 }}>
              Gifts are welcome on your pick. Gifts and messages cannot be used to attack or mock anyone.
            </Text>
          </View>

          {/* Bottom actions */}
          <View style={styles.bottomBar}>
            <Pressable
              onPress={() => {
                impact('light');
                Alert.alert(
                  'Conduct reminder',
                  'Keep it about the music. No threats, slurs, doxxing or pile-ons - Call-Outs follow the same rules as any public post.'
                );
              }}
              style={[styles.quietBtn, { backgroundColor: colors.surfaceElevated }]}
              accessibilityLabel="Conduct reminder"
            >
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 15 }}>Conduct reminder</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                impact('light');
                Alert.alert(
                  'Gift ' + nameA,
                  'Open ' + nameA + "'s page and tap Send a Gift - gifts show support without changing this vote."
                );
              }}
              style={styles.goldBtn}
              accessibilityLabel={'Gift ' + nameA}
            >
              <Ionicons name="gift-outline" size={18} color="#111" />
              <Text style={{ color: '#111', fontWeight: '900', fontSize: 15, marginLeft: 8 }}>{'Gift ' + nameA.split(' ')[0]}</Text>
            </Pressable>
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 20, fontWeight: '900', flex: 1, textAlign: 'center' },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: radii.full, paddingHorizontal: 16, paddingVertical: 9 },
  heatChip: { borderRadius: radii.full, paddingHorizontal: 12, paddingVertical: 7 },
  sideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.xl,
    padding: 18,
    marginTop: 16,
  },
  record: { width: 64, height: 64, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center' },
  yourVote: { color: 'rgba(255,255,255,0.85)', fontWeight: '900', fontSize: 12, letterSpacing: 1, marginBottom: 2 },
  pct: { color: '#fff', fontWeight: '900', fontSize: 34 },
  splitBar: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', marginTop: 18 },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 14,
    marginTop: spacing.md,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  quietBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: radii.full },
  goldBtn: { flex: 1, backgroundColor: GOLD, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: radii.full },
  resultBtn: { backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: radii.full, marginTop: 14 },
});
