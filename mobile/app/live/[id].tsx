/** Live Session (in-session) - Rally design
 * Immersive session screen: LIVE header with viewer count, stage hero,
 * quick gift row, Top Gifters board, and live chat (polls /chat and
 * /leaderboard). Join increments the viewer count.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { GlassCard, Avatar, EmptyState } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { GiftBurst } from '@/components/GiftBurst';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const PURPLE = '#7C4DFF';
const LIVE_RED = '#EF5350';

type Session = { id: string; title: string; kind: string; status: string; isPaused: boolean; viewerCount: number; streamUrl?: string | null };
type ChatMsg = { id: string; body: string; name: string; handle?: string | null; isAnonymous?: boolean; createdAt?: string };
type BoardRow = { name: string; handle?: string | null; tokens: number };
type CatalogItem = { id: string; name: string; tokenCost: number };

export default function LiveSessionScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { impact } = useHaptics();
  const { success, error: errSound } = useSounds();
  const router = useRouter();
  const chatRef = useRef<ScrollView>(null);

  const [session, setSession] = useState<Session | null>(null);
  const [hostName, setHostName] = useState('');
  const [viewers, setViewers] = useState(0);
  const [board, setBoard] = useState<BoardRow[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [giftingId, setGiftingId] = useState<string | null>(null);
  const [burst, setBurst] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    try {
      const r = await api<{ session: Session; favorite?: { displayName: string; handle: string } }>( '/api/live/' + id, { skipAuth: true });
      setSession(r.session);
      setViewers(r.session.viewerCount || 0);
      setHostName((r.favorite && r.favorite.displayName) || '');
      if (getToken() && r.session.status !== 'ended') {
        const j = await api<{ viewerCount: number }>('/api/live/' + id + '/join', { method: 'POST' });
        setViewers(j.viewerCount || 0);
      }
    } catch (e: any) {
      setErr(e.message || 'Could not load session');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadLive = useCallback(async () => {
    try {
      const c = await api<{ messages: ChatMsg[] }>('/api/live/' + id + '/chat', { skipAuth: true });
      setMessages(c.messages || []);
    } catch { /* chat not available yet */ }
    try {
      const b = await api<{ leaderboard: BoardRow[] }>('/api/live/' + id + '/leaderboard', { skipAuth: true });
      setBoard(b.leaderboard || []);
    } catch { /* offline */ }
  }, [id]);

  useEffect(() => {
    loadSession();
    api<{ items: CatalogItem[] }>('/api/gifts/catalog', { skipAuth: true })
      .then((c) => setCatalog((c.items || []).slice(0, 4)))
      .catch(() => {});
  }, [loadSession]);

  // Poll chat + leaderboard while mounted
  useEffect(() => {
    let alive = true;
    let timer: any;
    async function tick() {
      if (!alive) return;
      await loadLive();
      if (alive) timer = setTimeout(tick, 6000);
    }
    tick();
    return () => { alive = false; if (timer) clearTimeout(timer); };
  }, [loadLive]);

  async function sendChat() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    impact('light');
    try {
      await api('/api/live/' + id + '/chat', { method: 'POST', body: JSON.stringify({ body }) });
      setDraft('');
      success();
      await loadLive();
    } catch (e: any) {
      errSound();
      impact('error');
      setErr(e.message || 'Could not send message');
    } finally {
      setSending(false);
    }
  }

  async function sendGift(itemId: string) {
    if (giftingId) return;
    setGiftingId(itemId);
    impact('medium');
    try {
      await api('/api/live/' + id + '/gift', { method: 'POST', body: JSON.stringify({ catalogItemId: itemId }) });
      setBurst(true);
      success();
      impact('success');
      await loadLive();
    } catch (e: any) {
      errSound();
      impact('error');
      setErr(e.message || 'Gift failed');
    } finally {
      setGiftingId(null);
    }
  }

  const isLive = session && session.status === 'live' && !session.isPaused;
  const ended = session && session.status === 'ended';
  const authed = !!getToken();

  return (
    <SwipeBack>
      <Screen>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel={'Back'}>
            <Ionicons name={'chevron-back'} size={26} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text numberOfLines={1} style={[styles.h1, { color: colors.text }]}>
              {session ? session.title : 'Live session'}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 1 }}>
              {hostName ? 'with ' + hostName : ''}
            </Text>
          </View>
          <View style={[styles.viewerPill, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Ionicons name={'eye-outline'} size={13} color={colors.muted} />
            <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>{viewers}</Text>
          </View>
          <View style={[styles.livePill, { backgroundColor: ended ? colors.border : LIVE_RED }]}>
            {isLive && <View style={styles.liveDot} />}
            <Text style={styles.livePillText}>{ended ? 'ENDED' : session && session.isPaused ? 'PAUSED' : 'LIVE'}</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={GOLD} style={{ marginTop: 60 }} />
        ) : !session ? (
          <EmptyState icon={'radio-outline'} title={'Session unavailable'} body={err || 'This session could not be loaded.'} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
            {/* Stage hero */}
            <LinearGradient
              colors={[PURPLE, GOLD_DEEP, GOLD] as [string, string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.stage}
            >
              <View style={styles.stageBadge}>
                <Ionicons name={session.kind === 'video' ? 'videocam' : 'mic'} size={30} color={'#fff'} />
              </View>
              <Text style={styles.stageTitle}>{session.title}</Text>
              <Text style={styles.stageSub}>
                {session.kind === 'video' ? 'Video session' : 'Audio session'} {'\u00b7'} {viewers} watching
              </Text>
              {session.streamUrl ? (
                <View style={styles.streamRow}>
                  <Ionicons name={'link-outline'} size={13} color={'#fff'} />
                  <Text numberOfLines={1} style={styles.streamText}>{session.streamUrl}</Text>
                </View>
              ) : null}
            </LinearGradient>

            {/* Quick gifts */}
            {isLive && authed ? (
              <View style={styles.giftRow}>
                {catalog.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => sendGift(item.id)}
                    disabled={!!giftingId}
                    style={({ pressed }) => [
                      styles.giftBtn,
                      { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.75 : 1 },
                    ]}
                  >
                    <Text numberOfLines={1} style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>{item.name}</Text>
                    <Text style={{ color: GOLD, fontSize: 12, marginTop: 2, fontWeight: '700' }}>{item.tokenCost} T</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {/* Top gifters */}
            <GlassCard style={{ marginTop: spacing.md }} padded={false}>
              <View style={styles.cardPad}>
                <Text style={[styles.sectionLabel, { color: colors.muted }]}>TOP GIFTERS</Text>
                {board.length === 0 ? (
                  <Text style={{ color: colors.muted, fontSize: 13 }}>No gifts yet. Be the first to support this session.</Text>
                ) : (
                  <View style={{ gap: 8 }}>
                    {board.slice(0, 10).map((b, i) => (
                      <View key={b.name + '-' + i} style={[styles.boardRow, { borderColor: colors.border }]}>
                        <View style={[styles.rankBadge, i < 3 && { backgroundColor: GOLD }]}>
                          <Text style={{ color: i < 3 ? '#111' : colors.muted, fontWeight: '800', fontSize: 12 }}>{i + 1}</Text>
                        </View>
                        <Avatar name={b.name} size={30} ring={i < 3} uri={null} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text numberOfLines={1} style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>{b.name}</Text>
                          {b.handle ? <Text style={{ color: colors.muted, fontSize: 12 }}>{'@' + b.handle}</Text> : null}
                        </View>
                        <View style={styles.tokenBadge}>
                          <Text style={styles.tokenBadgeText}>{b.tokens} T</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </GlassCard>

            {/* Live chat */}
            <GlassCard style={{ marginTop: spacing.md }} padded={false}>
              <View style={styles.cardPad}>
                <View style={styles.chatHead}>
                  <Text style={[styles.sectionLabel, { color: colors.muted, marginBottom: 0 }]}>LIVE CHAT</Text>
                  {isLive ? (
                    <View style={[styles.chatDotWrap, { backgroundColor: LIVE_RED + '22' }]}>
                      <View style={styles.liveDot} />
                      <Text style={{ color: LIVE_RED, fontSize: 11, fontWeight: '800' }}>streaming</Text>
                    </View>
                  ) : null}
                </View>
                <ScrollView
                  ref={chatRef}
                  style={{ maxHeight: 280 }}
                  onContentSizeChange={() => chatRef.current && chatRef.current.scrollToEnd({ animated: false })}
                  showsVerticalScrollIndicator={false}
                >
                  {messages.length === 0 ? (
                    <Text style={{ color: colors.muted, fontSize: 13, paddingVertical: 10 }}>
                      No messages yet. Say hello.
                    </Text>
                  ) : (
                    messages.map((m) => (
                      <View key={m.id} style={styles.chatMsg}>
                        <Avatar name={m.name} size={26} uri={null} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '800' }}>
                            {m.name}
                            {m.handle ? <Text style={{ color: colors.muted }}> {'\u00b7'} @{m.handle}</Text> : null}
                          </Text>
                          <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>{m.body}</Text>
                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>

                {/* Composer */}
                {ended ? (
                  <Text style={{ color: colors.muted, fontSize: 13, marginTop: 10 }}>This session has ended.</Text>
                ) : !authed ? (
                  <Text style={{ color: colors.muted, fontSize: 13, marginTop: 10 }}>Log in to join the chat.</Text>
                ) : (
                  <View style={[styles.composer, { borderColor: colors.border, backgroundColor: colors.bg }]}>
                    <TextInput
                      style={[styles.composerInput, { color: colors.text }]}
                      placeholder={'Say something...'}
                      placeholderTextColor={colors.muted}
                      value={draft}
                      onChangeText={(t) => setDraft(t.slice(0, 280))}
                      maxLength={280}
                      onSubmitEditing={sendChat}
                      returnKeyType={'send'}
                    />
                    <Pressable onPress={sendChat} disabled={sending || !draft.trim()} style={[styles.sendBtn, (!draft.trim() || sending) && { opacity: 0.4 }]} accessibilityLabel={'Send message'}>
                      <Ionicons name={'send'} size={17} color={'#111'} />
                    </Pressable>
                  </View>
                )}
              </View>
            </GlassCard>

            {err ? (
              <Text style={{ color: colors.danger, fontSize: 12, marginTop: 10, textAlign: 'center' }}>{err}</Text>
            ) : null}
          </ScrollView>
        )}
        <GiftBurst visible={burst} onDone={() => setBurst(false)} />
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  h1: { fontSize: 18, fontWeight: '900' },
  viewerPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: radii.full, paddingHorizontal: 9, paddingVertical: 5 },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radii.full, paddingHorizontal: 9, paddingVertical: 5 },
  livePillText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: LIVE_RED },
  stage: { borderRadius: radii.lg, padding: 22, alignItems: 'center' },
  stageBadge: { width: 62, height: 62, borderRadius: 31, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  stageTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 12, textAlign: 'center' },
  stageSub: { color: 'rgba(255,255,255,0.88)', fontSize: 12, marginTop: 4 },
  streamRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 5 },
  streamText: { color: '#fff', fontSize: 11, maxWidth: 220 },
  giftRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.md },
  giftBtn: { borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 9, minWidth: 88, alignItems: 'center' },
  cardPad: { padding: 14 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
  boardRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radii.md, paddingVertical: 8, paddingHorizontal: 10 },
  rankBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10, backgroundColor: 'rgba(128,128,128,0.18)' },
  tokenBadge: { backgroundColor: GOLD + '22', borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 4 },
  tokenBadgeText: { color: GOLD_DEEP, fontWeight: '800', fontSize: 12 },
  chatHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  chatDotWrap: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radii.full, paddingHorizontal: 8, paddingVertical: 4 },
  chatMsg: { flexDirection: 'row', paddingVertical: 7 },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: radii.full, paddingHorizontal: 14, paddingVertical: 4, marginTop: 10 },
  composerInput: { flex: 1, fontSize: 14, minHeight: 38 },
  sendBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' },
});
