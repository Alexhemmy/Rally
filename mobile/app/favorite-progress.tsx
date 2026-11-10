/** Favorite Progress (UX 21) - Rally design
 * Seven non-monetary signals. Money never counts toward Favorite status.
 * When every signal is green, Apply for review is one tap away.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const GREEN = '#34D399';

type Signal = { id: string; label: string; done: boolean; current: number | null; target: number | null; hint: string | null };
type Progress = { signals: Signal[]; met: number; total: number; allMet: boolean; isFavorite: boolean; note: string };

export default function FavoriteProgressScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Progress | null>(null);

  const load = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await api<Progress>('/api/upgrade/progress');
      setData(res);
    } catch {
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <SwipeBack>
      <Screen refreshing={loading} onRefresh={load}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Favorite Progress</Text>
        </View>
        <Text style={[styles.sub, { color: colors.muted }]}>
          Grow into a Favorite. Money never counts toward Favorite status.
        </Text>

        {!getToken() ? (
          <EmptyState icon="lock-closed-outline" title="Log in to see your progress" body="Your signals are saved as you use Rally." />
        ) : loading && !data ? (
          <ActivityIndicator color={GOLD} style={{ marginTop: 60 }} />
        ) : data ? (
          <>
            <View style={[styles.scoreCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '800' }}>SIGNALS GREEN</Text>
              <Text style={{ color: colors.text, fontSize: 30, fontWeight: '900', marginTop: 4 }}>
                {data.met + ' of ' + data.total}
              </Text>
              <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
                <View style={[styles.barFill, { width: Math.round((data.met / data.total) * 100) + '%', backgroundColor: data.allMet ? GREEN : GOLD }]} />
              </View>
              {data.isFavorite ? (
                <Text style={{ color: GREEN, fontSize: 12, fontWeight: '700', marginTop: 10 }}>
                  You already have a Favorite page.
                </Text>
              ) : null}
            </View>

            <Text style={[styles.section, { color: colors.muted }]}>WHAT RALLY LOOKS FOR</Text>
            <View style={{ gap: 10, marginBottom: spacing.lg }}>
              {data.signals.map((s) => (
                <View
                  key={s.id}
                  style={[styles.signalRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Ionicons name={s.done ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={s.done ? GREEN : '#8A8A9E'} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>{s.label}</Text>
                    <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                      {s.done ? 'Done' : (s.hint || 'Keep going')}
                    </Text>
                    {s.current !== null && s.target ? (
                      <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>
                        {s.current + ' of ' + s.target}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>

            <Text style={[styles.note, { color: colors.muted }]}>{data.note}</Text>

            {!data.isFavorite ? (
              <Pressable
                style={({ pressed }) => [styles.applyBtn, pressed && { opacity: 0.85 }]}
                onPress={() => { impact('medium'); router.push('/apply-favorite'); }}
                accessibilityLabel="Apply for review"
              >
                <LinearGradient
                  colors={[GOLD, GOLD_DEEP] as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.applyGradient, !data.allMet && { opacity: 0.5 }]}
                >
                  <Text style={styles.applyText}>
                    {data.allMet ? 'Apply for review' : 'See Apply as Favorite'}
                  </Text>
                </LinearGradient>
              </Pressable>
            ) : null}
          </>
        ) : null}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.sm },
  h1: { fontSize: 24, fontWeight: '900' },
  sub: { fontSize: 13, marginTop: 4, marginBottom: spacing.md },
  scoreCard: { borderWidth: 1, borderRadius: radii.lg, padding: 18 },
  barTrack: { height: 8, borderRadius: 4, marginTop: 12, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  section: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: spacing.lg, marginBottom: 10 },
  signalRow: { flexDirection: 'row', borderWidth: 1, borderRadius: radii.md, padding: 14, alignItems: 'flex-start' },
  note: { fontSize: 12, lineHeight: 18, marginBottom: spacing.md },
  applyBtn: { borderRadius: radii.full, overflow: 'hidden' },
  applyGradient: { alignItems: 'center', justifyContent: 'center', paddingVertical: 15 },
  applyText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
