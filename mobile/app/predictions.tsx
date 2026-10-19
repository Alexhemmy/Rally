import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SwipeBack } from '@/components/SwipeBack';
import { api } from '@/lib/api';
import { colors, spacing, radii } from '@/constants/theme';

type Prediction = {
  id: string; question: string; closesAt: string; prizeKind: string;
  tokenPrize: number; favoriteAName: string; favoriteBName: string;
};

export default function PredictionsScreen() {
  const [list, setList] = useState<Prediction[]>([]);
  const [msg, setMsg] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await api<{ predictions: Prediction[] }>('/api/predictions?status=open', { skipAuth: true });
      setList(r.predictions || []);
    } catch { /* offline */ } finally { setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function enter(id: string, choice: string) {
    try {
      await api('/api/predictions/' + id + '/enter', { method: 'POST', body: JSON.stringify({ choice }) });
      setMsg('Prediction locked in! Prize Tokens go to your gifted balance.');
    } catch (e: any) { setMsg(e.message); }
  }

  return (
    <SwipeBack>
      <Screen refreshing={refreshing} onRefresh={load}>
        <Text style={styles.h1}>Predictions</Text>
        <Text style={styles.muted}>
          Free head-to-head predictions with Token prizes where legal. Prize Tokens sit in your gifted balance — spend on Gifts, never withdrawable.
        </Text>
        {!!msg && <Text style={styles.ok}>{msg}</Text>}
        {list.map((p) => (
          <View key={p.id} style={styles.card}>
            <Text style={styles.name}>{p.question}</Text>
            <Text style={styles.badge}>
              {p.favoriteAName} vs {p.favoriteBName} · closes {new Date(p.closesAt).toLocaleDateString()}
              {p.prizeKind === 'tokens' ? ' · ' + p.tokenPrize + ' token prize' : ''}
            </Text>
            <View style={styles.row}>
              <PrimaryButton label={'Pick ' + p.favoriteAName} onPress={() => enter(p.id, 'a')} />
              <PrimaryButton label={'Pick ' + p.favoriteBName} variant="ghost" onPress={() => enter(p.id, 'b')} />
            </View>
          </View>
        ))}
        {list.length === 0 && !refreshing && <Text style={styles.muted}>No open predictions right now.</Text>}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: spacing.sm, marginBottom: 8 },
  muted: { color: colors.muted, marginBottom: 12, fontSize: 14 },
  name: { color: colors.text, fontWeight: '700', fontSize: 16, marginBottom: 4 },
  badge: { color: colors.primaryHover, fontSize: 12, fontWeight: '600', marginBottom: 10 },
  ok: { color: '#16a34a', marginBottom: 8 },
  card: {
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1,
    borderColor: colors.border, padding: spacing.md, marginBottom: 10,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
});
