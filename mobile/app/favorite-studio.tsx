/** Favorite Studio - Favorite dashboard (mock 06)
 * Creator home: available-to-cash-out gradient card with Cash out and
 * Statement, Fans and Moments stat cards, TODAY checklist with the
 * next action highlighted, the fair-rankings note, and a creator
 * bottom bar (Studio / Content / + / Fans / Me).
 * Data: /api/payouts/me, /api/users/me, /api/moments/favorite/:handle.
 * Moment views have no backend counter yet - the second card shows
 * the real Moment count instead.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { Avatar } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const TEAL = '#34D399';

function fmtNaira(n: number): string {
  return '\u20A6' + Math.round(n).toLocaleString('en-US');
}

export default function FavoriteStudioScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(true);
  const [me, setMe] = useState<{ displayName: string; avatarUrl?: string | null; handle?: string } | null>(null);
  const [available, setAvailable] = useState(0);
  const [pending, setPending] = useState(0);
  const [fans, setFans] = useState(0);
  const [momentCount, setMomentCount] = useState(0);

  const load = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    setLoading(true);
    try {
      const meRes = await api<{ user: any }>('/api/auth/me');
      const u = meRes.user || meRes;
      setMe(u);
      const fav = (u.roles || []).indexOf('FAVORITE') > -1;
      setIsFavorite(fav);
      setFans((u.favoriteProfile && u.favoriteProfile.supporterCount) || 0);
      try {
        await AsyncStorage_setHandle(u.handle);
      } catch { /* ignore */ }
      if (fav) {
        try {
          const p = await api<{ balance: { available: number; pending: number } }>('/api/payouts/me');
          setAvailable(Number(p.balance && p.balance.available) || 0);
          setPending(Number(p.balance && p.balance.pending) || 0);
        } catch { /* payouts unavailable */ }
        try {
          const m = await api<{ moments: unknown[] }>('/api/moments/favorite/' + (u.handle || ''), { skipAuth: true });
          setMomentCount((m.moments || []).length);
        } catch { /* moments unavailable */ }
      }
    } catch {
      // offline
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const initials = ((me && me.displayName) || 'MA').slice(0, 2).toUpperCase();

  const todos = [
    { label: 'Reply to new comments', meta: 'Open', done: false, action: '/inbox' },
    { label: 'Post a Moment this week', meta: '2 days left', done: false, action: '/compose-moment' },
    { label: 'Thank 5 new supporters', meta: 'Done', done: true, action: null },
  ];

  const barItems = [
    { label: 'Studio', icon: 'bar-chart-outline' as const, action: null },
    { label: 'Content', icon: 'play-outline' as const, action: '/(tabs)/feed' },
    { label: '+', icon: 'add' as const, action: '/create' },
    { label: 'Fans', icon: 'people-outline' as const, action: '/subscriptions' },
    { label: 'Me', icon: 'person-outline' as const, action: '/(tabs)/you' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Screen>
        {/* Header */}
        <View style={styles.header}>
          <Avatar name={(me && me.displayName) || 'MA'} size={38} uri={(me && me.avatarUrl) || undefined} />
          <Text style={[styles.h1, { color: colors.text }]}>Favorite studio</Text>
          <Pressable onPress={() => router.push('/notifications')} hitSlop={10} accessibilityLabel="Notifications">
            <Ionicons name="notifications" size={22} color={GOLD} />
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={GOLD} style={{ marginTop: 60 }} />
        ) : !getToken() ? (
          <View style={{ alignItems: 'center', marginTop: 80 }}>
            <Ionicons name="lock-closed-outline" size={40} color={GOLD} />
            <Text style={[styles.quietTitle, { color: colors.text }]}>Log in to open your studio</Text>
            <Pressable onPress={() => router.push('/login')} style={[styles.loginBtn]} accessibilityLabel="Log in">
              <Text style={styles.loginText}>Log in</Text>
            </Pressable>
          </View>
        ) : !isFavorite ? (
          <View style={{ alignItems: 'center', marginTop: 80, paddingHorizontal: 30 }}>
            <Ionicons name="sparkles-outline" size={40} color={GOLD} />
            <Text style={[styles.quietTitle, { color: colors.text }]}>For Favorites</Text>
            <Text style={[styles.quietBody, { color: colors.muted }]}>
              Apply as a Favorite to unlock the studio, payouts and supporter tools.
            </Text>
            <Pressable
              onPress={() => router.push('/apply-favorite')}
              style={[styles.loginBtn, { marginTop: 20 }]}
              accessibilityLabel="Apply as a Favorite"
            >
              <Text style={styles.loginText}>Apply as a Favorite</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
            {/* Cash out hero */}
            <LinearGradient
              colors={['#B0356B', GOLD_DEEP, GOLD] as [string, string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              <Text style={styles.heroLabel}>Available to cash out</Text>
              <Text style={styles.heroValue}>{fmtNaira(available)}</Text>
              <View style={styles.heroBtns}>
                <Pressable
                  style={({ pressed }) => [styles.heroBtn, { backgroundColor: 'rgba(255,255,255,0.35)' }, pressed && { opacity: 0.85 }]}
                  onPress={() => { impact('medium'); router.push('/cash-out'); }}
                  accessibilityLabel="Cash out"
                >
                  <Text style={styles.heroBtnText}>Cash out</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.heroBtn, { backgroundColor: 'rgba(255,255,255,0.35)' }, pressed && { opacity: 0.85 }]}
                  onPress={() => { impact('light'); router.push('/earnings'); }}
                  accessibilityLabel="Statement"
                >
                  <Text style={styles.heroBtnText}>Statement</Text>
                </Pressable>
              </View>
              <Text style={styles.heroSub}>
                {pending > 0
                  ? 'Pending ' + fmtNaira(pending) + ' \u00b7 Clears in 3 days'
                  : 'No pending balance \u00b7 next payout day is set by Rally'}
              </Text>
            </LinearGradient>

            {/* Stat cards */}
            <View style={styles.statRow}>
              <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Fans</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {fans >= 1000 ? (fans / 1000).toFixed(1).replace(/\.0$/, '') + 'K' : String(fans)}
                </Text>
                <Text style={[styles.statDelta, { color: TEAL }]}>+ this week</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Moments</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{String(momentCount)}</Text>
                <Text style={[styles.statDelta, { color: TEAL }]}>{momentCount > 0 ? 'keep posting' : 'post your first'}</Text>
              </View>
            </View>

            {/* TODAY */}
            <Text style={[styles.section, { color: colors.muted }]}>TODAY</Text>
            {todos.map((t, i) => (
              <Pressable
                key={t.label}
                disabled={!t.action}
                onPress={() => {
                  if (!t.action) return;
                  impact('light');
                  router.push(t.action as any);
                }}
                style={[
                  styles.todo,
                  { borderColor: i === 0 && !t.done ? GOLD : colors.border, backgroundColor: colors.surface },
                ]}
                accessibilityLabel={t.label}
              >
                <View style={[styles.todoDot, t.done ? { backgroundColor: TEAL } : { borderColor: colors.border, backgroundColor: 'transparent' }]}>
                  {t.done ? <Ionicons name="checkmark" size={13} color="#04120C" /> : null}
                </View>
                <Text style={[styles.todoLabel, { color: colors.text }]}>{t.label}</Text>
                <Text style={{ color: i === 0 && !t.done ? GOLD : colors.muted, fontWeight: '800', fontSize: 14 }}>
                  {t.meta}
                </Text>
              </Pressable>
            ))}

            {/* Fair rankings note */}
            <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Ionicons name="shield-checkmark" size={16} color={TEAL} />
              <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                Gifts never change your rank. Rankings use activity and community.
              </Text>
            </View>
          </ScrollView>
        )}
      </Screen>

      {/* Creator bottom bar */}
      {isFavorite && getToken() && !loading ? (
        <View style={[styles.tabBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(10, insets.bottom) }]}>
          {barItems.map((b) =>
            b.label === '+' ? (
              <Pressable
                key={b.label}
                onPress={() => { impact('medium'); router.push('/create'); }}
                style={styles.plusWrap}
                accessibilityLabel="Create"
              >
                <LinearGradient
                  colors={[GOLD, GOLD_DEEP] as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.plusBtn}
                >
                  <Ionicons name="add" size={24} color="#fff" />
                </LinearGradient>
              </Pressable>
            ) : (
              <Pressable
                key={b.label}
                onPress={() => {
                  if (!b.action) return;
                  impact('light');
                  router.push(b.action as any);
                }}
                style={styles.tabItem}
                accessibilityLabel={b.label}
              >
                <Ionicons name={b.icon} size={22} color={b.label === 'Studio' ? GOLD : colors.tabInactive || colors.muted} />
                <Text style={{ color: b.label === 'Studio' ? GOLD : colors.muted, fontSize: 11, fontWeight: '700', marginTop: 3 }}>
                  {b.label}
                </Text>
              </Pressable>
            )
          )}
        </View>
      ) : null}
    </View>
  );
}

