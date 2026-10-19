import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SwipeBack } from '@/components/SwipeBack';
import { api } from '@/lib/api';
import { colors, spacing, radii } from '@/constants/theme';

type FaceOff = { id: string; question: string; favoriteAId: string; votesA: number; votesB: number; closesAt: string };
type Rivalry = {
  id: string;
  favoriteA: { name: string | null };
  favoriteB: { name: string | null };
  status: string;
  heatLevel: number;
  summary: string | null;
  faceOffs: FaceOff[];
};

export default function Page() {
  const [rivalries, setRivalries] = useState<Rivalry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await api<{ rivalries: Rivalry[] }>('/api/rivalries', { skipAuth: true });
      setRivalries(r.rivalries || []);
    } catch { /* offline */ } finally { setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function vote(faceOffId: string, side: 'A' | 'B') {
    setMsg('');
    try {
      await api(`/api/rivalries/faceoffs/${faceOffId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ side }),
      });
      load();
    } catch (e: any) {
      setMsg(e.message || 'Vote failed');
    }
  }

  return (
    <SwipeBack>
      <Screen refreshing={refreshing} onRefresh={load}>
        <Text style={styles.h1}>Rivalries</Text>
        <Text style={styles.muted}>Opt-in, moderated energy without harm. No money wagering.</Text>
        {msg ? <Text style={styles.badge}>{msg}</Text> : null}
        {rivalries.map((r) => (
          <View key={r.id} style={styles.card}>
            <Text style={styles.name}>{r.favoriteA.name || 'Favorite A'} vs {r.favoriteB.name || 'Favorite B'}</Text>
            <Text style={styles.badge}>{r.status} · Beef Radar {r.heatLevel}/5</Text>
            {r.summary ? <Text style={styles.muted}>{r.summary}</Text> : null}
            {r.faceOffs.map((f) => {
              const total = f.votesA + f.votesB;
              return (
                <View key={f.id} style={{ marginTop: 10 }}>
                  <Text style={{ color: colors.text, fontWeight: '600' }}>{f.question}</Text>
                  <Text style={styles.muted}>
                    {f.votesA} — {f.votesB} of {total} votes
                  </Text>
                  <View style={styles.row}>
                    <PrimaryButton label={`Vote ${r.favoriteA.name ?? 'A'}`} onPress={() => vote(f.id, 'A')} />
                    <PrimaryButton label={`Vote ${r.favoriteB.name ?? 'B'}`} onPress={() => vote(f.id, 'B')} />
                  </View>
                </View>
              );
            })}
          </View>
        ))}
        {!refreshing && rivalries.length === 0 && (
          <Text style={styles.muted}>No rivalries documented yet. Pull to refresh.</Text>
        )}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: spacing.sm, marginBottom: 8 },
  muted: { color: colors.muted, marginBottom: 12, fontSize: 14 },
  name: { color: colors.text, fontWeight: '700', fontSize: 16, marginBottom: 4 },
  badge: { color: colors.primaryHover, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: 10,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    color: colors.text,
    padding: 12,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
});
