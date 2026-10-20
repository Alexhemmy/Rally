/** Rivalries
 * Opt-in, moderated energy without harm. No money wagering.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { GradientButton, GlassCard, SectionHeader, EmptyState } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { api } from '@/lib/api';
import { spacing, radii, type as typo } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';

type FaceOff = {
  id: string;
  question: string;
  favoriteAId: string;
  votesA: number;
  votesB: number;
  closesAt: string;
};

type Rivalry = {
  id: string;
  favoriteA: { name: string | null };
  favoriteB: { name: string | null };
  status: string;
  heatLevel: number;
  summary: string | null;
  faceOffs: FaceOff[];
};

export default function RivalriesScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();

  const [rivalries, setRivalries] = useState<Rivalry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await api<{ rivalries: Rivalry[] }>('/api/rivalries', { skipAuth: true });
      setRivalries(r.rivalries || []);
    } catch {
      // offline
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function vote(faceOffId: string, side: 'A' | 'B') {
    setVotingId(faceOffId);
    setMsg(null);
    impact('medium');

    try {
      await api(`/api/rivalries/faceoffs/${faceOffId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ side }),
      });
      setMsg({ type: 'success', text: 'Vote recorded!' });
      impact('success');
      await load();
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Vote failed' });
    } finally {
      setVotingId(null);
    }
  }

  return (
    <SwipeBack>
      <Screen refreshing={refreshing} onRefresh={load}>
        {/* Header */}
        <Text style={[styles.h1, { color: colors.text }]}>Rivalries</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Opt-in, moderated energy without harm. No money wagering.
        </Text>

        {/* Feedback */}
        {msg && (
          <View
            style={[
              styles.feedback,
              {
                backgroundColor:
                  msg.type === 'success'
                    ? colors.success + '18'
                    : colors.danger + '18',
              },
            ]}
          >
            <Text
              style={{
                color: msg.type === 'success' ? colors.success : colors.danger,
                fontWeight: '700',
                fontSize: 13,
              }}
            >
              {msg.text}
            </Text>
          </View>
        )}

        {/* List */}
        {rivalries.length === 0 && !refreshing ? (
          <EmptyState
            icon="flash-outline"
            title="No rivalries yet"
            body="Pull to refresh or check back later for new matchups."
          />
        ) : (
          <View style={{ gap: 14 }}>
            {rivalries.map((r) => {
              const nameA = r.favoriteA.name || 'Favorite A';
              const nameB = r.favoriteB.name || 'Favorite B';

              return (
                <GlassCard key={r.id}>
                  {/* Rivalry header */}
                  <Text style={[styles.vsTitle, { color: colors.text }]}>
                    {nameA}{' '}
                    <Text style={{ color: colors.muted, fontWeight: '600' }}>vs</Text>{' '}
                    {nameB}
                  </Text>

                  <View style={styles.metaRow}>
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: colors.primaryMuted },
                      ]}
                    >
                      <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>
                        {r.status}
                      </Text>
                    </View>
                    <Text style={{ color: colors.muted, fontSize: 13 }}>
                      Beef Radar {r.heatLevel}/5
                    </Text>
                  </View>

                  {r.summary && (
                    <Text
                      style={{
                        color: colors.muted,
                        fontSize: 14,
                        lineHeight: 20,
                        marginTop: 8,
                      }}
                    >
                      {r.summary}
                    </Text>
                  )}

                  {/* Face-offs */}
                  {r.faceOffs.map((f) => {
                    const total = f.votesA + f.votesB || 1;
                    const pctA = Math.round((f.votesA / total) * 100);
                    const pctB = 100 - pctA;

                    return (
                      <View
                        key={f.id}
                        style={[
                          styles.faceOff,
                          {
                            backgroundColor: colors.bg,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.question, { color: colors.text }]}>
                          {f.question}
                        </Text>

                        {/* Vote bar */}
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.barFillA,
                              {
                                width: `${pctA}%`,
                                backgroundColor: colors.primary,
                              },
                            ]}
                          />
                          <View
                            style={[
                              styles.barFillB,
                              {
                                width: `${pctB}%`,
                                backgroundColor: colors.accent,
                              },
                            ]}
                          />
                        </View>

                        <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 10 }}>
                          {f.votesA} — {f.votesB} · {total} votes
                        </Text>

                        <View style={styles.actions}>
                          <GradientButton
                            label={`Vote ${nameA}`}
                            size="sm"
                            onPress={() => vote(f.id, 'A')}
                            loading={votingId === f.id}
                            disabled={!!votingId}
                            style={{ flex: 1 }}
                          />
                          <GradientButton
                            label={`Vote ${nameB}`}
                            size="sm"
                            variant="ghost"
                            onPress={() => vote(f.id, 'B')}
                            loading={votingId === f.id}
                            disabled={!!votingId}
                            style={{ flex: 1 }}
                          />
                        </View>
                      </View>
                    );
                  })}
                </GlassCard>
              );
            })}
          </View>
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
  feedback: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  vsTitle: {
    fontWeight: '800',
    fontSize: 17,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  faceOff: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 14,
  },
  question: {
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 10,
    lineHeight: 20,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 6,
  },
  barFillA: {
    height: '100%',
  },
  barFillB: {
    height: '100%',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
});
