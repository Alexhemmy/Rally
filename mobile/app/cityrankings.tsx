import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SwipeBack } from '@/components/SwipeBack';
import { api } from '@/lib/api';
import { colors, spacing, radii } from '@/constants/theme';

type City = { city: string; activeFans: number };
type LaneRow = { rank: number; name: string; handle: string | null; uniqueSupporters: number; movement: number | null };

export default function CityRankingsScreen() {
  const [cities, setCities] = useState<City[]>([]);
  const [city, setCity] = useState<string | null>(null);
  const [lane, setLane] = useState<LaneRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      if (city) {
        const r = await api<{ lane: LaneRow[] }>('/api/city-rankings/' + encodeURIComponent(city), { skipAuth: true });
        setLane(r.lane || []);
      } else {
        const r = await api<{ cities: City[] }>('/api/city-rankings/cities', { skipAuth: true });
        setCities(r.cities || []);
      }
    } catch { /* offline */ } finally { setRefreshing(false); }
  }, [city]);

  useEffect(() => { load(); }, [load]);

  return (
    <SwipeBack>
      <Screen refreshing={refreshing} onRefresh={load}>
        <Text style={styles.h1}>City rankings</Text>
        <Text style={styles.muted}>
          Monthly lanes of local Favorites — ranked by UNIQUE local supporters, never by spend volume.
        </Text>
        {city ? (
          <View style={styles.card}>
            <Text style={styles.name}>{city} · this month</Text>
            {lane.map((r) => (
              <Text key={r.rank} style={styles.muted}>
                {r.rank}. {r.name} — {r.uniqueSupporters} supporters
                {r.movement !== null ? (r.movement > 0 ? ' ▲' + r.movement : r.movement < 0 ? ' ▼' + Math.abs(r.movement) : '') : ''}
              </Text>
            ))}
            {lane.length === 0 && <Text style={styles.muted}>No ranked Favorites in this lane yet.</Text>}
            <PrimaryButton label="← All cities" variant="ghost" onPress={() => { setCity(null); setLane([]); }} />
          </View>
        ) : (
          cities.map((c) => (
            <View key={c.city} style={styles.card}>
              <Text style={styles.name}>{c.city}</Text>
              <Text style={styles.muted}>{c.activeFans} active local fans this month</Text>
              <PrimaryButton label="View lane" onPress={() => setCity(c.city)} />
            </View>
          ))
        )}
        {!city && cities.length === 0 && !refreshing && (
          <Text style={styles.muted}>No city lanes yet — fans need to set their city.</Text>
        )}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: spacing.sm, marginBottom: 8 },
  muted: { color: colors.muted, marginBottom: 8, fontSize: 14 },
  name: { color: colors.text, fontWeight: '700', fontSize: 16, marginBottom: 4 },
  card: {
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1,
    borderColor: colors.border, padding: spacing.md, marginBottom: 10,
  },
});
