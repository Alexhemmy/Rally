/** Waiting Room (mock 02).
 * Shown for a scheduled live: host avatar, "goes live soon", a real
 * countdown from startsAt (auto-opens the session at zero), fans
 * waiting from the real viewer count, Remind me (persisted on this
 * device) and Share. No push-scheduling backend yet, so reminders
 * live in rally.liveReminders.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useShare } from '@/hooks/useShare';
import { radii } from '@/constants/theme';
import { api } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#FFA726';

type Session = { id: string; title: string; status: string; viewerCount: number; startsAt: string | null };

function initials(name: string): string {
  return (name || '?').slice(0, 2).toUpperCase();
}

export default function LiveWaitingScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const { shareMoment } = useShare();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string; title?: string; host?: string; startsAt?: string; viewers?: string }>();

  const [session, setSession] = useState<Session | null>(null);
  const [host, setHost] = useState(params.host || '');
  const [title, setTitle] = useState(params.title || '');
  const [reminded, setReminded] = useState(false);
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    try {
      const r = await api<{ session: Session; favorite?: { user?: { displayName?: string } } }>('/api/live/' + params.id, { skipAuth: true });
      setSession(r.session);
      setTitle(r.session.title || title);
      const n = (r.favorite && r.favorite.user && r.favorite.user.displayName) || '';
      if (n) setHost(n);
      if (r.session.status === 'live') {
        router.replace({ pathname: '/live/[id]', params: { id: String(params.id) } });
      }
    } catch { /* keep params */ }
  }, [params.id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearInterval(t); };
  }, []);
  useEffect(() => {
    AsyncStorage.getItem('rally.liveReminders')
      .then((raw) => setReminded(!!raw && (JSON.parse(raw) as string[]).indexOf(String(params.id)) > -1))
      .catch(() => undefined);
  }, [params.id]);

  const startsAt = (session && session.startsAt) || params.startsAt || null;
  const startMs = startsAt ? new Date(startsAt).getTime() : NaN;
  const left = isNaN(startMs) ? 0 : Math.max(0, Math.floor((startMs - now) / 1000));
  const hr = Math.floor(left / 3600);
  const min = Math.floor((left % 3600) / 60);
  const sec = left % 60;
  const pad = (n: number) => (n < 10 ? '0' : '') + n;

  useEffect(() => {
    if (!isNaN(startMs) && left === 0 && session && session.status === 'scheduled') {
      router.replace({ pathname: '/live/[id]', params: { id: String(params.id) } });
    }
  }, [left, startMs, session, params.id, router]);

  function toggleReminder() {
    impact('light');
    setReminded((prev) => {
      const next = !prev;
      AsyncStorage.getItem('rally.liveReminders')
        .then((raw) => {
          const list: string[] = raw ? JSON.parse(raw) : [];
          const out = next ? list.concat([String(params.id)]) : list.filter((x) => x !== String(params.id));
          return AsyncStorage.setItem('rally.liveReminders', JSON.stringify(out));
        })
        .catch(() => undefined);
      return next;
    });
  }

  const waiting = session ? session.viewerCount : parseInt(String(params.viewers || '0'), 10) || 0;
  const firstName = host ? host.split(' ')[0] : '';

  return (
    <View style={[styles.root, { backgroundColor: '#0B0812', paddingTop: insets.top }]}>
      <LinearGradient colors={['#1A0F26', '#3A1D4E', '#0B0812'] as [string, string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />

      <View style={styles.center}>
        <LinearGradient colors={[GOLD, '#FF6D3D'] as [string, string]} style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(host || 'FA')}</Text>
        </LinearGradient>
        <Text style={styles.h1}>{(firstName || 'The Favorite') + ' goes live soon'}</Text>
        <Text style={styles.sub}>{title || 'Live session'}</Text>

        <View style={styles.countRow}>
          {[
            [pad(hr), 'hr'],
            [pad(min), 'min'],
            [pad(sec), 'sec'],
          ].map(([v, l]) => (
            <View key={l} style={styles.countBox}>
              <Text style={styles.countNum}>{v}</Text>
              <Text style={styles.countLabel}>{l}</Text>
            </View>
          ))}
        </View>
        {!isNaN(startMs) ? null : (
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 10 }}>Start time to be confirmed</Text>
        )}
        <Text style={styles.waitingText}>{waiting.toLocaleString('en-US') + ' fans are waiting'}</Text>
      </View>

      <View style={[styles.footer, { bottom: Math.max(insets.bottom, 24) }]}>
        <Pressable onPress={toggleReminder} style={styles.remindBtn} accessibilityLabel={reminded ? 'Reminder on' : 'Remind me'}>
          <LinearGradient colors={[GOLD, '#FF8A3D'] as [string, string]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.remindGrad}>
            <Ionicons name={reminded ? 'notifications' : 'notifications-outline'} size={20} color="#1A1206" />
            <Text style={styles.remindText}>{reminded ? 'Reminder on' : 'Remind me'}</Text>
          </LinearGradient>
        </Pressable>
        <Pressable
          onPress={() => shareMoment(title || 'a live session', String(params.id))}
          style={styles.shareBtn}
          accessibilityLabel="Share"
        >
          <Ionicons name="share-social-outline" size={22} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  avatar: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.85)' },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 34 },
  h1: { color: '#fff', fontWeight: '900', fontSize: 30, textAlign: 'center', marginTop: 22 },
  sub: { color: 'rgba(255,255,255,0.85)', fontSize: 17, textAlign: 'center', marginTop: 8 },
  countRow: { flexDirection: 'row', gap: 14, marginTop: 26 },
  countBox: { width: 88, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', paddingVertical: 14 },
  countNum: { color: '#fff', fontWeight: '900', fontSize: 28 },
  countLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700', marginTop: 2 },
  waitingText: { color: 'rgba(255,255,255,0.85)', fontSize: 16, marginTop: 22 },
  footer: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', gap: 12 },
  remindBtn: { flex: 1 },
  remindGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 17, borderRadius: radii.full },
  remindText: { color: '#1A1206', fontWeight: '900', fontSize: 17 },
  shareBtn: { width: 56, borderRadius: radii.full, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
});
