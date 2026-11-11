/** Live Ended - viewer recap (mock 07).
 * Shown when a session you watched ends. Real data: session record
 * (watch minutes from startedAt/endedAt, other viewers from the
 * viewer count) and the host handle from /api/live/:id so Follow is
 * the real follow endpoint. Gifts you sent and the supporter label
 * are tracked on this device - there is no per-viewer gift lookup
 * on the backend yet. Replay saving does not exist yet either, so
 * the replay note is the honest product copy.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#FFA726';
const TEAL = '#34D399';

type Session = { id: string; title: string; status: string; viewerCount: number; startedAt: string | null; endedAt: string | null };

function initials(name: string): string {
  return (name || '?').slice(0, 2).toUpperCase();
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export default function LiveEndedScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [host, setHost] = useState('');
  const [handle, setHandle] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [giftsSent, setGiftsSent] = useState(0);
  const [following, setFollowing] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api<{ session: Session; favorite?: { user?: { displayName?: string; handle?: string } } }>('/api/live/' + id, { skipAuth: true });
      setSession(r.session);
      const u = r.favorite && r.favorite.user;
      if (u) {
        setHost(u.displayName || '');
        setHandle(u.handle || null);
      }
    } catch { /* offline */ }
    try {
      const raw = await AsyncStorage.getItem('rally.liveGiftsSent');
      if (raw) {
        const map = JSON.parse(raw);
        setGiftsSent(map[String(id)] || 0);
      }
    } catch { /* fresh */ }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function follow() {
    if (!handle) return;
    if (!getToken()) { router.push('/login'); return; }
    impact('medium');
    try {
      await api('/api/users/' + handle + '/follow', { method: 'POST' });
      setFollowing(true);
      impact('success');
    } catch (e: any) {
      Alert.alert('Follow', e.message || 'Could not follow right now');
    }
  }

  const mins = session && session.startedAt && session.endedAt
    ? Math.max(1, Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 60000))
    : 0;
  const others = session ? Math.max(0, session.viewerCount - 1) : 0;
  const firstName = host ? host.split(' ')[0] : 'the host';

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top + 20 }]}>
      <View style={styles.center}>
        <LinearGradient colors={[GOLD, '#FF6D3D'] as [string, string]} style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(host || 'FA')}</Text>
        </LinearGradient>
        <Text style={[styles.h1, { color: colors.text }]}>{(firstName || 'The live') + "'s live has ended"}</Text>
        <Text style={[styles.sub, { color: colors.muted }]}>
          {'You watched ' + mins + ' minutes with ' + fmt(others) + ' others.'}
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <Text style={{ color: colors.muted, fontSize: 16 }}>Gifts you sent</Text>
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 }}>{String(giftsSent)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={{ color: colors.muted, fontSize: 16 }}>You joined as</Text>
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 }}>
              {giftsSent > 0 ? 'Supporter' : 'Fan'}
            </Text>
          </View>
        </View>

        <View style={[styles.note, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="videocam-outline" size={20} color={TEAL} />
          <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 21, flex: 1, marginLeft: 12 }}>
            {'A replay is available for 7 days if ' + firstName + ' saves it.'}
          </Text>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <Pressable onPress={follow} disabled={following || !handle} accessibilityLabel={'Follow ' + firstName}>
          <LinearGradient colors={[GOLD, '#FF8A3D'] as [string, string]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[styles.followBtn, (following || !handle) && { opacity: 0.6 }]}>
            <Text style={styles.followText}>{following ? 'Following' : 'Follow ' + firstName}</Text>
          </LinearGradient>
        </Pressable>
        <Pressable onPress={() => router.replace('/live')} style={{ alignItems: 'center', paddingVertical: 14 }} accessibilityLabel="Back to Live">
          <Text style={{ color: colors.muted, fontWeight: '800', fontSize: 16 }}>Back to Live</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', paddingHorizontal: 20, paddingTop: 40 },
  avatar: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 32 },
  h1: { fontWeight: '900', fontSize: 30, textAlign: 'center', marginTop: 20 },
  sub: { fontSize: 16, textAlign: 'center', marginTop: 8 },
  card: { width: '100%', borderWidth: 1, borderRadius: 18, marginTop: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: 1 },
  note: { width: '100%', flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 18, padding: 14, marginTop: 14 },
  footer: { paddingHorizontal: 20 },
  followBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: radii.full },
  followText: { color: '#1A1206', fontWeight: '900', fontSize: 18 },
});
