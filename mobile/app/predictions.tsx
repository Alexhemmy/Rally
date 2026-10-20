/** Predictions
 * Free head-to-head predictions with Token prizes (where legal).
 * Prize Tokens go to gifted balance — spend on Gifts, never withdrawable.
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

type Prediction = {
  id: string;
  question: string;
  closesAt: string;
  prizeKind: string;
  tokenPrize: number;
  favoriteAName: string;
  favoriteBName: string;
};

export default function PredictionsScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();

  const [list, setList] = useState<Prediction[]>([]);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [enteringId, setEnteringId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await api<{ predictions: Prediction[] }>(
        '/api/predictions?status=open',
        { skipAuth: true },
      );
      setList(r.predictions || []);
    } catch {
      // offline
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function enter(id: string, choice: 'a' | 'b') {
    setEnteringId(id);
    setMsg(null);
    impact('medium');

    try {
      await api(`/api/predictions/${id}/enter`, {
        method: 'POST',
        body: JSON.stringify({ choice }),
      });
      setMsg({
        type: 'success',
        text: 'Prediction locked in! Prize Tokens will go to your gifted balance.',
      });
      impact('success');
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Could not lock in prediction' });
    } finally {
      setEnteringId(null);
    }
  }

  return (
    <SwipeBack>
      <Screen refreshing={refreshing} onRefresh={load}>
        {/* Header */}
        <Text style={[styles.h1, { color: colors.text }]}>Predictions</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Free head-to-head predictions with Token prizes where legal. Prize Tokens sit in your gifted balance — spend on Gifts, never withdrawable.
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

        {/* Predictions List */}
        {list.length === 0 && !refreshing ? (
          <EmptyState
            icon="trophy-outline"
            title="No open predictions"
            body="Check back later for new head-to-head matchups."
          />
        ) : (
          <View style={{ gap: 12 }}>
            {list.map((p) => (
              <GlassCard key={p.id}>
                <Text style={[styles.question, { color: colors.text }]}>
                  {p.question}
                </Text>

                <View style={styles.meta}>
                  <Text style={{ color: colors.muted, fontSize: 13 }}>
                    {p.favoriteAName} vs {p.favoriteBName}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 13 }}>
                    Closes {new Date(p.closesAt).toLocaleDateString()}
                  </Text>
                </View>

                {p.prizeKind === 'tokens' && p.tokenPrize > 0 && (
                  <View
                    style={[
                      styles.prizePill,
                      { backgroundColor: colors.primaryMuted },
                    ]}
                  >
                    <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>
                      {p.tokenPrize} Token prize
                    </Text>
                  </View>
                )}

                <View style={styles.actions}>
                  <GradientButton
                    label={`Pick ${p.favoriteAName}`}
                    size="sm"
                    onPress={() => enter(p.id, 'a')}
                    loading={enteringId === p.id}
                    disabled={!!enteringId}
                    style={{ flex: 1 }}
                  />
                  <GradientButton
                    label={`Pick ${p.favoriteBName}`}
                    size="sm"
                    variant="ghost"
                    onPress={() => enter(p.id, 'b')}
                    loading={enteringId === p.id}
                    disabled={!!enteringId}
                    style={{ flex: 1 }}
                  />
                </View>
              </GlassCard>
            ))}
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
  question: {
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
  },
  meta: {
    gap: 2,
    marginBottom: 10,
  },
  prizePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    marginBottom: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
});
