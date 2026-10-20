/** Giveaways
 * Free entry. Weighted by activeness, dedication, passion — never by spend.
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

type Giveaway = {
  id: string;
  favoriteName: string | null;
  poolAmount: number;
  currency: string;
  winnerCount: number;
  entryClosesAt: string;
  status: string;
};

export default function GiveawaysScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();

  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [enteringId, setEnteringId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await api<{ giveaways: Giveaway[] }>('/api/giveaways', {
        skipAuth: true,
      });
      setGiveaways(r.giveaways || []);
    } catch {
      // offline
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function enter(id: string) {
    setEnteringId(id);
    setMsg(null);
    impact('medium');

    try {
      await api(`/api/giveaways/${id}/enter`, { method: 'POST' });
      setMsg({
        type: 'success',
        text: 'You’re in! Winners are weighted by activeness, dedication and passion — never by spend.',
      });
      impact('success');
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Could not enter' });
    } finally {
      setEnteringId(null);
    }
  }

  return (
    <SwipeBack>
      <Screen refreshing={refreshing} onRefresh={load}>
        {/* Header */}
        <Text style={[styles.h1, { color: colors.text }]}>Giveaways</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Free entry. Weighted by activeness, dedication, passion — never by spend.
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
                lineHeight: 18,
              }}
            >
              {msg.text}
            </Text>
          </View>
        )}

        {/* List */}
        {giveaways.length === 0 && !refreshing ? (
          <EmptyState
            icon="gift-outline"
            title="No open giveaways"
            body="Pull to refresh or check back later for new ones."
          />
        ) : (
          <View style={{ gap: 12 }}>
            {giveaways.map((g) => (
              <GlassCard key={g.id}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {g.favoriteName || 'A Favorite'} · Giveaway
                </Text>

                <View style={styles.meta}>
                  <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15 }}>
                    {g.poolAmount} {g.currency}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 13 }}>
                    {g.winnerCount} winner{g.winnerCount > 1 ? 's' : ''}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 13 }}>
                    Closes {new Date(g.entryClosesAt).toLocaleDateString()}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor:
                        g.status === 'open'
                          ? colors.success + '20'
                          : colors.primaryMuted,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: g.status === 'open' ? colors.success : colors.primary,
                      fontSize: 12,
                      fontWeight: '700',
                      textTransform: 'capitalize',
                    }}
                  >
                    {g.status}
                  </Text>
                </View>

                <View style={{ marginTop: spacing.md }}>
                  <GradientButton
                    label="Enter for free"
                    onPress={() => enter(g.id)}
                    loading={enteringId === g.id}
                    disabled={!!enteringId || g.status !== 'open'}
                    fullWidth
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
  title: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 8,
  },
  meta: {
    gap: 4,
    marginBottom: 10,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
});
