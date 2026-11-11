/** Fandom Battle (UX 33) - Rally design
 * Two fandoms, one weekly scoreboard. Only real supporter counts are
 * shown today; weekly unique-supporter stats arrive with analytics.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const PURPLE = '#A78BFA';
const TEAL = '#34D399';

type Side = { handle: string; displayName: string; supporterCount: number } | null;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function weekLabel() {
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // Monday start
  const start = new Date(now.getTime() - day * 86400000);
  return 'Week of ' + start.getDate() + ' ' + MONTHS[start.getMonth()] + ' \u00b7 ends Sunday';
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0] || 'R')[0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

export default function FandomBattleScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ a?: string; b?: string }>();
  const { impact } = useHaptics();

  const [sideA, setSideA] = useState<Side>(null);
  const [sideB, setSideB] = useState<Side>(null);
  const [following, setFollowing] = useState<boolean | null>(null);
  const [joining, setJoining] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleA = params.a ? String(params.a) : '';
  const handleB = params.b ? String(params.b) : '';

  const load = useCallback(async () => {
    if (!handleA) { setLoading(false); return; }
    setLoading(true);
    try {
      const ra: any = await api('/api/favorites/' + handleA);
      const fa = ra.favorite || ra;
      setSideA({ handle: handleA, displayName: fa.displayName || fa.name || handleA, supporterCount: Number(fa.supporterCount || 0) });
    } catch { setSideA(null); }
    if (handleB) {
      try {
        const rb: any = await api('/api/favorites/' + handleB);
        const fb = rb.favorite || rb;
        setSideB({ handle: handleB, displayName: fb.displayName || fb.name || handleB, supporterCount: Number(fb.supporterCount || 0) });
      } catch { setSideB(null); }
    }
    if (getToken()) {
      try {
        const u: any = await api('/api/users/' + handleA);
        setFollowing(Boolean(u.user && u.user.isFollowing));
      } catch { setFollowing(null); }
    }
    setLoading(false);
  }, [handleA, handleB]);

  useEffect(() => { load(); }, [load]);

  async function join() {
    if (!sideA) return;
    setJoining(true);
    impact('medium');
    try {
      await api('/api/users/' + sideA.handle + '/follow', { method: 'POST' });
      setFollowing(true);
    } catch (e: any) {
      Alert.alert('Could not join', e.message || 'Try again in a moment.');
    } finally {
      setJoining(false);
    }
  }

  function block(side: Side, accent: string, align: 'left' | 'right') {
    if (!side) return null;
    return (
      <View style={[styles.sideBlock, align === 'right' && { alignItems: 'flex-end' }]}>
        <View style={[styles.bigAvatar, { backgroundColor: accent }]}>
          <Text style={styles.bigAvatarText}>{initials(side.displayName)}</Text>
        </View>
        <Text style={[styles.sideName, { color: colors.text }]} numberOfLines={1}>{side.displayName}</Text>
        <Text style={[styles.sideHandle, { color: colors.muted }]}>@{side.handle}</Text>
      </View>
    );
  }

  const countA = sideA ? sideA.supporterCount : 0;
  const countB = sideB ? sideB.supporterCount : 0;
  const total = countA + countB;
  const pctA = total > 0 ? Math.round((countA / total) * 100) : 50;

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Fandom Battle</Text>
          <View style={{ width: 26 }} />
        </View>

        {!handleA ? (
          <View style={styles.empty}>
            <Ionicons name="trophy-outline" size={40} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No battle yet</Text>
            <Text style={[styles.emptyBody, { color: colors.muted }]}>
              Fandom Battles are opened from a Favorite's profile. Pick two Favorites to compare.
            </Text>
            <Pressable
              onPress={() => router.push('/search')}
              style={[styles.emptyBtn, { borderColor: GOLD }]}
              accessibilityLabel="Find Favorites"
            >
              <Text style={{ color: GOLD, fontWeight: '800', fontSize: 14 }}>Find Favorites</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={[styles.weekPill, { backgroundColor: colors.surfaceElevated }]}>
              <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 13 }}>{weekLabel()}</Text>
            </View>

            <View style={[styles.arena, { borderColor: colors.border }]}>
              <View style={styles.vsRow}>
                {block(sideA, GOLD, 'left')}
                <Text style={[styles.vs, { color: colors.muted }]}>VS</Text>
                {block(sideB, PURPLE, 'right')}
              </View>
              <Text style={[styles.metricLabel, { color: colors.muted }]}>SUPPORTERS</Text>
              <View style={styles.countRow}>
                <Text style={[styles.count, { color: GOLD }]}>{countA.toLocaleString('en-US')}</Text>
                <Text style={[styles.count, { color: PURPLE }]}>{countB.toLocaleString('en-US')}</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barA, { width: pctA + '%' }]} />
                <View style={[styles.barB, { flex: 1 }]} />
              </View>
            </View>

            <Text style={[styles.section, { color: colors.muted }]}>HOW THE WEEK IS GOING</Text>
            <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Ionicons name="shield-checkmark-outline" size={16} color={TEAL} />
              <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                The scoreboard counts people who showed up. Spending is never counted. Weekly
                unique-supporter stats arrive with analytics — today the battle shows real
                supporter totals.
              </Text>
            </View>
          </ScrollView>
        )}

        {handleA && sideA ? (
          <View style={styles.footer}>
            {following ? (
              <View style={[styles.joinBtn, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>
                  You are in {sideA.displayName}'s corner
                </Text>
              </View>
            ) : (
              <Pressable onPress={join} disabled={joining} style={styles.joinBtn} accessibilityLabel="Join this fandom">
                <Text style={{ color: '#111', fontWeight: '900', fontSize: 15 }}>
                  {joining ? 'Joining…' : 'Join ' + sideA.displayName + "'s corner"}
                </Text>
              </Pressable>
            )}
          </View>
        ) : null}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 24, gap: 4 },
  emptyTitle: { fontSize: 17, fontWeight: '800', marginTop: 10 },
  emptyBody: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 6 },
  emptyBtn: { borderWidth: 1.5, borderRadius: radii.full, paddingHorizontal: 20, paddingVertical: 10, marginTop: 16 },
  weekPill: { alignSelf: 'center', borderRadius: radii.full, paddingHorizontal: 16, paddingVertical: 8, marginBottom: spacing.md },
  arena: { borderWidth: 1, borderRadius: radii.lg, padding: 18 },
  vsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sideBlock: { flex: 1, alignItems: 'center', maxWidth: '42%' },
  bigAvatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  bigAvatarText: { color: '#fff', fontWeight: '900', fontSize: 24 },
  sideName: { fontWeight: '800', fontSize: 15, marginTop: 10, textAlign: 'center' },
  sideHandle: { fontSize: 12, marginTop: 2 },
  vs: { fontWeight: '900', fontSize: 18 },
  metricLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, textAlign: 'center', marginTop: 16 },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  count: { fontWeight: '900', fontSize: 30 },
  barTrack: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 10 },
  barA: { backgroundColor: GOLD },
  barB: { backgroundColor: PURPLE },
  section: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: spacing.lg, marginBottom: 10 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: radii.lg, padding: 14 },
  noteText: { flex: 1, fontSize: 13, lineHeight: 19 },
  footer: { marginTop: 'auto', paddingTop: spacing.md },
  joinBtn: { backgroundColor: GOLD, borderRadius: radii.full, paddingVertical: 16, alignItems: 'center' },
});
