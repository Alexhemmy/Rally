/** Wallet tab
 * Browse and buy Token packs.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { GradientButton, GlassCard, SectionHeader, EmptyState, StatTile } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { api } from '@/lib/api';
import { spacing, radii, type as typo } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';

type Pack = {
  id: string;
  name: string;
  tokens: number;
  bonusTokens: number;
  priceCents: number;
};

export default function WalletTab() {
  const { colors } = useTheme();
  const { impact } = useHaptics();

  const [packs, setPacks] = useState<Pack[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    impact('selection');
    try {
      const r = await api<{ packs: Pack[] }>('/api/tokens/packs');
      setPacks(r.packs || []);
    } catch {
      // offline
    } finally {
      setRefreshing(false);
    }
  }, [impact]);

  useEffect(() => {
    load();
  }, [load]);

  async function buy(pack: Pack) {
    setBuyingId(pack.id);
    impact('medium');

    // Placeholder — wire real checkout (Paystack / Flutterwave / Stripe) later
    await new Promise((r) => setTimeout(r, 600));

    impact('success');
    setBuyingId(null);
  }

  return (
    <Screen refreshing={refreshing} onRefresh={load}>
      <Text style={[styles.h1, { color: colors.text }]}>Wallet</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Mobile checkout uses the provider layer (Paystack / Flutterwave / Stripe).
      </Text>

      {packs.length === 0 && !refreshing ? (
        <EmptyState
          icon="wallet-outline"
          title="No packs available"
          body="Start the API and seed data, then pull to refresh."
        />
      ) : (
        <View style={{ gap: 12 }}>
          {packs.map((pack) => {
            const totalTokens = pack.tokens + (pack.bonusTokens || 0);
            const price = (pack.priceCents / 100).toFixed(2);

            return (
              <GlassCard key={pack.id}>
                <View style={styles.packHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.packName, { color: colors.text }]}>
                      {pack.name}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
                      {pack.tokens}
                      {pack.bonusTokens > 0 ? ` + ${pack.bonusTokens} bonus` : ''} tokens
                    </Text>
                  </View>
                  <Text style={[styles.price, { color: colors.primary }]}>
                    ${price}
                  </Text>
                </View>

                {pack.bonusTokens > 0 && (
                  <View
                    style={[
                      styles.bonusPill,
                      { backgroundColor: colors.primaryMuted },
                    ]}
                  >
                    <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>
                      +{pack.bonusTokens} bonus · {totalTokens} total
                    </Text>
                  </View>
                )}

                <View style={{ marginTop: spacing.md }}>
                  <GradientButton
                    label={buyingId === pack.id ? 'Processing…' : 'Buy'}
                    onPress={() => buy(pack)}
                    loading={buyingId === pack.id}
                    disabled={!!buyingId}
                    fullWidth
                  />
                </View>
              </GlassCard>
            );
          })}
        </View>
      )}
    </Screen>
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
  packHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  packName: {
    fontWeight: '700',
    fontSize: 16,
  },
  price: {
    fontWeight: '800',
    fontSize: 18,
  },
  bonusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    marginTop: 10,
  },
});
