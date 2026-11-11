/** Giveaway Entered (mock 25) - confirmation after entering.
 * Real giveaway from GET /api/giveaways/:id (entryCount, seedHash,
 * entryClosesAt). Honest deviations: the backend stores the entry as a
 * row id rather than a sequential ticket number, so "Your entry" shows
 * the short entry id, and the Favorite's name is passed in from the
 * previous screen.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ActivityIndicator, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { spacing, radii } from '@/constants/theme';
import { api } from '@/lib/api';

const GOLD = '#FFA726';
const TEAL = '#34D399';

type Giv = {
  id: string;
  poolAmount: number;
  currency: string;
  winnerCount: number;
  entryClosesAt: string;
  seedHash: string | null;
  entryCount: number;
};

function shortHash(v: string | null): string {
  if (!v) return '\u2014';
  const s = String(v).replace(/\s+/g, '');
  return s.slice(0, 8) + '\u2026' + s.slice(-4);
}

function drawWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch { return '\u2014'; }
}

export default function GiveawayEnteredScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const { success } = useSounds();
  const params = useLocalSearchParams<{ id: string; entryId?: string; name?: string }>();

  const [g, setG] = useState<Giv | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!params.id) { setLoading(false); return; }
    try {
      const r = await api<{ giveaway: Giv }>('/api/giveaways/' + params.id, { skipAuth: true });
      setG(r.giveaway || null);
    } catch { /* offline */ }
    setLoading(false);
  }, [params.id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { success(); }, []);

  const name = params.name || 'This giveaway';

  async function share() {
    impact('light');
    try {
      await Share.share({
        message: "I just entered " + name + "'s giveaway on Rally. Free entry, winners picked on engagement, never on spend.",
      });
    } catch { /* dismissed */ }
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={[styles.ticketWrap, { backgroundColor: TEAL }]}>
          <Ionicons name="ticket" size={44} color="#04120C" />
        </View>
        <Text style={{ color: colors.text, fontWeight: '900', fontSize: 34, marginTop: 22 }}>You are in</Text>
        <Text style={{ color: colors.muted, fontSize: 17, marginTop: 8, textAlign: 'center', paddingHorizontal: 30 }}>
          {name + ' \u00b7 ' + (g ? g.winnerCount : '?') + ' winners'}
        </Text>
      </View>

      {loading ? <ActivityIndicator color={GOLD} style={{ marginTop: 20 }} /> : null}

      {g ? (
        <>
          {/* Entry summary */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.row}>
              <Text style={{ color: colors.muted, fontSize: 17 }}>Your entry</Text>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 }}>
                {'#' + String(params.entryId || g.id).replace(/-/g, '').slice(-4)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={{ color: colors.muted, fontSize: 17 }}>Total entries</Text>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 }}>
                {g.entryCount.toLocaleString('en-US')}
              </Text>
            </View>
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <Text style={{ color: colors.muted, fontSize: 17 }}>Draw</Text>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 }}>{drawWhen(g.entryClosesAt)}</Text>
            </View>
          </View>

          {/* Draw fingerprint */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={{ color: colors.muted, fontWeight: '900', fontSize: 14, letterSpacing: 1 }}>DRAW FINGERPRINT</Text>
            <View style={[styles.hashPill, { backgroundColor: colors.surfaceElevated }]}>
              <Text style={{ color: colors.text, fontFamily: 'monospace', fontSize: 15 }}>{shortHash(g.seedHash)}</Text>
            </View>
            <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 10 }}>
              Published before the draw. After it, anyone can check the result matches.
            </Text>
          </View>

          {/* Fairness note */}
          <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Ionicons name="shield-checkmark-outline" size={18} color={TEAL} />
            <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 21, flex: 1 }}>
              Spending never gives extra entries.
            </Text>
          </View>
        </>
      ) : null}

      <View style={styles.bottom}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Done">
          <LinearGradient
            colors={[GOLD, '#F57C00'] as [string, string]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.doneBtn}
          >
            <Text style={{ color: '#111', fontWeight: '900', fontSize: 18 }}>Done</Text>
          </LinearGradient>
        </Pressable>
        <Pressable onPress={share} hitSlop={10} accessibilityLabel="Share this giveaway">
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16, marginTop: 16 }}>Share this giveaway</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginTop: spacing.xl },
  ticketWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { borderWidth: 1, borderRadius: radii.lg, paddingHorizontal: 16, marginTop: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  hashPill: { alignSelf: 'flex-start', borderRadius: radii.sm, paddingHorizontal: 12, paddingVertical: 8, marginTop: 10 },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 14,
    marginTop: 16,
  },
  bottom: { marginTop: 'auto', paddingBottom: spacing.lg },
  doneBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: radii.full },
});
