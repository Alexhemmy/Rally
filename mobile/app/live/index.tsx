import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable } from 'react-native';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { api, getToken } from '@/lib/api';
import { colors, spacing, radii } from '@/constants/theme';
import { SwipeBack } from '@/components/SwipeBack';

type Session = { id: string; title: string; kind: string; status: string; isPaused: boolean; viewerCount: number; favoriteId: string };
type CatalogItem = { id: string; name: string; tokenCost: number };
type BoardRow = { name: string; tokens: number };

export default function LiveScreen() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [myFavId, setMyFavId] = useState<string | null>(null);
  const [active, setActive] = useState<Session | null>(null);
  const [board, setBoard] = useState<BoardRow[]>([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

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
    } catch { /* offline */ } finally { setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function control(id: string, action: string) {
    setError(''); setMsg('');
    try {
      await api('/api/live/' + id + '/' + action, { method: 'POST' });
      setMsg('Session ' + action + (action === 'end' ? 'ed' : 'd'));
      load();
    } catch (e: any) { setError(e.message); }
  }

  async function openSession(s: Session) {
    setActive(s); setBoard([]);
    try {
      if (getToken() && s.status !== 'ended') {
        await api('/api/live/' + s.id + '/join', { method: 'POST' });
      }
      const r = await api<{ leaderboard: BoardRow[] }>('/api/live/' + s.id + '/leaderboard', { skipAuth: true });
      setBoard(r.leaderboard || []);
    } catch (e: any) { setError(e.message); }
  }

  async function sendGift(itemId: string) {
    if (!active) return;
    setError(''); setMsg('');
    try {
      await api('/api/live/' + active.id + '/gift', { method: 'POST', body: JSON.stringify({ catalogItemId: itemId }) });
      setMsg('Gift sent!');
      const r = await api<{ leaderboard: BoardRow[] }>('/api/live/' + active.id + '/leaderboard', { skipAuth: true });
      setBoard(r.leaderboard || []);
    } catch (e: any) { setError(e.message); }
  }

  return (
    <SwipeBack>
      <Screen refreshing={refreshing} onRefresh={load}>
        <Text style={styles.h1}>Live sessions</Text>
        <Text style={styles.muted}>Real-time Gifts, live leaderboard, host pause switch (GFT-10).</Text>
        {!!msg && <Text style={styles.ok}>{msg}</Text>}
        {!!error && <Text style={styles.err}>{error}</Text>}
        {sessions.map((s) => {
          const mine = myFavId === s.favoriteId;
          return (
            <View key={s.id} style={styles.card}>
              <Text style={styles.name}>{s.title}</Text>
              <Text style={styles.badge}>{s.kind} · {s.status}{s.isPaused ? ' · gifting paused' : ''} · {s.viewerCount} viewers</Text>
              {mine && (
                <View style={styles.row}>
                  {s.status === 'scheduled' && <PrimaryButton label="Start" onPress={() => control(s.id, 'start')} />}
                  {s.status === 'live' && <PrimaryButton label="Pause gifting" variant="ghost" onPress={() => control(s.id, 'pause')} />}
                  {s.status === 'paused' && <PrimaryButton label="Resume" onPress={() => control(s.id, 'resume')} />}
                  {s.status !== 'ended' && <PrimaryButton label="End" variant="ghost" onPress={() => control(s.id, 'end')} />}
                </View>
              )}
              <PrimaryButton label={active?.id === s.id ? 'Refresh' : 'Join & leaderboard'} variant="ghost" onPress={() => openSession(s)} />
              {active?.id === s.id && (
                <View style={{ marginTop: 10 }}>
                  {board.length > 0 && (
                    <View>
                      <Text style={styles.name}>Live leaderboard</Text>
                      {board.map((b, i) => (
                        <Text key={i} style={styles.muted}>{i + 1}. {b.name} — {b.tokens} tokens</Text>
                      ))}
                    </View>
                  )}
                  {s.status === 'live' && !s.isPaused && getToken() && (
                    <View style={[styles.row, { marginTop: 10 }]}>
                      {catalog.slice(0, 4).map((c) => (
                        <Pressable key={c.id} style={styles.giftBtn} onPress={() => sendGift(c.id)}>
                          <Text style={styles.giftText}>{c.name} ({c.tokenCost})</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}
        {sessions.length === 0 && !refreshing && (
          <Text style={styles.muted}>No live or scheduled sessions right now.</Text>
        )}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: spacing.sm, marginBottom: 8 },
  muted: { color: colors.muted, marginBottom: 8, fontSize: 14 },
  name: { color: colors.text, fontWeight: '700', fontSize: 16, marginBottom: 4 },
  badge: { color: colors.primaryHover, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  ok: { color: '#16a34a', marginBottom: 8 },
  err: { color: colors.danger, marginBottom: 8 },
  card: {
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1,
    borderColor: colors.border, padding: spacing.md, marginBottom: 10,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  giftBtn: {
    backgroundColor: colors.primaryMuted, borderRadius: radii.sm, borderWidth: 1,
    borderColor: colors.border, paddingHorizontal: 10, paddingVertical: 8,
  },
  giftText: { color: colors.text, fontSize: 13 },
});
