/** Live Session (immersive) - Rally design (mock 22)
 * Full-screen live view: host pill + LIVE + viewer count, Top Gifters
 * bar, gift burst overlay on stage, live chat with gold names, right
 * rail (like + share), and a composer with emoji + gold gift button.
 * Data: /api/live/:id, /chat, /leaderboard, /gift, /api/gifts/catalog.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GiftBurst } from '@/components/GiftBurst';
import { GiftTraySheet } from '@/components/GiftTraySheet';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { useShare } from '@/hooks/useShare';
import { radii } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const PURPLE = '#7C4DFF';
const LIVE_RED = '#EF5350';
const HEART_RED = '#F43F5E';

type Session = { id: string; title: string; kind: string; status: string; isPaused: boolean; viewerCount: number };
type ChatMsg = { id: string; body: string; name: string };
type BoardRow = { name: string; handle?: string | null; tokens: number };
type CatalogItem = { id: string; name: string; tokenCost: number };

function compact(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

function initials(name: string): string {
  return (name || '?').slice(0, 2).toUpperCase();
}

function elapsedStr(from: string | null, now: number): string {
  if (!from) return '';
  const secs = Math.max(0, Math.floor((now - new Date(from).getTime()) / 1000));
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m + ':' + (s < 10 ? '0' : '') + s;
}

const NAME_COLORS = [GOLD, '#4FC3F7', '#F48FB1', '#A5D6A7', '#CE93D8'];

export default function LiveSessionScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { impact } = useHaptics();
  const { success, error: errSound } = useSounds();
  const { shareMoment } = useShare();
  const router = useRouter();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [session, setSession] = useState<Session | null>(null);
  const [hostName, setHostName] = useState('');
  const [hostAvatar, setHostAvatar] = useState<string | null>(null);
  const [viewers, setViewers] = useState(0);
  const [board, setBoard] = useState<BoardRow[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendingGift, setSendingGift] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [burst, setBurst] = useState(false);
  const [burstInfo, setBurstInfo] = useState<{ title: string; sub: string } | null>(null);
  const [trayOpen, setTrayOpen] = useState(false);
  const [askJoin, setAskJoin] = useState(false);
  const [nowTs, setNowTs] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    try {
      const r = await api<{ session: Session; favorite?: { user?: { displayName?: string; avatarUrl?: string | null } } }>('/api/live/' + id, { skipAuth: true });
      setSession(r.session);
      setViewers(r.session.viewerCount || 0);
      const u = r.favorite && r.favorite.user;
      setHostName((u && u.displayName) || '');
      setHostAvatar((u && u.avatarUrl) || null);
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
      .then((c) => setCatalog(c.items || []))
      .catch(() => {});
  }, [loadSession]);

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

  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => { clearInterval(t); };
  }, []);

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

  async function sendGift(giftId: string, message: string, anonymous: boolean, quantity: number, giftName?: string) {
    if (sendingGift) return;
    setSendingGift(true);
    impact('medium');
    try {
      await api('/api/live/' + id + '/gift', {
        method: 'POST',
        body: JSON.stringify({ catalogItemId: giftId, message: message || undefined, isAnonymous: anonymous, quantity: quantity || 1 }),
      });
      setTrayOpen(false);
      setBurstInfo({
        title: 'You sent ' + (quantity > 1 ? '\u00d7' + quantity + ' ' : '') + (giftName || 'a gift'),
        sub: hostName ? 'to ' + hostName : '',
      });
      setBurst(true);
      success();
      impact('success');
      try {
        const raw = await AsyncStorage.getItem('rally.liveGiftsSent');
        const map = raw ? JSON.parse(raw) : {};
        map[String(id)] = (map[String(id)] || 0) + (quantity || 1);
        await AsyncStorage.setItem('rally.liveGiftsSent', JSON.stringify(map));
      } catch { /* local only */ }
      await loadLive();
    } catch (e: any) {
      errSound();
      impact('error');
      setErr(e.message || 'Gift failed');
    } finally {
      setSendingGift(false);
    }
  }

  function toggleLike() {
    impact('light');
    setLiked((v) => !v);
    setLikeCount((c) => c + (liked ? -1 : 1));
  }

  const isLive = session && session.status === 'live' && !session.isPaused;
  const authed = !!getToken();
  const chat = messages.slice(-4);
  const topGifters = board.slice(0, 3);
  const firstName = hostName ? hostName.split(' ')[0] : '';

  return (
    <View style={[styles.root, { backgroundColor: '#0B0812' }]}>
      <LinearGradient
        colors={['#241436', '#3A1D4E', '#1A0F26'] as [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)'] as [string, string]}
        style={styles.bottomShade}
      />

      {loading ? (
        <ActivityIndicator color={GOLD} style={{ flex: 1 }} />
      ) : !session ? (
        <View style={styles.centerWrap}>
          <Ionicons name="radio-outline" size={40} color={GOLD} />
          <Text style={styles.quietTitle}>{err || 'Session unavailable'}</Text>
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
            <Text style={styles.backBtnText}>Go back</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* Top bar */}
          <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
            <View style={styles.hostPill}>
              {hostAvatar ? (
                <Image source={{ uri: hostAvatar }} style={styles.hostAvatar} />
              ) : (
                <View style={[styles.hostAvatar, { backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={styles.hostInitials}>{initials(hostName || 'R')}</Text>
                </View>
              )}
              <Text numberOfLines={1} style={styles.hostName}>{hostName || 'Live'}</Text>
            </View>
            <View style={styles.livePill}>
              <Text style={styles.livePillText}>{isLive ? 'LIVE' : session.status === 'ended' ? 'ENDED' : 'PAUSED'}</Text>
            </View>
            <View style={styles.viewerPill}>
              <Ionicons name="people-outline" size={13} color="#fff" />
              <Text style={styles.viewerText}>{compact(viewers)}</Text>
            </View>
            {session && session.status === 'live' && (session as any).startedAt ? (
              <Text style={styles.timerText}>{elapsedStr((session as any).startedAt, nowTs)}</Text>
            ) : null}
          </View>

          {/* Top Gifters bar */}
          {topGifters.length > 0 ? (
            <View style={styles.giftersBar}>
              <Text style={styles.giftersLabel}>Top Gifters</Text>
              {topGifters.map((g, i) => (
                <View key={g.name + i} style={styles.gifter}>
                  <View style={[styles.gifterAvatar, { backgroundColor: NAME_COLORS[i % NAME_COLORS.length] }]}>
                    <Text style={styles.gifterInitials}>{initials(g.name)}</Text>
                  </View>
                  <Text style={styles.gifterTokens}>{compact(g.tokens)}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Stage / burst area */}
          <View style={[styles.stage, { height: height * 0.42 }]}>
            {burstInfo ? (
              <View style={styles.burstWrap} pointerEvents="none">
                <Ionicons name="ribbon" size={64} color={GOLD} />
                <Text style={styles.burstQty}>{'\u00d7' + (burstInfo.title.match(/\u00d7(\d+)/) ? burstInfo.title.match(/\u00d7(\d+)/)![1] : '1')}</Text>
                <Text style={styles.burstTitle}>{burstInfo.title}</Text>
                {burstInfo.sub ? <Text style={styles.burstSub}>{burstInfo.sub}</Text> : null}
              </View>
            ) : (
              <View style={styles.stageIdle}>
                <Ionicons name={session.kind === 'video' ? 'videocam' : 'mic'} size={34} color="rgba(255,255,255,0.85)" />
                <Text numberOfLines={2} style={styles.stageTitle}>{session.title}</Text>
              </View>
            )}
          </View>

          {/* Chat overlay */}
          <View style={[styles.chatWrap, { bottom: Math.max(insets.bottom, 40) + 74 }]}>
            {chat.map((m, i) => (
              <Text key={m.id} style={styles.chatLine} numberOfLines={2}>
                <Text style={{ color: NAME_COLORS[i % NAME_COLORS.length], fontWeight: '900' }}>{m.name} </Text>
                <Text style={{ color: '#fff' }}>{m.body}</Text>
              </Text>
            ))}
            {chat.length === 0 ? (
              <Text style={styles.chatEmpty}>{'Say hello' + (firstName ? ' to ' + firstName : '') + '.'}</Text>
            ) : null}
          </View>

          {/* Right rail */}
          <View style={[styles.rail, { bottom: Math.max(insets.bottom, 40) + 74 }]}>
            <Pressable style={styles.railBtn} onPress={() => { impact('light'); setAskJoin(true); }} accessibilityLabel="Ask to join">
              <Ionicons name="people" size={28} color={GOLD} />
              <Text style={styles.railLabel}>Join</Text>
            </Pressable>
            <Pressable style={styles.railBtn} onPress={toggleLike} accessibilityLabel="Like">
              <Ionicons name={liked ? 'heart' : 'heart'} size={34} color={HEART_RED} />
              <Text style={styles.railLabel}>{compact(18200 + likeCount)}</Text>
            </Pressable>
            <Pressable
              style={styles.railBtn}
              onPress={() => shareMoment(session.title, session.id)}
              accessibilityLabel="Share"
            >
              <Ionicons name="share-social-outline" size={30} color="#fff" />
              <Text style={styles.railLabel}>Share</Text>
            </Pressable>
          </View>

          {/* Composer */}
          <View style={[styles.composerRow, { bottom: Math.max(insets.bottom, 40) }]}>
            {session.status === 'ended' ? (
              <Pressable onPress={() => router.push({ pathname: '/live/ended', params: { id: String(id) } })} style={styles.loginBtn} accessibilityLabel="Session ended recap">
                <Text style={styles.loginText}>Session ended - see your recap</Text>
              </Pressable>
            ) : !authed ? (
              <Pressable onPress={() => router.push('/login')} style={styles.loginBtn} accessibilityLabel="Log in to join">
                <Text style={styles.loginText}>Log in to join the chat</Text>
              </Pressable>
            ) : (
              <>
                <View style={styles.composer}>
                  <TextInput
                    style={styles.composerInput}
                    placeholder={firstName ? 'Say something to ' + firstName + '...' : 'Say something...'}
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={draft}
                    onChangeText={(t) => setDraft(t.slice(0, 280))}
                    onSubmitEditing={sendChat}
                    returnKeyType="send"
                  />
                </View>
                <Pressable
                  style={styles.emojiBtn}
                  onPress={() => setDraft((d) => (d + '\u2764').slice(0, 280))}
                  accessibilityLabel="Add emoji"
                >
                  <Ionicons name="happy-outline" size={26} color="#fff" />
                </Pressable>
                <Pressable style={styles.giftBtn} onPress={() => setTrayOpen(true)} accessibilityLabel="Send a gift">
                  <Ionicons name="gift" size={22} color="#111" />
                </Pressable>
              </>
            )}
          </View>

          {err && session ? (
            <Text style={styles.errText}>{err}</Text>
          ) : null}
        </>
      )}

      {askJoin && session && session.status !== 'ended' ? (
        <Pressable style={styles.askOverlay} onPress={() => setAskJoin(false)}>
          <Pressable style={styles.askSheet} onPress={() => undefined}>
            <View style={styles.grabHandle} />
            <View style={styles.askIcon}>
              <Ionicons name="people" size={34} color={GOLD} />
            </View>
            <Text style={styles.askTitle}>{'Ask to join ' + (firstName || 'the host') + ' on stage'}</Text>
            <Text style={styles.askBody}>
              {(firstName || 'The host') + ' will see your name and can accept. You will be on camera and mic when you join.'}
            </Text>
            <Pressable
              onPress={() => {
                impact('medium');
                setAskJoin(false);
                Alert.alert('Hand raised', (firstName || 'The host') + ' will see your request. Hosts cannot accept hand-raises in-app yet, so keep an eye on the chat.');
              }}
              style={styles.askBtn}
              accessibilityLabel="Raise hand"
            >
              <Text style={styles.askBtnText}>Raise hand</Text>
            </Pressable>
            <Pressable onPress={() => setAskJoin(false)} style={{ alignItems: 'center', paddingVertical: 14 }} accessibilityLabel="Not now">
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '800', fontSize: 16 }}>Not now</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      ) : null}

      <GiftBurst visible={burst} onDone={() => setBurst(false)} />
      <GiftTraySheet
        visible={trayOpen}
        onClose={() => setTrayOpen(false)}
        name={hostName || 'this Favorite'}
        onSend={sendGift}
        sending={sendingGift}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bottomShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '40%' },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  quietTitle: { color: '#fff', fontSize: 16, fontWeight: '800', textAlign: 'center', paddingHorizontal: 30 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radii.full, paddingHorizontal: 22, paddingVertical: 11 },
  backBtnText: { color: '#fff', fontWeight: '800' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    zIndex: 5,
  },
  hostPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: radii.full,
    paddingLeft: 5,
    paddingRight: 14,
    paddingVertical: 5,
    maxWidth: 190,
  },
  hostAvatar: { width: 30, height: 30, borderRadius: 15 },
  hostInitials: { color: '#111', fontWeight: '900', fontSize: 11 },
  hostName: { color: '#fff', fontWeight: '800', fontSize: 14, flexShrink: 1 },
  livePill: { backgroundColor: LIVE_RED, borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 5 },
  livePillText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  viewerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 'auto',
  },
  viewerText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  giftersBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: radii.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 14,
    marginTop: 12,
    alignSelf: 'flex-start',
    zIndex: 5,
  },
  giftersLabel: { color: GOLD, fontWeight: '900', fontSize: 13 },
  gifter: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  gifterAvatar: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  gifterInitials: { color: '#111', fontWeight: '900', fontSize: 9 },
  gifterTokens: { color: '#fff', fontWeight: '800', fontSize: 13 },
  stage: { alignItems: 'center', justifyContent: 'center' },
  stageIdle: { alignItems: 'center', gap: 10, paddingHorizontal: 30 },
  stageTitle: { color: 'rgba(255,255,255,0.9)', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  burstWrap: { alignItems: 'center' },
  burstQty: { color: GOLD, fontSize: 40, fontWeight: '900', marginTop: 6, textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 8 },
  burstTitle: { color: '#fff', fontSize: 17, fontWeight: '900', marginTop: 8 },
  burstSub: { color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 3 },
  chatWrap: { position: 'absolute', left: 16, right: 90, gap: 6 },
  chatLine: { fontSize: 14, lineHeight: 19 },
  chatEmpty: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  rail: { position: 'absolute', right: 14, alignItems: 'center', gap: 22 },
  railBtn: { alignItems: 'center', gap: 4 },
  railLabel: { color: '#fff', fontSize: 12, fontWeight: '800' },
  composerRow: {
    position: 'absolute',
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  composer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: radii.full,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  composerInput: { color: '#fff', fontSize: 15, minHeight: 40, padding: 0 },
  emojiBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftBtn: {
    width: 52,
    height: 46,
    borderRadius: 16,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endedText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, textAlign: 'center', flex: 1 },
  loginBtn: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: radii.full, paddingVertical: 13, alignItems: 'center' },
  loginText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  errText: { color: LIVE_RED, fontSize: 12, textAlign: 'center', position: 'absolute', bottom: 110, left: 20, right: 20 },
  timerText: { color: 'rgba(255,255,255,0.85)', fontWeight: '900', fontSize: 14, marginLeft: 2 },
  askOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', zIndex: 60 },
  askSheet: { backgroundColor: '#16121F', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 10, paddingHorizontal: 20, paddingBottom: 30, alignItems: 'center' },
  grabHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)', marginBottom: 18 },
  askIcon: { width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(255,167,38,0.15)', alignItems: 'center', justifyContent: 'center' },
  askTitle: { color: '#fff', fontWeight: '900', fontSize: 22, textAlign: 'center', marginTop: 16 },
  askBody: { color: 'rgba(255,255,255,0.75)', fontSize: 15, lineHeight: 21, textAlign: 'center', marginTop: 8 },
  askBtn: { alignSelf: 'stretch', marginTop: 20 },
  askBtnText: { color: '#1A1206', fontWeight: '900', fontSize: 17, textAlign: 'center', backgroundColor: GOLD, borderRadius: radii.full, paddingVertical: 16, overflow: 'hidden' },
});
