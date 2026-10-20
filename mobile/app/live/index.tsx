/** Live Sessions
 * Real-time Gifts, live leaderboard, and host controls (pause / resume / end).
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable } from 'react-native';
import { Screen } from '@/components/Screen';
import { GradientButton, GlassCard, SectionHeader, EmptyState, Chip } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { api, getToken } from '@/lib/api';
import { spacing, radii, type as typo } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';

type Session = {
  id: string;
  title: string;
  kind: string;
  status: string;
  isPaused: boolean;
  viewerCount: number;
  favoriteId: string;
};

type CatalogItem = {
  id: string;
  name: string;
  tokenCost: number;
};

type BoardRow = {
  name: string;
  tokens: number;
};

export default function LiveScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [myFavId, setMyFavId] = useState<string | null>(null);
  const [active, setActive] = useState<Session | null>(null);
  const [board, setBoard] = useState<BoardRow[]>([]);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

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

  async function control(id: string, action: 'start' | 'pause' | 'resume' | 'end') {
    setActingId(id);
    setMsg(null);
    impact('medium');

    try {
      await api(`/api/live/${id}/${action}`, { method: 'POST' });
      setMsg({
        type: 'success',
        text: `Session ${action}${action === 'end' ? 'ed' : 'd'}`,
      });
      impact('success');
      await load();
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Action failed' });
    } finally {
      setActingId(null);
    }
  }

  async function openSession(s: Session) {
    setActive(s);
    setBoard([]);
    setMsg(null);

    try {
      if (getToken() && s.status !== 'ended') {
        await api(`/api/live/${s.id}/join`, { method: 'POST' });
      }
      const r = await api<{ leaderboard: BoardRow[] }>(
        `/api/live/${s.id}/leaderboard`,
        { skipAuth: true },
      );
      setBoard(r.leaderboard || []);
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Could not join session' });
    }
  }

  async function sendGift(itemId: string) {
    if (!active) return;

    setMsg(null);
    impact('medium');

    try {
      await api(`/api/live/${active.id}/gift`, {
        method: 'POST',
        body: JSON.stringify({ catalogItemId: itemId }),
      });
      setMsg({ type: 'success', text: 'Gift sent!' });
      impact('success');

      const r = await api<{ leaderboard: BoardRow[] }>(
        `/api/live/${active.id}/leaderboard`,
        { skipAuth: true },
      );
      setBoard(r.leaderboard || []);
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Gift failed' });
    }
  }

  return (
    <SwipeBack>
      <Screen refreshing={refreshing} onRefresh={load}>
        {/* Header */}
        <Text style={[styles.h1, { color: colors.text }]}>Live sessions</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Real-time Gifts, live leaderboard, and host pause controls.
        </Text>

        {/* Feedback */}
        {msg && (
          <View
            style={[
              styles.feedback,
              {
                backgroundColor:
                  msg.type === 'success'
                    ? colors.success + '18'
                    : colors.danger + '18',
              },
            ]}
          >
            <Text
              style={{
                color: msg.type === 'success' ? colors.success : colors.danger,
                fontWeight: '700',
                fontSize: 13,
              }}
            >
              {msg.text}
            </Text>
          </View>
        )}

        {/* Sessions list */}
        {sessions.length === 0 && !refreshing ? (
          <EmptyState
            icon="radio-outline"
            title="No live sessions"
            body="There are no live or scheduled sessions right now. Pull to refresh."
          />
        ) : (
          <View style={{ gap: 14 }}>
            {sessions.map((s) => {
              const isMine = myFavId === s.favoriteId;
              const isActive = active?.id === s.id;

              return (
                <GlassCard key={s.id}>
                  <Text style={[styles.sessionTitle, { color: colors.text }]}>
                    {s.title}
                  </Text>

                  <View style={styles.metaRow}>
                    <Chip label={s.kind} />
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor:
                            s.status === 'live'
                              ? colors.success + '20'
                              : s.status === 'ended'
                              ? colors.danger + '20'
                              : colors.primaryMuted,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color:
                            s.status === 'live'
                              ? colors.success
                              : s.status === 'ended'
                              ? colors.danger
                              : colors.primary,
                          fontSize: 12,
                          fontWeight: '700',
                          textTransform: 'capitalize',
                        }}
                      >
                        {s.status}
                        {s.isPaused ? ' · paused' : ''}
                      </Text>
                    </View>
                    <Text style={{ color: colors.muted, fontSize: 13 }}>
                      {s.viewerCount} viewers
                    </Text>
                  </View>

                  {/* Host controls */}
                  {isMine && s.status !== 'ended' && (
                    <View style={[styles.actions, { marginTop: 12 }]}>
                      {s.status === 'scheduled' && (
                        <GradientButton
                          label="Start"
                          size="sm"
                          onPress={() => control(s.id, 'start')}
                          loading={actingId === s.id}
                          disabled={!!actingId}
                        />
                      )}
                      {s.status === 'live' && (
                        <GradientButton
                          label="Pause gifting"
                          size="sm"
                          variant="ghost"
                          onPress={() => control(s.id, 'pause')}
                          loading={actingId === s.id}
                          disabled={!!actingId}
                        />
                      )}
                      {s.status === 'paused' && (
                        <GradientButton
                          label="Resume"
                          size="sm"
                          onPress={() => control(s.id, 'resume')}
                          loading={actingId === s.id}
                          disabled={!!actingId}
                        />
                      )}
                      <GradientButton
                        label="End"
                        size="sm"
                        variant="outline"
                        onPress={() => control(s.id, 'end')}
                        loading={actingId === s.id}
                        disabled={!!actingId}
                      />
                    </View>
                  )}

                  {/* Join / refresh */}
                  <View style={{ marginTop: 12 }}>
                    <GradientButton
                      label={isActive ? 'Refresh leaderboard' : 'Join & view leaderboard'}
                      size="sm"
                      variant={isActive ? 'ghost' : 'primary'}
                      onPress={() => openSession(s)}
                      fullWidth
                    />
                  </View>

                  {/* Expanded: leaderboard + gifts */}
                  {isActive && (
                    <View style={{ marginTop: 16 }}>
                      {board.length > 0 && (
                        <>
                          <SectionHeader title="Live leaderboard" />
                          <View style={{ gap: 8, marginBottom: 12 }}>
                            {board.map((b, i) => (
                              <View
                                key={`${b.name}-${i}`}
                                style={[
                                  styles.boardRow,
                                  {
                                    backgroundColor: colors.bg,
                                    borderColor: colors.border,
                                  },
                                ]}
                              >
                                <Text style={{ color: colors.primary, fontWeight: '800', width: 24 }}>
                                  {i + 1}
                                </Text>
                                <Text style={{ color: colors.text, flex: 1, fontWeight: '600' }}>
                                  {b.name}
                                </Text>
                                <Text style={{ color: colors.primary, fontWeight: '700' }}>
                                  {b.tokens}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </>
                      )}

                      {s.status === 'live' && !s.isPaused && getToken() && (
                        <>
                          <Text style={[styles.giftLabel, { color: colors.muted }]}>
                            Send a Gift
                          </Text>
                          <View style={styles.giftRow}>
                            {catalog.slice(0, 4).map((item) => (
                              <Pressable
                                key={item.id}
                                onPress={() => sendGift(item.id)}
                                style={({ pressed }) => [
                                  styles.giftBtn,
                                  {
                                    backgroundColor: colors.primaryMuted,
                                    borderColor: colors.border,
                                    opacity: pressed ? 0.75 : 1,
                                  },
                                ]}
                              >
                                <Text style={{ color: colors.text, fontWeight: '600', fontSize: 13 }}>
                                  {item.name}
                                </Text>
                                <Text style={{ color: colors.primary, fontSize: 12, marginTop: 2 }}>
                                  {item.tokenCost} tok
                                </Text>
                              </Pressable>
                            ))}
                          </View>
                        </>
                      )}
                    </View>
                  )}
                </GlassCard>
              );
            })}
          </View>
        )}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: {
    ...typo.h1,
    marginTop: spacing.sm,
    marginBottom: 6,
  },
  subtitle: {
    ...typo.body,
    marginBottom: spacing.lg,
    lineHeight: 21,
  },
  feedback: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  sessionTitle: {
    fontWeight: '800',
    fontSize: 17,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  boardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  giftLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
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
    paddingVertical: 10,
    minWidth: 90,
    alignItems: 'center',
  },
});
