import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '@/components/Screen';
import { api } from '@/lib/api';
import { colors, spacing, radii } from '@/constants/theme';
import { useSounds } from '@/hooks/useSounds';
import { SwipeBack } from '@/components/SwipeBack';

export default function RankingsScreen() {
  const [rankings, setRankings] = useState<any[]>([]);
  const { click } = useSounds();
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await api<{ rankings: any[] }>('/api/rankings');
      setRankings(r.rankings || []);
    } catch {}
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <SwipeBack>
      <Screen refreshing={refreshing} onRefresh={load}>
        <Text style={styles.h1}>Rankings</Text>
        <Text style={styles.muted}>Money does not buy rank alone.</Text>
        {rankings.map((r, i) => (
          <Link key={r.handle} href={(`/favorite/${r.handle}`) as any} asChild>
            <Pressable style={styles.row} onPress={() => click()}>
              <Text style={styles.name}>#{i + 1} @{r.handle}</Text>
              <Text style={styles.muted}>{r.score}</Text>
            </Pressable>
          </Link>
        ))}
        {rankings.length === 0 && (
          <View style={styles.card}>
            <Text style={styles.muted}>No rankings yet.</Text>
            <Link href="/favorite/mia" asChild>
              <Pressable onPress={() => click()}><Text style={styles.link}>Open demo @mia</Text></Pressable>
            </Link>
          </View>
        )}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  muted: { color: colors.muted, marginBottom: 12, fontSize: 14 },
  name: { color: colors.text, fontWeight: '600' },
  link: { color: colors.primary, fontWeight: '700', marginTop: 8 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  card: {
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1,
    borderColor: colors.border, padding: spacing.md, marginTop: 8,
  },
});
