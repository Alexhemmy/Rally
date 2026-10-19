import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SwipeBack } from '@/components/SwipeBack';
import { api } from '@/lib/api';
import { colors, spacing, radii } from '@/constants/theme';

type Giveaway = {
  id: string;
  favoriteName: string | null;
  poolAmount: number;
  currency: string;
  winnerCount: number;
  entryClosesAt: string;
  status: string;
};

export default function Page() {
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await api<{ giveaways: Giveaway[] }>('/api/giveaways', { skipAuth: true });
      setGiveaways(r.giveaways || []);
    } catch { /* offline */ } finally { setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function enter(id: string) {
    setMsg('');
    try {
      await api(`/api/giveaways/${id}/enter`, { method: 'POST' });
      setMsg('You are in! Winners are weighted by activeness, dedication and passion — never by spend.');
    } catch (e: any) {
      setMsg(e.message || 'Could not enter');
    }
  }

  return (
    <SwipeBack>
      <Screen refreshing={refreshing} onRefresh={load}>
        <Text style={styles.h1}>Giveaways</Text>
        <Text style={styles.muted}>
          Free entry. Weighted by activeness, dedication, passion — never by spend.
        </Text>
        {msg ? <Text style={styles.badge}>{msg}</Text> : null}
        {giveaways.map((g) => (
          <View key={g.id} style={styles.card}>
            <Text style={styles.name}>{g.favoriteName || 'A Favorite'} · Giveaway</Text>
            <Text style={styles.muted}>
              {g.poolAmount} {g.currency} · {g.winnerCount} winner{g.winnerCount > 1 ? 's' : ''} · closes{' '}
              {new Date(g.entryClosesAt).toLocaleDateString()}
            </Text>
            <PrimaryButton label="Enter for free" onPress={() => enter(g.id)} />
          </View>
        ))}
        {!refreshing && giveaways.length === 0 && (
          <Text style={styles.muted}>No open giveaways yet. Pull to refresh.</Text>
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
