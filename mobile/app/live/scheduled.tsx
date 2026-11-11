/** Scheduled Lives (mock 08).
 * Reminders tab: sessions you set a reminder for (merged with the
 * live scheduled list so times stay fresh). My lives tab: sessions
 * hosted by your Favorite profile, with a real Start button. There
 * is no push-scheduling backend yet, so reminders are kept on this
 * device and the bell note says what the product will do.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView, Alert } from 'react-native';
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

type Session = { id: string; title: string; status: string; viewerCount: number; favoriteId: string; startsAt: string | null; host?: string };

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

export default function LiveScheduledScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();

  const [tab, setTab] = useState<'reminders' | 'mine'>('reminders');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [reminderIds, setReminderIds] = useState<string[]>([]);
  const [myFavId, setMyFavId] = useState<string | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await api<{ sessions: Session[] }>('/api/live', { skipAuth: true });
      const list = (r.sessions || []).filter((s) => s.status === 'scheduled').slice(0, 20);
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
      if (raw) setReminderIds(JSON.parse(raw));
    } catch { /* fresh */ }
    if (getToken()) {
      try {
        const me = await api<{ user: any }>('/api/auth/me');
        setMyFavId((me.user && me.user.favoriteProfile && me.user.favoriteProfile.id) || null);
      } catch { /* offline */ }
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function toggleReminder(s: Session) {
    impact('light');
    setReminderIds((prev) => {
      const next = prev.indexOf(s.id) > -1 ? prev.filter((x) => x !== s.id) : prev.concat([s.id]);
      AsyncStorage.setItem('rally.liveReminders', JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }

  async function start(s: Session) {
    if (startingId) return;
    setStartingId(s.id);
    impact('medium');
    try {
      await api('/api/live/' + s.id + '/start', { method: 'POST' });
      router.replace({ pathname: '/live/host', params: { id: s.id } });
    } catch (e: any) {
      Alert.alert('Start live', e.message || 'Could not start the session');
      setStartingId(null);
    }
  }

  const reminderRows = sessions.filter((s) => reminderIds.indexOf(s.id) > -1);
  const mine = myFavId ? sessions.filter((s) => s.favoriteId === myFavId) : [];
  const rows = tab === 'reminders' ? reminderRows : mine;

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Scheduled</Text>
          <View style={{ width: 26 }} />
        </View>

        <View style={[styles.seg, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {([
            ['reminders', 'Reminders'],
            ['mine', 'My lives'],
          ] as [typeof tab, string][]).map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => { impact('light'); setTab(key); }}
              style={[styles.segBtn, tab === key && { backgroundColor: colors.bg, borderRadius: radii.md }]}
              accessibilityLabel={label}
            >
              <Text style={{ color: tab === key ? colors.text : colors.muted, fontWeight: '900', fontSize: 16 }}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {rows.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 48, paddingHorizontal: 30, gap: 8 }}>
              <Ionicons name={tab === 'reminders' ? 'notifications-outline' : 'videocam-outline'} size={36} color={GOLD} />
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 18 }}>
                {tab === 'reminders' ? 'No reminders yet' : 'No lives scheduled'}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 14, textAlign: 'center' }}>
                {tab === 'reminders'
                  ? 'Tap Remind me on a scheduled live and it shows up here.'
                  : 'Schedule one from Go live. Your scheduled sessions appear here.'}
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12, marginTop: spacing.sm }}>
              {rows.map((s) => {
                const on = reminderIds.indexOf(s.id) > -1;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => { impact('light'); router.push({ pathname: '/live/waiting', params: { id: s.id, title: s.title, host: s.host || '', startsAt: s.startsAt || '', viewers: String(s.viewerCount) } }); }}
                    style={[styles.rowCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    accessibilityLabel={s.title}
                  >
                    <View style={[styles.avatar, { backgroundColor: GOLD }]}>
                      <Text style={styles.avatarText}>{initials(s.host)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={{ color: colors.text, fontWeight: '900', fontSize: 17 }}>{s.title}</Text>
                      <Text style={{ color: colors.muted, fontSize: 15, marginTop: 2 }}>
                        {(s.host || 'Favorite') + ' \u00b7 ' + whenText(s.startsAt)}
                      </Text>
                    </View>
                    {tab === 'reminders' ? (
                      <Pressable
                        onPress={() => toggleReminder(s)}
                        style={[styles.chip, { borderColor: colors.border, backgroundColor: on ? colors.bg : GOLD }]}
                        accessibilityLabel={on ? 'Reminder on' : 'Remind me'}
                      >
                        <Text style={{ color: on ? colors.text : '#1A1206', fontWeight: '900', fontSize: 14 }}>
                          {on ? 'Reminder on' : 'Remind me'}
                        </Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={() => start(s)}
                        disabled={startingId === s.id}
                        style={[styles.chip, { borderColor: TEAL, backgroundColor: TEAL + '1a' }]}
                        accessibilityLabel="Start live"
                      >
                        <Text style={{ color: TEAL, fontWeight: '900', fontSize: 14 }}>
                          {startingId === s.id ? 'Starting...' : 'Start'}
                        </Text>
                      </Pressable>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}

          {tab === 'reminders' ? (
            <View style={[styles.note, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="notifications-outline" size={20} color={TEAL} />
              <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 21, flex: 1, marginLeft: 12 }}>
                We remind you 10 minutes before. Turn reminders off any time in Notification settings.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  seg: { flexDirection: 'row', borderWidth: 1, borderRadius: radii.md, padding: 4, marginBottom: spacing.md },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  rowCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: radii.lg, padding: 14 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#1A1206', fontWeight: '900', fontSize: 15 },
  chip: { borderWidth: 1.5, borderRadius: radii.full, paddingHorizontal: 14, paddingVertical: 10 },
  note: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radii.lg, padding: 14, marginTop: spacing.md },
});
