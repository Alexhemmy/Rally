/** Rankings
 * Global Favorite rankings. Money does not buy rank alone.
 */
import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GlassCard, Avatar, EmptyState } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { api } from '@/lib/api';
import { spacing, radii, type as typo } from '@/constants/theme';
import { useSounds } from '@/hooks/useSounds';
import { useHaptics } from '@/hooks/useHaptics';

type RankingEntry = {
  handle: string;
  name?: string;
  score: number;
  avatarUrl?: string | null;
};

export default function RankingsScreen() {
  const { colors } = useTheme();
  const { click } = useSounds();
  const { impact } = useHaptics();
  const router = useRouter();

  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await api<{ rankings: RankingEntry[] }>('/api/rankings');
      setRankings(r.rankings || []);
    } catch {
      // offline
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SwipeBack>
      <Screen refreshing={refreshing} onRefresh={load}>
        {/* Header */}
        <Text style={[styles.h1, { color: colors.text }]}>Rankings</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Money does not buy rank alone.
        </Text>

        {rankings.length === 0 && !refreshing ? (
          <EmptyState
            icon="trophy-outline"
            title="No rankings yet"
            body="Check back later or explore the demo Favorite."
            action={
              <Pressable
                onPress={() => {
                  click();
                  router.push('/favorite/mia');
                }}
              >
                <Text style={{ color: colors.primary, fontWeight: '700' }}>
                  Open demo @mia
                </Text>
              </Pressable>
            }
          />
        ) : (
          <GlassCard padded={false}>
            {rankings.map((entry, index) => (
              <Pressable
                key={entry.handle}
                onPress={() => {
                  click();
                  impact('light');
                  router.push(`/favorite/${entry.handle}`);
                }}
                style={({ pressed }) => [
                  styles.row,
                  {
                    borderBottomWidth: index < rankings.length - 1 ? StyleSheet.hairlineWidth : 0,
                    borderBottomColor: colors.border,
                    backgroundColor: pressed ? colors.surfaceHover : 'transparent',
                  },
                ]}
              >
                {/* Rank number */}
                <View
                  style={[
                    styles.rankBadge,
                    {
                      backgroundColor:
                        index === 0
                          ? colors.warning + '30'
                          : index === 1
                          ? colors.muted + '30'
                          : index === 2
                          ? colors.accent + '25'
                          : colors.primaryMuted,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color:
                        index === 0
                          ? colors.warning
                          : index < 3
                          ? colors.text
                          : colors.primary,
                      fontWeight: '800',
                      fontSize: 14,
                    }}
                  >
                    {index + 1}
                  </Text>
                </View>

                <Avatar
                  uri={entry.avatarUrl}
                  name={entry.name || entry.handle}
                  size={40}
                  ring={index < 3}
                />

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                    {entry.name || entry.handle}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 13 }}>
                    @{entry.handle}
                  </Text>
                </View>

                <Text style={[styles.score, { color: colors.primary }]}>
                  {entry.score}
                </Text>
              </Pressable>
            ))}
          </GlassCard>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 1,
  },
  score: {
    fontWeight: '800',
    fontSize: 15,
  },
});
