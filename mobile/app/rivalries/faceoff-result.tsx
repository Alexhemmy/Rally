/** Face-Off Result (mock 10)
 * Winner, percentages, votes and your vote. The numbers come from the
 * live Face-Off screen at the moment it ended (the backend has no
 * closed-face-off lookup yet), with a live API fallback for open
 * face-offs. Share result uses the system share sheet; Rematch opens
 * the real face-off creator. Both Favorites earn a badge server-side.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api } from '@/lib/api';

const GOLD = '#FFA726';

type FaceOffLookup = {
  id: string;
  favoriteA: { name: string | null };
  favoriteB: { name: string | null };
  faceOffs: { id: string; votesA: number; votesB: number }[];
};

function initials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function FaceOffResultScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();
  const router = useRouter();
  const p = useLocalSearchParams<{ faceOffId?: string; votesA?: string; votesB?: string; nameA?: string; nameB?: string; question?: string; votedSide?: string; rivalryId?: string }>();

  const [live, setLive] = useState<{ votesA: number; votesB: number } | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!p.faceOffId) return;
    try {
      const res = await api<{ rivalries: FaceOffLookup[] }>('/api/rivalries', { skipAuth: true });
      for (const r of res.rivalries || []) {
        const f = (r.faceOffs || []).find((x) => x.id === p.faceOffId);
        if (f) { setLive({ votesA: f.votesA, votesB: f.votesB }); return; }
      }
      if (!p.votesA) setNotFound(true);
    } catch {
      if (!p.votesA) setNotFound(true);
    }
  }, [p.faceOffId, p.votesA]);

  useEffect(() => { load(); }, [load]);

  const nameA = p.nameA || 'Side A';
  const nameB = p.nameB || 'Side B';
  const votesA = live ? live.votesA : Number(p.votesA || 0);
  const votesB = live ? live.votesB : Number(p.votesB || 0);
  const total = votesA + votesB;
  const pctA = total ? Math.round((votesA / total) * 100) : 50;
  const pctB = 100 - pctA;
  const aWins = votesA >= votesB;

  async function share() {
    impact('light');
    try {
      await Share.share({
        message: nameA + ' ' + pctA + '% vs ' + nameB + ' ' + pctB + '%' + (p.question ? ' - ' + p.question : '') + ' \u00b7 Face-Off on Rally. Votes were free and one per fan.',
      });
    } catch { /* dismissed */ }
  }

  if (notFound) {
    return (
      <SwipeBack>
        <Screen>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
              <Ionicons name="chevron-back" size={26} color={colors.text} />
            </Pressable>
            <Text style={[styles.h1, { color: colors.text }]}>Result</Text>
            <View style={{ width: 26 }} />
          </View>
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>
            This Face-Off has closed and the backend does not keep a public result page yet. Final numbers stay on the Rivalry Hub.
          </Text>
        </Screen>
      </SwipeBack>
    );
  }

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Result</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* VS with winner ring */}
        <View style={styles.vsRow}>
          <View style={styles.side}>
            <View style={[styles.ring, { borderColor: aWins ? GOLD : 'transparent' }]}>
              <LinearGradient colors={['#F59E0B', '#F0663F'] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 26 }}>{initials(nameA)}</Text>
              </LinearGradient>
            </View>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15, marginTop: 10 }} numberOfLines={1}>{nameA}</Text>
            {aWins ? (
              <View style={[styles.winnerPill, { backgroundColor: GOLD + '22' }]}>
                <Text style={{ color: GOLD, fontWeight: '900', fontSize: 12, letterSpacing: 1 }}>WINNER</Text>
              </View>
            ) : null}
          </View>
          <Text style={{ color: GOLD, fontWeight: '900', fontSize: 22 }}>VS</Text>
          <View style={styles.side}>
            <View style={[styles.ring, { borderColor: !aWins ? GOLD : 'transparent' }]}>
              <LinearGradient colors={['#4F46E5', '#818CF8'] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 26 }}>{initials(nameB)}</Text>
              </LinearGradient>
            </View>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15, marginTop: 10 }} numberOfLines={1}>{nameB}</Text>
            {!aWins ? (
              <View style={[styles.winnerPill, { backgroundColor: GOLD + '22' }]}>
                <Text style={{ color: GOLD, fontWeight: '900', fontSize: 12, letterSpacing: 1 }}>WINNER</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Percentages + split bar */}
        <View style={styles.pctRow}>
          <Text style={[styles.pct, { color: aWins ? GOLD : colors.muted }]}>{pctA + '%'}</Text>
          <Text style={[styles.pct, { color: !aWins ? GOLD : colors.muted }]}>{pctB + '%'}</Text>
        </View>
        <View style={styles.bar}>
          <View style={{ width: pctA + '%', backgroundColor: GOLD, height: '100%' }} />
          <View style={{ flex: 1, backgroundColor: colors.border, height: '100%' }} />
        </View>
        <Text style={{ color: colors.muted, fontSize: 15, marginTop: 10 }}>
          {total.toLocaleString('en-US') + ' votes' + (live ? ' \u00b7 voting is still open' : '')}
        </Text>

        {/* Breakdown */}
        <View style={[styles.breakdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.breakRow}>
            <Text style={{ color: colors.muted, fontSize: 15, flex: 1 }}>{nameA + "'s fandom"}</Text>
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 15 }}>{votesA.toLocaleString('en-US') + ' votes'}</Text>
          </View>
          <View style={[styles.breakRow, { borderBottomWidth: 0 }]}>
            <Text style={{ color: colors.muted, fontSize: 15, flex: 1 }}>{nameB + "'s fandom"}</Text>
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 15 }}>{votesB.toLocaleString('en-US') + ' votes'}</Text>
          </View>
          {p.votedSide ? (
            <View style={[styles.breakRow, { borderTopWidth: 1, borderTopColor: colors.border, borderBottomWidth: 0 }]}>
              <Text style={{ color: colors.muted, fontSize: 15, flex: 1 }}>Your vote</Text>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 15 }}>{p.votedSide === 'A' ? nameA : nameB}</Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.note, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="trophy-outline" size={18} color={GOLD} />
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20, flex: 1, marginLeft: 10 }}>
            Both Favorites earn a Rivalry badge. Votes were free and one per fan.
          </Text>
        </View>

        <View style={{ marginTop: 'auto', marginBottom: spacing.lg }}>
          <Pressable onPress={share} style={styles.shareBtn} accessibilityLabel="Share result">
            <Text style={{ color: '#111', fontWeight: '900', fontSize: 18 }}>Share result</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              impact('light');
              if (p.rivalryId) router.push({ pathname: '/rivalries/faceoff-new', params: { id: p.rivalryId, nameA, nameB } });
              else router.back();
            }}
            hitSlop={10}
            style={{ paddingVertical: 16 }}
            accessibilityLabel="Rematch"
          >
            <Text style={{ color: colors.muted, fontWeight: '800', fontSize: 16, textAlign: 'center' }}>Rematch</Text>
          </Pressable>
        </View>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  h1: { fontSize: 20, fontWeight: '900' },
  vsRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 10 },
  side: { alignItems: 'center', flex: 1 },
  ring: { borderWidth: 3, borderRadius: 50, padding: 3 },
  avatar: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
  winnerPill: { borderRadius: radii.full, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8 },
  pctRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  pct: { fontWeight: '900', fontSize: 40 },
  bar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginTop: 8 },
  breakdown: { borderWidth: 1, borderRadius: radii.lg, padding: 16, marginTop: spacing.md },
  breakRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'transparent' },
  note: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radii.lg, padding: 14, marginTop: spacing.md },
  shareBtn: { backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: radii.full },
});
