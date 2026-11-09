/** Live Sessions - Rally design system
 * Gradient hero, LIVE status pills, host controls, gift grid
 * and a live leaderboard with gold rank badges.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { GiftBurst } from '@/components/GiftBurst';
import { GradientButton, GlassCard, EmptyState, Avatar } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { api, getToken } from '@/lib/api';
import { spacing, radii } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const PURPLE = '#7C4DFF';
const LIVE_RED = '#EF5350';

type Session = {
  id: string;
  title: string;
  kind: string;
  status: string;
  isPaused: boolean;
  viewerCount: number;
  favoriteId: string;
  startsAt?: string | null;
};

type CatalogItem = { id: string; name: string; tokenCost: number };

type BoardRow = { name: string; handle?: string | null; tokens: number };

const DONE_MSG: Record<string, string> = {
  start: 'Session started',
  pause: 'Gifting paused',
  resume: 'Session resumed',
  end: 'Session ended',
};

function whenText(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function LiveScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();
  const router = useRouter();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [myFavId, setMyFavId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [board, setBoard] = useState<BoardRow[]>([]);
  const [tab, setTab] = useState<'live' | 'upcoming'>('live');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [giftingId, setGiftingId] = useState<string | null>(null);
  const [burst, setBurst] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await api<{ sessions: Session[] }>('/api/live', { skipAuth: true });
      setSessions(r.sessions || []);
      const c = await api<{ items: CatalogItem[] }>('/api/gifts/catalog', { skipAuth: true });
      setCatalog(c.items || []);
      if (getToken()) {
        const me = await api<{ user: any }>('/api/auth/me');
        setMyFavId(me.user?.favoriteProfile?.id ?? null);
      }
    } catch {
      // offline
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function control(id: string, action: string) {
    setActingId(id);
    setMsg(null);
    impact('medium');
    try {
      await api('/api/live/' + id + '/' + action, { method: 'POST' });
      setMsg({ ok: true, text: DONE_MSG[action] || 'Done' });
      impact('success');
      await load();
    } catch (e: any) {
      setMsg({ ok: false, text: e.message || 'Action failed' });
    } finally {
      setActingId(null);
    }
  }

  async function openSession(s: Session) {
    setMsg(null);
    if (activeId === s.id) {
      setActiveId(null);
      return;
    }
    setActiveId(s.id);
    setBoard([]);
    impact('light');
    try {
      if (getToken() && s.status !== 'ended') {
        await api('/api/live/' + s.id + '/join', { method: 'POST' });
      }
      const r = await api<{ leaderboard: BoardRow[] }>('/api/live/' + s.id + '/leaderboard', { skipAuth: true });
      setBoard(r.leaderboard || []);
    } catch (e: any) {
      setMsg({ ok: false, text: e.message || 'Could not join session' });
    }
  }

  async function sendGift(s: Session, itemId: string) {
    setGiftingId(itemId);
    setMsg(null);
    impact('medium');
    try {
      await api('/api/live/' + s.id + '/gift', {
        method: 'POST',
        body: JSON.stringify({ catalogItemId: itemId }),
      });
      setBurst(true);
      setMsg({ ok: true, text: 'Gift sent' });
      impact('success');
      const r = await api<{ leaderboard: BoardRow[] }>('/api/live/' + s.id + '/leaderboard', { skipAuth: true });
      setBoard(r.leaderboard || []);
    } catch (e: any) {
      setMsg({ ok: false, text: e.message || 'Gift failed' });
    } finally {
      setGiftingId(null);
    }
  }

  const liveNow = sessions.filter((s) => s.status === 'live' || s.status === 'paused');
  const upcoming = sessions.filter((s) => s.status === 'scheduled');
  const list = tab === 'live' ? liveNow : upcoming;

  return (
    <SwipeBack>
      <Screen refreshing={refreshing} onRefresh={load}>
        {/* Hero */}
        <LinearGradient
          colors={[GOLD, GOLD_DEEP, PURPLE] as [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroRow}>
            <View style={styles.heroIcon}>
              <Ionicons name={'radio'} size={22} color={'#fff'} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.heroTitle}>LIVE SESSIONS</Text>
              <Text style={styles.heroSub}>Real-time gifts and leaderboards</Text>
            </View>
            <View style={styles.pulseWrap}>
              <View style={styles.pulseDot} />
              <Text style={styles.pulseText}>{liveNow.length}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Feedback */}
        {msg && (
          <View
            style={[
              styles.feedback,
              { backgroundColor: msg.ok ? colors.success + '18' : colors.danger + '18' },
            ]}
          >
            <Text style={{ color: msg.ok ? colors.success : colors.danger, fontWeight: '700', fontSize: 13 }}>
              {msg.text}
            </Text>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabs}>
          <Pressable
            onPress={() => {
              impact('light');
              setTab('live');
            }}
            style={[
              styles.tab,
              tab === 'live' ? styles.tabActive : { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            accessibilityLabel={'Live now'}
          >
            <Ionicons name={'radio-outline'} size={14} color={tab === 'live' ? '#111' : colors.muted} />
            <Text style={[styles.tabText, { color: tab === 'live' ? '#111' : colors.muted }]}>Live now</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              impact('light');
              setTab('upcoming');
            }}
            style={[
              styles.tab,
              tab === 'upcoming' ? styles.tabActive : { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            accessibilityLabel={'Upcoming sessions'}
          >
            <Ionicons name={'time-outline'} size={14} color={tab === 'upcoming' ? '#111' : colors.muted} />
            <Text style={[styles.tabText, { color: tab === 'upcoming' ? '#111' : colors.muted }]}>Upcoming</Text>
          </Pressable>
        </View>

        {/* Sessions */}
        {list.length === 0 && !refreshing ? (
          <EmptyState
            icon={tab === 'live' ? 'radio-outline' : 'time-outline'}
            title={tab === 'live' ? 'Nothing is live right now' : 'No sessions scheduled'}
            body={
              tab === 'live'
                ? 'When a Favorite goes live it appears here. Pull to refresh.'
                : 'Scheduled sessions show up here with their start time.'
            }
          />
        ) : (
          <View style={{ gap: 14, marginBottom: spacing.lg }}>
            {list.map((s) => {
              const isMine = !!myFavId && myFavId === s.favoriteId;
              const isActive = activeId === s.id;
              const isLive = s.status === 'live';
              const pillBg = isLive
                ? LIVE_RED + '22'
                : s.status === 'paused'
                ? GOLD + '22'
                : colors.primaryMuted;
              const pillColor = isLive ? LIVE_RED : s.status === 'paused' ? GOLD_DEEP : colors.primary;
              const pillLabel = isLive ? (s.isPaused ? 'PAUSED' : 'LIVE') : s.status === 'paused' ? 'PAUSED' : 'SCHEDULED';
              return (
                <GlassCard key={s.id} padded={false}>
                  <Pressable onPress={() => openSession(s)} style={styles.cardTop}>
                    <View
                      style={[
                        styles.kindBadge,
                        { backgroundColor: s.kind === 'video' ? PURPLE + '22' : GOLD + '22' },
                      ]}
                    >
                      <Ionicons
                        name={s.kind === 'video' ? 'videocam' : 'mic'}
                        size={17}
                        color={s.kind === 'video' ? PURPLE : GOLD}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text numberOfLines={1} style={[styles.cardTitle, { color: colors.text }]}>
                        {s.title}
                      </Text>
                      <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                        {s.kind === 'video' ? 'Video' : 'Audio'} {'\u00b7'} {s.viewerCount} watching
                        {s.startsAt && !isLive ? ' \u00b7 ' + whenText(s.startsAt) : ''}
                      </Text>
                    </View>
                    <View style={[styles.pill, { backgroundColor: pillBg }]}>
                      {isLive && !s.isPaused && <View style={styles.liveDot} />}
                      <Text style={[styles.pillText, { color: pillColor }]}>{pillLabel}</Text>
                    </View>
                  </Pressable>

                  {/* Host controls */}
                  {isMine && s.status !== 'ended' && (
                    <View style={[styles.actions, { paddingHorizontal: 14, paddingTop: 12 }]}>
                      {s.status === 'scheduled' && (
                        <GradientButton
                          label={'Start'}
                          icon={'play'}
                          size={'sm'}
                          onPress={() => control(s.id, 'start')}
                          loading={actingId === s.id}
                          disabled={!!actingId}
                        />
                      )}
                      {s.status === 'live' && (
                        <GradientButton
                          label={'Pause gifting'}
                          icon={'pause'}
                          size={'sm'}
                          variant={'ghost'}
                          onPress={() => control(s.id, 'pause')}
                          loading={actingId === s.id}
                          disabled={!!actingId}
                        />
                      )}
                      {s.status === 'paused' && (
                        <GradientButton
                          label={'Resume'}
                          icon={'play'}
                          size={'sm'}
                          onPress={() => control(s.id, 'resume')}
                          loading={actingId === s.id}
                          disabled={!!actingId}
                        />
                      )}
                      <GradientButton
                        label={'End'}
                        icon={'stop'}
                        size={'sm'}
                        variant={'outline'}
                        onPress={() => control(s.id, 'end')}
                        loading={actingId === s.id}
                        disabled={!!actingId}
                      />
                    </View>
                  )}

                  {/* Expanded: leaderboard + gifts */}
                  {isActive && (
                    <View style={styles.expanded}>
                      <View style={{ marginBottom: 12 }}>
                        <GradientButton
                          label={'Open session'}
                          icon={'chevron-forward'}
                          size={'sm'}
                          onPress={() => router.push(('/live/' + s.id) as any)}
                        />
                      </View>
                      {board.length > 0 ? (
                        <Text style={[styles.sectionLabel, { color: colors.muted }]}>LIVE LEADERBOARD</Text>
                      ) : (
                        <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 10 }}>
                          No gifts yet. Be the first to support this session.
                        </Text>
                      )}
                      <View style={{ gap: 8, marginBottom: 14 }}>
                        {board.map((b, i) => (
                          <View key={b.name + '-' + i} style={[styles.boardRow, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                            <View style={[styles.rankBadge, i < 3 && { backgroundColor: GOLD }]}>
                              <Text style={{ color: i < 3 ? '#111' : colors.muted, fontWeight: '800', fontSize: 12 }}>
                                {i + 1}
                              </Text>
                            </View>
                            <Avatar name={b.name} size={30} ring={i < 3} uri={null} />
                            <View style={{ flex: 1, marginLeft: 10 }}>
                              <Text numberOfLines={1} style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>
                                {b.name}
                              </Text>
                              {b.handle ? (
                                <Text style={{ color: colors.muted, fontSize: 12 }}>{'@' + b.handle}</Text>
                              ) : null}
                            </View>
                            <View style={styles.tokenBadge}>
                              <Text style={styles.tokenBadgeText}>{b.tokens} T</Text>
                            </View>
                          </View>
                        ))}
                      </View>

                      {isLive && !s.isPaused ? (
                        getToken() ? (
                          <>
                            <Text style={[styles.sectionLabel, { color: colors.muted }]}>SEND A GIFT</Text>
                            <View style={styles.giftRow}>
                              {catalog.slice(0, 6).map((item) => (
                                <Pressable
                                  key={item.id}
                                  onPress={() => sendGift(s, item.id)}
                                  disabled={!!giftingId}
                                  style={({ pressed }) => [
                                    styles.giftBtn,
                                    { backgroundColor: colors.surfaceElevated, borderColor: colors.border, opacity: pressed ? 0.75 : 1 },
                                  ]}
                                >
                                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }} numberOfLines={1}>
                                    {item.name}
                                  </Text>
                                  <Text style={{ color: GOLD, fontSize: 12, marginTop: 2, fontWeight: '700' }}>
                                    {item.tokenCost} T
                                  </Text>
                                </Pressable>
                              ))}
                            </View>
                          </>
                        ) : (
                          <Text style={{ color: colors.muted, fontSize: 13 }}>Log in to send gifts during this session.</Text>
                        )
                      ) : (
                        <Text style={{ color: GOLD, fontSize: 13, fontWeight: '700' }}>
                          {s.isPaused ? 'Gifting is paused by the host.' : 'Gifts open when the session goes live.'}
                        </Text>
                      )}
                    </View>
                  )}
                </GlassCard>
              );
            })}
          </View>
        )}
        <GiftBurst visible={burst} onDone={() => setBurst(false)} />
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radii.lg,
    padding: 16,
    marginBottom: spacing.md,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 20,
    letterSpacing: 0.4,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 12,
    marginTop: 2,
  },
  pulseWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  pulseText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
  feedback: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  tabActive: {
    backgroundColor: GOLD,
    borderColor: 'transparent',
  },
  tabText: {
    fontWeight: '800',
    fontSize: 13,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  kindBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontWeight: '800',
    fontSize: 16,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: LIVE_RED,
  },
  pillText: {
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.4,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  expanded: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  boardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: 'rgba(128,128,128,0.18)',
  },
  tokenBadge: {
    backgroundColor: GOLD + '22',
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tokenBadgeText: {
    color: GOLD_DEEP,
    fontWeight: '800',
    fontSize: 12,
  },
  giftRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  giftBtn: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    minWidth: 92,
    alignItems: 'center',
  },
});
