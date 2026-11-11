/** Live Now (mock 01) - live discovery grid.
 * Following / Rising / Live tabs, category chips, a two-column grid
 * of live gradient cards with viewer counts, and a STARTING SOON
 * section with Remind me. Data is real: GET /api/live (list) plus
 * /api/live/:id per card for the host name. Reminders persist on
 * this device; scheduled rows open the waiting room.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#FFA726';
const LIVE_RED = '#E9355B';

const PALETTES: [string, string][] = [
  ['#B34FD1', '#FFA726'],
  ['#5B5BFF', '#7C4DFF'],
  ['#E9355B', '#FF8A3D'],
  ['#00B8A9', '#34D399'],
];

const CHIPS = ['For you', 'Gospel', 'Comedy', 'Music'];

type Session = {
  id: string;
  title: string;
  kind: string;
  status: string;
  viewerCount: number;
  startsAt?: string | null;
  host?: string;
};

function compact(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

function initials(name: string): string {
  return (name || '?').slice(0, 2).toUpperCase();
}

function whenText(iso?: string | null): string {
  if (!iso) return 'Time to be confirmed';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Time to be confirmed';
  const today = new Date().toDateString() === d.toDateString();
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (today) return 'Today ' + time;
  return d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }) + ', ' + time;
}

export default function LiveNowScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<'following' | 'rising' | 'live'>('live');
  const [chip, setChip] = useState('For you');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [reminders, setReminders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await api<{ sessions: Session[] }>('/api/live', { skipAuth: true });
      const list = (r.sessions || []).slice(0, 12);
      const named = await Promise.all(
        list.map(async (s) => {
          try {
            const d = await api<{ favorite?: { user?: { displayName?: string } } }>('/api/live/' + s.id, { skipAuth: true });
            return { ...s, host: (d.favorite && d.favorite.user && d.favorite.user.displayName) || 'Favorite' };
          } catch {
            return { ...s, host: 'Favorite' };
          }
        })
      );
      setSessions(named);
    } catch { /* offline */ }
    try {
      const raw = await AsyncStorage.getItem('rally.liveReminders');
      if (raw) setReminders(JSON.parse(raw));
    } catch { /* fresh */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function toggleReminder(s: Session) {
    impact('light');
    setReminders((prev) => {
      const next = prev.indexOf(s.id) > -1 ? prev.filter((x) => x !== s.id) : prev.concat([s.id]);
      AsyncStorage.setItem('rally.liveReminders', JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }

  let live = sessions.filter((s) => s.status === 'live' || s.status === 'paused');
  const scheduled = sessions.filter((s) => s.status === 'scheduled');
  if (tab === 'rising') live = live.slice().sort((a, b) => b.viewerCount - a.viewerCount);
  if (chip !== 'For you') {
    const q = chip.toLowerCase();
    live = live.filter((s) => ((s.title || '') + ' ' + (s.host || '')).toLowerCase().indexOf(q) > -1);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top + 10 }]}>
      {/* Tabs */}
      <View style={styles.tabRow}>
        {([
          ['following', 'Following'],
          ['rising', 'Rising'],
          ['live', 'Live'],
        ] as [typeof tab, string][]).map(([key, label]) => (
          <Pressable
            key={key}
            onPress={() => { impact('light'); setTab(key); }}
            style={styles.tabItem}
            accessibilityLabel={label}
          >
            <Text style={[styles.tabText, { color: tab === key ? colors.text : colors.muted }]}>{label}</Text>
            {tab === key ? <View style={styles.tabUnderline} /> : null}
          </Pressable>
        ))}
        <Pressable
          onPress={() => { impact('light'); router.push('/live/setup'); }}
          style={{ marginLeft: 'auto', paddingHorizontal: 10 }}
          accessibilityLabel="Go live"
        >
          <Ionicons name="videocam" size={22} color={GOLD} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {tab === 'following' ? (
          <Text style={{ color: colors.muted, fontSize: 12, paddingHorizontal: 16, marginBottom: 10 }}>
            Showing all lives. Follow filtering is not on the live list yet.
          </Text>
        ) : null}

        {/* Category chips */}
        <View style={styles.chipRow}>
          {CHIPS.map((c) => {
            const on = chip === c;
            return (
              <Pressable
                key={c}
                onPress={() => { impact('light'); setChip(c); }}
                style={[styles.chip, { borderColor: on ? GOLD : colors.border, backgroundColor: on ? GOLD + '1a' : colors.surface }]}
                accessibilityLabel={c}
              >
                <Text style={{ color: on ? GOLD : colors.text, fontWeight: '800', fontSize: 15 }}>{c}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Live grid */}
        {loading ? (
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 40 }}>Loading lives...</Text>
        ) : live.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 48, paddingHorizontal: 30, gap: 8 }}>
            <Ionicons name="radio-outline" size={36} color={GOLD} />
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 18 }}>Nothing live here</Text>
            <Text style={{ color: colors.muted, fontSize: 14, textAlign: 'center' }}>
              When a Favorite goes live it appears here. Pull down to refresh.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {live.map((s, i) => {
              const pal = PALETTES[i % PALETTES.length];
              return (
                <Pressable
                  key={s.id}
                  onPress={() => { impact('light'); router.push({ pathname: '/live/[id]', params: { id: s.id } }); }}
                  style={[styles.card, { backgroundColor: colors.surface }]}
                  accessibilityLabel={s.title}
                >
                  <LinearGradient colors={pal} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardBg}>
                    <View style={styles.cardTopRow}>
                      <View style={styles.livePill}>
                        <Text style={styles.livePillText}>LIVE</Text>
                      </View>
                      <View style={styles.viewerPill}>
                        <Text style={styles.viewerText}>{compact(s.viewerCount)}</Text>
                      </View>
                    </View>
                    <View style={{ marginTop: 'auto' }}>
                      <Text style={styles.cardTitle}>{s.title}</Text>
                      <Text style={styles.cardHost}>{s.host}</Text>
                    </View>
                  </LinearGradient>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Starting soon */}
        {scheduled.length > 0 ? (
          <View style={{ marginTop: spacing.lg }}>
            <View style={styles.soonHeader}>
              <Text style={[styles.soonLabel, { color: colors.muted }]}>STARTING SOON</Text>
              <Pressable onPress={() => { impact('light'); router.push('/live/scheduled'); }} accessibilityLabel="See all scheduled">
                <Text style={{ color: GOLD, fontWeight: '800', fontSize: 13 }}>See all</Text>
              </Pressable>
            </View>
            {scheduled.slice(0, 3).map((s) => {
              const on = reminders.indexOf(s.id) > -1;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => { impact('light'); router.push({ pathname: '/live/waiting', params: { id: s.id, title: s.title, host: s.host || '', startsAt: s.startsAt || '', viewers: String(s.viewerCount) } }); }}
                  style={[styles.soonRow, { borderBottomColor: colors.border }]}
                  accessibilityLabel={s.title}
                >
                  <View style={[styles.soonAvatar, { backgroundColor: LIVE_RED }]}>
                    <Text style={styles.soonAvatarText}>{initials(s.host)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ color: colors.text, fontWeight: '900', fontSize: 17 }}>
                      {(s.host || 'Favorite') + ' \u00b7 ' + s.title}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 15, marginTop: 2 }}>{whenText(s.startsAt)}</Text>
                  </View>
                  <Pressable
                    onPress={() => toggleReminder(s)}
                    style={[styles.remindChip, { backgroundColor: on ? colors.surface : GOLD }]}
                    accessibilityLabel={on ? 'Reminder on' : 'Remind me'}
                  >
                    <Text style={{ color: on ? colors.text : '#1A1206', fontWeight: '900', fontSize: 14 }}>
                      {on ? 'Reminder on' : 'Remind me'}
                    </Text>
                  </Pressable>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 26, paddingHorizontal: 16, marginBottom: 14 },
  tabItem: { alignItems: 'center' },
  tabText: { fontWeight: '900', fontSize: 19 },
  tabUnderline: { width: 26, height: 3, borderRadius: 2, backgroundColor: GOLD, marginTop: 5 },
  chipRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 16, flexWrap: 'wrap' },
  chip: { borderWidth: 1.5, borderRadius: radii.full, paddingHorizontal: 18, paddingVertical: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16 },
  card: { width: '47.5%', flexGrow: 1, borderRadius: 20, overflow: 'hidden' },
  cardBg: { height: 230, borderRadius: 20, padding: 12 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  livePill: { backgroundColor: LIVE_RED, borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 5 },
  livePillText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  viewerPill: { backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 4 },
  viewerText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  cardTitle: { color: '#fff', fontWeight: '900', fontSize: 17, lineHeight: 22 },
  cardHost: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 3 },
  soonHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 6 },
  soonLabel: { fontSize: 13, fontWeight: '900', letterSpacing: 0.8 },
  soonRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  soonAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  soonAvatarText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  remindChip: { borderRadius: radii.full, paddingHorizontal: 14, paddingVertical: 10 },
});
