/** Moment insights - Rally design (mock 21)
 * Real likes, comments and supports from GET /api/moments/:id. Views,
 * retention and drop-off need the analytics backend, so those tiles say
 * so honestly instead of showing invented numbers.
 */
import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, GlassCard } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, radii, type as typo } from '@/constants/theme';
import { api } from '@/lib/api';

const GOLD = '#FFA726';
const TEAL = '#34D399';

function timeAgo(iso: string) {
  const t = new Date(iso).getTime();
  if (!t) return '';
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

function fmt(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

export default function MomentInsightsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const momentId = String(id || '');

  const [moment, setMoment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    if (!momentId) return;
    setLoading(true);
    setFailed(false);
    try {
      const res = await api<{ moment: any }>('/api/moments/' + momentId, { skipAuth: true });
      setMoment(res.moment);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [momentId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={GOLD} style={{ marginTop: 80 }} />
      </Screen>
    );
  }

  if (failed || !moment) {
    return (
      <SwipeBack>
        <Screen>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel={'Back'}>
              <Ionicons name={'chevron-back'} size={26} color={colors.text} />
            </Pressable>
            <Text style={[styles.h1, { color: colors.text }]}>Moment insights</Text>
            <View style={{ width: 26 }} />
          </View>
          <EmptyState icon={'stats-chart-outline'} title={'No insights yet'} body={'This Moment could not be loaded.'} />
        </Screen>
      </SwipeBack>
    );
  }

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel={'Back'}>
            <Ionicons name={'chevron-back'} size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Moment insights</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* Moment card */}
        <GlassCard style={styles.momentCard}>
          <LinearGradient colors={['#B0347C', GOLD] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.thumb}>
            <Ionicons name={'videocam'} size={22} color={'#fff'} />
          </LinearGradient>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[styles.momentTitle, { color: colors.text }]} numberOfLines={2}>{moment.title}</Text>
            <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
              Posted {timeAgo(String(moment.createdAt || ''))}
            </Text>
          </View>
        </GlassCard>

        {/* Stat tiles */}
        <View style={styles.grid}>
          <View style={[styles.tile, { borderColor: colors.border }]}>
            <Text style={[styles.tileLabel, { color: colors.muted }]}>Views</Text>
            <Text style={[styles.tileValue, { color: colors.text }]}>{'—'}</Text>
            <Text style={[styles.tileNote, { color: colors.muted }]}>View counts arrive with the analytics backend</Text>
          </View>
          <View style={[styles.tile, { borderColor: colors.border }]}>
            <Text style={[styles.tileLabel, { color: colors.muted }]}>Watched past 10s</Text>
            <Text style={[styles.tileValue, { color: colors.text }]}>{'—'}</Text>
            <Text style={[styles.tileNote, { color: colors.muted }]}>Retention arrives with the analytics backend</Text>
          </View>
          <View style={[styles.tile, { borderColor: colors.border }]}>
            <Text style={[styles.tileLabel, { color: colors.muted }]}>Likes</Text>
            <Text style={[styles.tileValue, { color: colors.text }]}>{fmt(moment.reactionCount || 0)}</Text>
            <Text style={[styles.tileNote, { color: TEAL }]}>Live</Text>
          </View>
          <View style={[styles.tile, { borderColor: colors.border }]}>
            <Text style={[styles.tileLabel, { color: colors.muted }]}>Supports</Text>
            <Text style={[styles.tileValue, { color: colors.text }]}>{fmt(moment.supportCount || 0)}</Text>
            <Text style={[styles.tileNote, { color: TEAL }]}>Live</Text>
          </View>
        </View>

        {/* Drop-off */}
        <Text style={[styles.section, { color: colors.muted }]}>WHERE VIEWERS DROP OFF</Text>
        <View style={[styles.dropCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name={'sparkles'} size={18} color={TEAL} />
          <Text style={[styles.dropText, { color: colors.muted }]}>
            Second-by-second retention arrives with the analytics backend. Likes, comments and supports are counted live.
          </Text>
        </View>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  h1: { ...typo.h2, fontWeight: '900' },
  momentCard: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: spacing.md },
  thumb: { width: 56, height: 56, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  momentTitle: { fontSize: 16, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { width: '47.5%', borderWidth: 1, borderRadius: radii.lg, padding: 14, minHeight: 110 },
  tileLabel: { fontSize: 13, fontWeight: '700' },
  tileValue: { fontSize: 30, fontWeight: '900', marginTop: 6 },
  tileNote: { fontSize: 11, marginTop: 6, lineHeight: 15 },
  section: { fontSize: 13, fontWeight: '900', letterSpacing: 0.8, marginTop: spacing.lg, marginBottom: 10 },
  dropCard: { flexDirection: 'row', gap: 10, alignItems: 'center', borderWidth: 1, borderRadius: radii.md, padding: 14 },
  dropText: { flex: 1, fontSize: 13, lineHeight: 19 },
});