async function AsyncStorage_setHandle(handle: string) {
  try {
    const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
    await AsyncStorage.setItem('rally.myHandle', String(handle || ''));
  } catch { /* ignore */ }
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  hero: { borderRadius: radii.lg, padding: 18, marginBottom: spacing.md },
  heroLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '800' },
  heroValue: { color: '#fff', fontSize: 40, fontWeight: '900', marginTop: 4 },
  heroBtns: { flexDirection: 'row', gap: 12, marginTop: 14 },
  heroBtn: { flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: radii.full },
  heroBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 12 },
  statRow: { flexDirection: 'row', gap: 12, marginBottom: spacing.md },
  statCard: { flex: 1, borderWidth: 1, borderRadius: radii.lg, padding: 16 },
  statLabel: { fontSize: 14, fontWeight: '700' },
  statValue: { fontSize: 30, fontWeight: '900', marginTop: 4 },
  statDelta: { fontSize: 13, fontWeight: '800', marginTop: 4 },
  section: { fontSize: 13, fontWeight: '900', letterSpacing: 0.8, marginTop: spacing.sm, marginBottom: 10 },
  todo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderRadius: radii.lg,
    padding: 15,
    marginBottom: 10,
  },
  todoDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  todoLabel: { flex: 1, fontSize: 16, fontWeight: '800' },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 14,
    marginTop: spacing.sm,
  },
  noteText: { flex: 1, fontSize: 13, lineHeight: 19 },
  quietTitle: { fontSize: 20, fontWeight: '900', marginTop: 12 },
  quietBody: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 8 },
  loginBtn: { backgroundColor: GOLD, borderRadius: radii.full, paddingHorizontal: 26, paddingVertical: 13 },
  loginText: { color: '#111', fontWeight: '900', fontSize: 15 },
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  tabItem: { flex: 1, alignItems: 'center' },
  plusWrap: { flex: 1, alignItems: 'center' },
  plusBtn: { width: 52, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
