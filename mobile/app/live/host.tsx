/** Hosting live (mock 18) - host view.
 * LIVE pill, viewer count, elapsed timer, Gift goal progress bar,
 * live chat feed, right rail controls and the red End live button.
 * Data is real: /api/live/:id, /chat and /leaderboard polled every
 * 5 seconds. Gift goal arrives from the setup screen as a param.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const LIVE_RED = '#E9355B';

type Session = { id: string; title: string; status: string; viewerCount: number; startedAt: string | null };
type ChatMsg = { id: string; body: string; name: string };
type BoardRow = { name: string; tokens: number };

function elapsed(from: string | null): string {
  if (!from) return '0:00';
  const secs = Math.max(0, Math.floor((Date.now() - new Date(from).getTime()) / 1000));
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m + ':' + (s < 10 ? '0' : '') + s;
}

export default function LiveHostScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const { click } = useSounds();
  const insets = useSafeAreaInsets();
  const { id, goal } = useLocalSearchParams<{ id: string; goal?: string }>();

  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [board, setBoard] = useState<BoardRow[]>([]);
  const [draft, setDraft] = useState('');
  const [ending, setEnding] = useState(false);

  const goalNum = parseInt(String(goal || '5000'), 10) || 5000;

  const poll = useCallback(async () => {
    try {
      const r = await api<{ session: Session }>('/api/live/' + id, { skipAuth: true });
      setSession(r.session);
    } catch { /* keep last */ }
    try {
      const c = await api<{ messages: ChatMsg[] }>('/api/live/' + id + '/chat', { skipAuth: true });
      setMessages(c.messages || []);
    } catch { /* chat optional */ }
    try {
      const b = await api<{ leaderboard: BoardRow[] }>('/api/live/' + id + '/leaderboard', { skipAuth: true });
      setBoard(b.leaderboard || []);
    } catch { /* offline */ }
  }, [id]);

  useEffect(() => {
    poll();
    const t = setInterval(poll, 5000);
    return () => { clearInterval(t); };
  }, [poll]);

  const giftsTotal = board.reduce((a, b) => a + b.tokens, 0);
  const progress = Math.min(1, giftsTotal / goalNum);
  const chat = messages.slice(-4);

  async function endLive() {
    if (ending) return;
    setEnding(true);
    impact('heavy');
    try {
      await api('/api/live/' + id + '/end', { method: 'POST' });
      router.replace({ pathname: '/live/summary', params: { id: String(id) } });
    } catch {
      setEnding(false);
    }
  }

  async function sendChat() {
    const body = draft.trim();
    if (!body || !getToken()) return;
    impact('light');
    click();
    try {
      await api('/api/live/' + id + '/chat', { method: 'POST', body: JSON.stringify({ body }) });
      setDraft('');
      await poll();
    } catch { /* ignore */ }
  }

  return (
    <View style={[styles.root, { backgroundColor: '#0B0812' }]}>
      <LinearGradient colors={['#2A1030', '#4A2A1E', '#1A0F26'] as [string, string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <View style={styles.livePill}>
          <Text style={styles.livePillText}>{session && session.status === 'paused' ? 'PAUSED' : 'LIVE'}</Text>
        </View>
        <View style={styles.darkPill}>
          <Ionicons name="eye-outline" size={13} color="#fff" />
          <Text style={styles.darkPillText}>{(session ? session.viewerCount : 0).toLocaleString('en-US')}</Text>
        </View>
        <Text style={styles.timer}>{elapsed(session ? session.startedAt : null)}</Text>
        <View style={[styles.darkPill, { marginLeft: 'auto' }]}>
          <Ionicons name="gift-outline" size={13} color="#fff" />
          <Text style={styles.darkPillText}>{giftsTotal.toLocaleString('en-US')}</Text>
        </View>
      </View>

      {/* Goal bar */}
      <View style={styles.goalCard}>
        <View style={styles.goalRow}>
          <Text style={styles.goalLabel}>{'Goal: ' + goalNum.toLocaleString('en-US') + ' Gifts'}</Text>
          <Text style={styles.goalValue}>{giftsTotal.toLocaleString('en-US')}</Text>
        </View>
        <View style={styles.goalTrack}>
          <View style={[styles.goalFill, { width: Math.round(progress * 100) + '%' }]} />
        </View>
      </View>

      {/* Right rail */}
      <View style={[styles.rail, { bottom: Math.max(insets.bottom, 40) + 96 }]}>
        {[
          { icon: 'mic-outline', label: 'Mic' },
          { icon: 'camera-outline', label: 'Camera' },
          { icon: 'chatbubble-outline', label: 'Chat focus' },
          { icon: 'shield-checkmark-outline', label: 'Moderate' },
        ].map((b) => (
          <Pressable key={b.icon} style={styles.railBtn} accessibilityLabel={b.label}>
            <Ionicons name={b.icon as any} size={22} color="#fff" />
          </Pressable>
        ))}
      </View>

      {/* Chat feed */}
      <View style={[styles.chatWrap, { bottom: Math.max(insets.bottom, 40) + 96 }]}>
        {chat.map((m, i) => (
          <View key={m.id} style={styles.chatLine}>
            <Text numberOfLines={1}>
              <Text style={{ color: '#fff', fontWeight: '900' }}>{m.name} </Text>
              <Text style={{ color: 'rgba(255,255,255,0.92)' }}>{m.body}</Text>
            </Text>
          </View>
        ))}
        {chat.length === 0 ? (
          <View style={styles.chatLine}><Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Chat is quiet. Say hello to your fans.</Text></View>
        ) : null}
      </View>

      {/* Composer + End live */}
      <View style={[styles.footer, { bottom: Math.max(insets.bottom, 40) }]}>
        <View style={styles.footerRow}>
          <Pressable style={styles.moreBtn} accessibilityLabel="More options">
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18 }}>{'\u00b7\u00b7\u00b7'}</Text>
          </Pressable>
          <TextInput
            style={styles.hostInput}
            placeholder={'Reply to ' + (chat.length ? chat[chat.length - 1].name : 'your fans') + '\u2026'}
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={draft}
            onChangeText={(t) => setDraft(t.slice(0, 280))}
            onSubmitEditing={sendChat}
            returnKeyType="send"
          />
        </View>
        <Pressable onPress={endLive} disabled={ending} accessibilityLabel="End live">
          <LinearGradient colors={[LIVE_RED, '#C2185B'] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.endBtn, ending && { opacity: 0.7 }]}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18 }}>{ending ? 'Ending\u2026' : 'End live'}</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Session title watermark */}
      {session ? (
        <Text numberOfLines={1} style={[styles.titleWatermark, { top: insets.top + 64, color: colors.text }]}>
          {session.title}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14 },
  livePill: { backgroundColor: LIVE_RED, borderRadius: radii.full, paddingHorizontal: 12, paddingVertical: 6 },
  livePillText: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 0.6 },
  darkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radii.full,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  darkPillText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  timer: { color: '#fff', fontWeight: '900', fontSize: 15, marginLeft: 2 },
  goalCard: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radii.lg,
    padding: 14,
    marginHorizontal: 14,
    marginTop: 12,
  },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  goalLabel: { color: '#fff', fontWeight: '900', fontSize: 15 },
  goalValue: { color: '#fff', fontWeight: '800', fontSize: 14 },
  goalTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.22)', overflow: 'hidden' },
  goalFill: { height: '100%', borderRadius: 3, backgroundColor: GOLD },
  rail: { position: 'absolute', right: 14, gap: 14, alignItems: 'center' },
  railBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatWrap: { position: 'absolute', left: 16, right: 78, gap: 6 },
  chatLine: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  titleWatermark: { position: 'absolute', left: 16, right: 16, fontSize: 13, fontWeight: '800', opacity: 0.7 },
  footer: { position: 'absolute', left: 14, right: 14 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  moreBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostInput: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radii.full,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
  },
  endBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 17, borderRadius: radii.full },
});
