/** Supporter Wall (UX 38) - Rally design
 * A Favorite's supporter leaderboard: podium, ranked list, and your own
 * rank. Rank and level only - amounts are never shown. Anonymous fans
 * appear as Anonymous Fan with rank only.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const TEAL = '#34D399';

type Entry = { rank: number; displayName: string; handle: string | null; isAnonymous: boolean };

const PERIODS: { id: 'weekly' | 'monthly' | 'alltime'; label: string }[] = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'alltime', label: 'All-time' },
];

const AVATAR_COLORS = ['#F4511E', '#00BCD4', '#E0956B', '#7C4DFF', '#5C6BC0', '#AB47BC'];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0] || '?')[0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

export default function SupporterWallScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ favoriteId?: string; name?: string }>();
  const { impact } = useHaptics();

  const favoriteId = params.favoriteId ? String(params.favoriteId) : '';
  const favName = params.name ? String(params.name) : 'Supporters';

  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'alltime'>('monthly');
  const [board, setBoard] = useState<Entry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!favoriteId) { setLoading(false); return; }
    setLoading(true);
    try {
      const r: any = await api('/api/leaderboards/' + favoriteId + '?period=' + period);
      setBoard(r.board || []);
    } catch { setBoard([]); }
    if (getToken()) {
      try {
        const me: any = await api('/api/leaderboards/' + favoriteId + '/me?period=' + period);
        setMyRank(me.rank || null);
      } catch { setMyRank(null); }
    }
    setLoading(false);
  }, [favoriteId, period]);

  useEffect(() => { load(); }, [load]);

  const top = board.slice(0, 3);
  const rest = board.slice(3);
  const podium = [top[1], top[0], top[2]]; // 2nd, 1st, 3rd
  const podiumHeights = [96, 124, 84];
  const podiumColors = ['#B0BEC5', '#FFA726', '#E0956B'];

  function avatarFor(e: Entry | undefined, size: number, color: string) {
    if (!e) return <View style={{ width: size, height: size }} />;
    return (
      <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: e.isAnonymous ? colors.surfaceElevated : color }]}>
        <Text style={[styles.avatarText, { fontSize: size / 2.8, color: e.isAnonymous ? colors.muted : '#fff' }]}>
          {e.isAnonymous ? '?' : initials(e.displayName)}
        </Text>
      </View>
    );
  }

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]} numberOfLines={1}>{favName}</Text>
          <View style={{ width: 26 }} />
        </View>

        {!favoriteId ? (
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: spacing.lg }}>
            Open a supporter wall from a Favorite's profile.
          </Text>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Period switch */}
            <View style={[styles.periodTrack, { backgroundColor: colors.surfaceElevated }]}>
              {PERIODS.map((p) => {
                const on = period === p.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => { impact('light'); setPeriod(p.id); }}
                    style={[styles.periodBtn, on && styles.periodBtnOn]}
                    accessibilityLabel={p.label}
                  >
                    <Text style={{ color: on ? '#111' : colors.muted, fontWeight: '800', fontSize: 14 }}>{p.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {loading ? (
              <Text style={{ color: colors.muted, fontSize: 14, marginTop: spacing.lg }}>Loading…</Text>
            ) : board.length === 0 ? (
              <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: spacing.lg }}>
                No supporters on the wall yet for this period.
              </Text>
            ) : (
              <>
                {/* Podium */}
                <View style={styles.podium}>
                  {podium.map((e, i) => (
                    <View key={i} style={styles.podiumCol}>
                      {e ? (
                        <>
                          {avatarFor(e, i === 1 ? 76 : 60, podiumColors[i])}
                          <Text style={[styles.podiumName, { color: colors.text }]} numberOfLines={1}>{e.displayName}</Text>
                        </>
                      ) : (
                        <View style={{ height: 76 }} />
                      )}
                      <View style={[styles.podiumStep, { height: podiumHeights[i], backgroundColor: podiumColors[i] + (i === 1 ? 'ee' : 'aa') }]}>
                        <Text style={[styles.podiumRank, { color: i === 1 ? '#111' : '#3E2723' }]}>{e ? e.rank : ''}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Rest of the wall */}
                {rest.map((e, i) => (
                  <View key={e.rank} style={[styles.row, i < rest.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                    <Text style={[styles.rank, { color: GOLD }]}>{e.rank}</Text>
                    {avatarFor(e, 44, AVATAR_COLORS[i % AVATAR_COLORS.length])}
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>{e.displayName}</Text>
                      <Text style={{ color: colors.muted, fontSize: 13, marginTop: 1 }}>
                        {e.isAnonymous ? 'Rank only' : 'Supporter'}
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Privacy note */}
            <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Ionicons name="eye-outline" size={16} color={TEAL} />
              <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                The wall shows rank and level only. Amounts are never shown.
              </Text>
            </View>

            {/* You card */}
            {favoriteId ? (
              <View style={[styles.youCard, { borderColor: GOLD }]}>
                <View style={[styles.youAvatar, { backgroundColor: '#1E88E5' }]}>
                  <Text style={styles.youAvatarText}>You</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 }}>You</Text>
                  <Text style={{ color: colors.muted, fontSize: 13, marginTop: 1 }}>Shown by name · change anytime</Text>
                </View>
                <Text style={{ color: colors.text, fontWeight: '900', fontSize: 20 }}>
                  {myRank ? '#' + myRank : '—'}
                </Text>
              </View>
            ) : null}
          </ScrollView>
        )}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  periodTrack: { flexDirection: 'row', borderRadius: radii.full, padding: 4, marginBottom: spacing.md },
  periodBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radii.full },
  periodBtnOn: { backgroundColor: '#fff' },
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 14, marginTop: spacing.sm },
  podiumCol: { alignItems: 'center', flex: 1 },
  podiumName: { fontWeight: '800', fontSize: 13, marginTop: 8, marginBottom: 6 },
  podiumStep: { width: '100%', borderTopLeftRadius: 14, borderTopRightRadius: 14, alignItems: 'center', justifyContent: 'center' },
  podiumRank: { fontWeight: '900', fontSize: 26 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  rank: { fontWeight: '900', fontSize: 18, width: 28 },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '900' },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: radii.lg, padding: 14, marginTop: spacing.md },
  noteText: { flex: 1, fontSize: 13, lineHeight: 19 },
  youCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: radii.lg, padding: 14, marginTop: spacing.md },
  youAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  youAvatarText: { color: '#fff', fontWeight: '900', fontSize: 13 },
});
