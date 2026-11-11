/** Live summary (mock 19) - "Nice session, {name}".
 * Shown right after a host ends a session. Stats come from the real
 * session record and gift leaderboard: viewers, gift tokens,
 * supporters and earned naira (tokens x the 0.6 gift-points rate).
 * Peak viewer tracking and new-fan attribution have no backend yet,
 * so those cards show the honest numbers we do have.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GradientButton } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#FFA726';
const TEAL = '#34D399';
const EARN_RATE = 0.6; // matches the backend GIFT_POINTS_RATE

type Session = { id: string; title: string; viewerCount: number; startedAt: string | null; endedAt: string | null };
type BoardRow = { name: string; tokens: number };

const AVATAR_COLORS = ['#00BCD4', '#F4511E', '#AB47BC'];

function initials(name: string): string {
  const parts = (name || 'F').trim().split(/\s+/);
  return ((parts[0] || 'F')[0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export default function LiveSummaryScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [session, setSession] = useState<Session | null>(null);
  const [board, setBoard] = useState<BoardRow[]>([]);
  const [firstName, setFirstName] = useState('Favorite');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await api<{ session: Session; favorite?: { displayName?: string } }>('/api/live/' + id, { skipAuth: true });
      setSession(r.session);
      const name = (r.favorite && r.favorite.displayName) || '';
      if (name) setFirstName(name.split(' ')[0]);
      try {
        const handleRaw = await AsyncStorage.getItem('rally.myHandle');
        const handle = handleRaw ? JSON.parse(handleRaw) : null;
        if (handle) {
          const u = await api<any>('/api/users/' + handle);
          if (u.user && u.user.displayName) setFirstName(u.user.displayName.split(' ')[0]);
        }
      } catch { /* keep session name */ }
    } catch { /* offline */ }
    try {
      const b = await api<{ leaderboard: BoardRow[] }>('/api/live/' + id + '/leaderboard', { skipAuth: true });
      setBoard(b.leaderboard || []);
    } catch { /* offline */ }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const tokens = board.reduce((a, b) => a + b.tokens, 0);
  const mins = session && session.startedAt && session.endedAt
    ? Math.max(1, Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 60000))
    : 0;

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Live ended</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={[styles.h2, { color: colors.text }]}>{'Nice session, ' + firstName}</Text>
          {session ? (
            <Text style={[styles.sub, { color: colors.muted }]}>
              {session.title + (mins ? ' \u00b7 ' + mins + ' minutes' : '')}
            </Text>
          ) : null}

          {/* Stat cards */}
          <View style={styles.grid}>
            {[
              { label: 'Viewers', value: fmt(session ? session.viewerCount : 0) },
              { label: 'Gift tokens', value: fmt(tokens) },
              { label: 'Supporters', value: String(board.length) },
              { label: 'Earned', value: '\u20A6' + fmt(tokens * EARN_RATE) },
            ].map((c) => (
              <View key={c.label} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={{ color: colors.muted, fontSize: 14 }}>{c.label}</Text>
                <Text style={{ color: colors.text, fontSize: 28, fontWeight: '900', marginTop: 4 }}>{c.value}</Text>
              </View>
            ))}
          </View>

          {/* Top supporters */}
          {board.length > 0 ? (
            <>
              <Text style={[styles.section, { color: colors.muted }]}>TOP SUPPORTERS</Text>
              <View style={{ flexDirection: 'row', gap: 18 }}>
                {board.slice(0, 3).map((b, i) => (
                  <View key={b.name + i} style={{ alignItems: 'center' }}>
                    <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }]}>
                      <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>{initials(b.name)}</Text>
                    </View>
                    <Text numberOfLines={1} style={{ color: colors.text, fontWeight: '800', fontSize: 13, marginTop: 8, maxWidth: 76 }}>
                      {b.name}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {/* Replay note */}
          <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Ionicons name="videocam-outline" size={16} color={TEAL} />
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              Save the replay as a Moment so fans who missed it can watch.
            </Text>
          </View>

          {loading ? <Text style={{ color: colors.muted, fontSize: 13, marginTop: 12 }}>Loading\u2026</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          <GradientButton
            label="Save replay as Moment"
            onPress={() => { impact('medium'); router.push('/compose-moment'); }}
            accessibilityLabel="Save replay as Moment"
          />
          <Pressable onPress={() => router.replace('/favorite-studio')} hitSlop={8} accessibilityLabel="Discard replay">
            <Text style={[styles.discard, { color: colors.muted }]}>Discard replay</Text>
          </Pressable>
        </View>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  h2: { fontSize: 32, fontWeight: '900' },
  sub: { fontSize: 16, marginTop: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: spacing.md },
  statCard: { borderWidth: 1, borderRadius: radii.lg, padding: 16, width: '47.5%', flexGrow: 1 },
  section: { fontSize: 13, fontWeight: '900', letterSpacing: 0.8, marginTop: spacing.lg, marginBottom: 12 },
  avatar: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center' },
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
  footer: { paddingTop: spacing.sm },
  discard: { textAlign: 'center', fontWeight: '800', fontSize: 15, marginTop: 14 },
});
