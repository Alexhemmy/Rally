/** Community Chat (UX 43) - Rally design
 * A Favorite's room chat, running on the live-session chat API
 * (GET/POST /api/live/:id/chat). Pinned messages, translations,
 * in-chat polls and gift events arrive with the chat backend.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, StyleSheet, View, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const TEAL = '#34D399';

type Msg = { id: string; body: string; name: string; createdAt: string };

const NAME_COLORS = [GOLD, '#4FC3F7', '#F48FB1', '#A5D6A7', '#CE93D8'];
const AVATAR_COLORS = ['#F4511E', '#00BCD4', '#7C4DFF', '#5C6BC0', '#AB47BC'];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0] || 'F')[0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

function clock(iso: string): string {
  const d = new Date(iso);
  if (!d.getTime()) return '';
  const h = d.getHours();
  const m = d.getMinutes();
  return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
}

export default function CommunityChatScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId?: string; name?: string }>();
  const { impact } = useHaptics();
  const { success, error: errSound } = useSounds();
  const scrollRef = useRef<ScrollView>(null);

  const sessionId = params.sessionId ? String(params.sessionId) : '';
  const [roomName, setRoomName] = useState(params.name ? String(params.name) : 'Community chat');
  const [viewers, setViewers] = useState(0);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [authed, setAuthed] = useState(false);

  const load = useCallback(async () => {
    if (!sessionId) return;
    try {
      const r: any = await api('/api/live/' + sessionId, { skipAuth: true });
      if (r.session) {
        setViewers(r.session.viewerCount || 0);
        if (r.favorite && r.favorite.displayName) setRoomName(String(params.name || r.favorite.displayName) + "'s room");
      }
    } catch { /* offline */ }
    try {
      const c: any = await api('/api/live/' + sessionId + '/chat', { skipAuth: true });
      setMessages(c.messages || []);
    } catch { /* chat not available yet */ }
  }, [sessionId, params.name]);

  useEffect(() => {
    setAuthed(Boolean(getToken()));
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollToEnd({ animated: false });
    }, 300);
    return () => clearTimeout(t);
  }, [messages.length]);

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    impact('light');
    try {
      await api('/api/live/' + sessionId + '/chat', { method: 'POST', body: JSON.stringify({ body }) });
      setDraft('');
      success();
      await load();
    } catch (e: any) {
      errSound();
      impact('error');
    } finally {
      setSending(false);
    }
  }

  return (
    <SwipeBack>
      <Screen>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <View style={[styles.roomAvatar, { backgroundColor: GOLD }]}>
            <Text style={styles.roomInitials}>{initials(roomName)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.roomName, { color: colors.text }]} numberOfLines={1}>{roomName}</Text>
            <Text style={{ color: TEAL, fontSize: 12, fontWeight: '700' }}>
              {viewers.toLocaleString('en-US')} in the room
            </Text>
          </View>
          <Pressable
            onPress={() => router.push(sessionId ? '/live/' + sessionId : '/live')}
            hitSlop={8}
            accessibilityLabel="Open the live session"
          >
            <Ionicons name="radio-outline" size={24} color={colors.text} />
          </Pressable>
        </View>

        {!sessionId ? (
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: spacing.lg }}>
            Open a community chat from a Favorite's live session.
          </Text>
        ) : (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
              {/* Honest scope note */}
              <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Ionicons name="information-circle-outline" size={16} color={TEAL} />
                <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                  Be kind to each other here. Pinned messages, translations and in-chat polls arrive with the chat backend.
                </Text>
              </View>

              {messages.length === 0 ? (
                <Text style={{ color: colors.muted, fontSize: 14, marginTop: spacing.md }}>No messages yet. Say hello.</Text>
              ) : (
                messages.map((m, i) => {
                  const accent = NAME_COLORS[i % NAME_COLORS.length];
                  return (
                    <View key={m.id} style={styles.msgRow}>
                      <View style={[styles.msgAvatar, { backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }]}>
                        <Text style={styles.msgInitials}>{initials(m.name)}</Text>
                      </View>
                      <View style={[styles.bubble, { backgroundColor: colors.surfaceElevated }]}>
                        <Text style={{ color: accent, fontWeight: '800', fontSize: 14 }}>{m.name}</Text>
                        <Text style={{ color: colors.text, fontSize: 15, lineHeight: 21, marginTop: 2 }}>{m.body}</Text>
                        <Text style={{ color: colors.muted, fontSize: 11, alignSelf: 'flex-end', marginTop: 4 }}>{clock(m.createdAt)}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Composer */}
            <View style={[styles.composerRow, { borderTopColor: colors.border }]}>
              {authed ? (
                <>
                  <View style={[styles.composer, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                    <TextInput
                      style={[styles.composerInput, { color: colors.text }]}
                      placeholder="Message the room…"
                      placeholderTextColor={colors.muted}
                      value={draft}
                      onChangeText={(t) => setDraft(t.slice(0, 280))}
                      onSubmitEditing={send}
                      returnKeyType="send"
                    />
                  </View>
                  <Pressable onPress={send} disabled={sending} style={styles.sendBtn} accessibilityLabel="Send">
                    <Ionicons name="send" size={20} color="#111" />
                  </Pressable>
                </>
              ) : (
                <Pressable onPress={() => router.push('/login')} style={[styles.loginBtn, { borderColor: GOLD }]} accessibilityLabel="Log in to join">
                  <Text style={{ color: GOLD, fontWeight: '800', fontSize: 14 }}>Log in to join the chat</Text>
                </Pressable>
              )}
            </View>
          </KeyboardAvoidingView>
        )}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.sm },
  roomAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  roomInitials: { color: '#111', fontWeight: '900', fontSize: 15 },
  roomName: { fontSize: 17, fontWeight: '900' },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: radii.lg, padding: 12, marginTop: spacing.xs },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 12 },
  msgAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  msgInitials: { color: '#fff', fontWeight: '900', fontSize: 11 },
  bubble: { maxWidth: '78%', borderRadius: radii.lg, padding: 12 },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    paddingBottom: 4,
  },
  composer: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radii.full, paddingHorizontal: 16 },
  composerInput: { flex: 1, fontSize: 15, minHeight: 42, padding: 0 },
  sendBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' },
  loginBtn: { flex: 1, borderWidth: 1.5, borderRadius: radii.full, paddingVertical: 13, alignItems: 'center' },
});
