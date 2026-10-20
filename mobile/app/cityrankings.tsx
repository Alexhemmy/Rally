/** City Rankings
 * Monthly lanes of local Favorites — ranked by UNIQUE local supporters,
 * never by spend volume.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { GradientButton, GlassCard, SectionHeader, EmptyState } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { api } from '@/lib/api';
import { spacing, radii, type as typo } from '@/constants/theme';

type City = {
  city: string;
  activeFans: number;
};

type LaneRow = {
  rank: number;
  name: string;
  handle: string | null;
  uniqueSupporters: number;
  movement: number | null;
};

export default function CityRankingsScreen() {
  const { colors } = useTheme();

  const [cities, setCities] = useState<City[]>([]);
  const [city, setCity] = useState<string | null>(null);
  const [lane, setLane] = useState<LaneRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      if (city) {
        const r = await api<{ lane: LaneRow[] }>(
          `/api/city-rankings/${encodeURIComponent(city)}`,
          { skipAuth: true },
        );
        setLane(r.lane || []);
      } else {
        const r = await api<{ cities: City[] }>('/api/city-rankings/cities', {
          skipAuth: true,
        });
        setCities(r.cities || []);
      }
    } catch {
      // offline
    } finally {
      setRefreshing(false);
    }
  }, [city]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SwipeBack>
      <Screen refreshing={refreshing} onRefresh={load}>
        {/* Header */}
        <Text style={[styles.h1, { color: colors.text }]}>City rankings</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Monthly lanes of local Favorites — ranked by unique local supporters, never by spend volume.
        </Text>

        {city ? (
          /* ───── Lane view ───── */
          <GlassCard>
            <SectionHeader
              title={`${city} · this month`}
              action="← All cities"
              onAction={() => {
                setCity(null);
                setLane([]);
              }}
            />

            {lane.length === 0 ? (
              <Text style={{ color: colors.muted, marginTop: 8 }}>
                No ranked Favorites in this lane yet.
              </Text>
            ) : (
              <View style={{ gap: 10, marginTop: 4 }}>
                {lane.map((row) => (
                  <View
                    key={row.rank}
                    style={[
                      styles.laneRow,
                      {
                        backgroundColor: colors.bg,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.rankBadge}>
                      <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 15 }}>
                        {row.rank}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>
                        {row.name}
                      </Text>
                      {row.handle && (
                        <Text style={{ color: colors.muted, fontSize: 12 }}>
                          @{row.handle}
                        </Text>
                      )}
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>
                        {row.uniqueSupporters}
                      </Text>
                      <Text style={{ color: colors.muted, fontSize: 11 }}>
                        supporters
                      </Text>

                      {row.movement !== null && row.movement !== 0 && (
                        <Text
                          style={{
                            color: row.movement > 0 ? colors.success : colors.danger,
                            fontSize: 12,
                            fontWeight: '700',
                            marginTop: 2,
                          }}
                        >
                          {row.movement > 0 ? `▲ ${row.movement}` : `▼ ${Math.abs(row.movement)}`}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </GlassCard>
        ) : (
          /* ───── Cities list ───── */
          <>
            {cities.length === 0 && !refreshing ? (
              <EmptyState
                icon="location-outline"
                title="No city lanes yet"
                body="Fans need to set their city for rankings to appear."
              />
            ) : (
              <View style={{ gap: 12 }}>
                {cities.map((c) => (
                  <GlassCard key={c.city}>
                    <Text style={[styles.cityName, { color: colors.text }]}>
                      {c.city}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 12 }}>
                      {c.activeFans} active local fans this month
                    </Text>
                    <GradientButton
                      label="View lane"
                      size="sm"
                      onPress={() => setCity(c.city)}
                    />
                  </GlassCard>
                ))}
              </View>
            )}
          </>
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
  cityName: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  laneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
  },
});
