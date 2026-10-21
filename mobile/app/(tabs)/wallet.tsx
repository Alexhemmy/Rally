/** Wallet tab
 * Browse and buy Token packs — real provider checkout
 * (Paystack / Flutterwave / Stripe, routed by country on the server).
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Linking, Alert } from 'react-native';
import { Screen } from '@/components/Screen';
import { GradientButton, GlassCard, EmptyState } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { api, getToken } from '@/lib/api';
import { spacing, radii, type as typo } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';

type Pack = {
  id: string;
  name: string;
  tokens: number;
  bonus_tokens?: number;
  bonusTokens?: number;
  price_cents?: number;
  priceCents?: number;
};

export default function WalletTab() {
  const { colors } = useTheme();
  const { impact } = useHaptics();

  const [packs, setPacks] = useState<Pack[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [wallet, setWallet] = useState<{ balance: number; giftedBalance: number } | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    impact('selection');
    try {
      const r = await api<{ packs: any[] }>('/api/tokens/packs', { skipAuth: true });
      setPacks(r.packs || []);
      if (getToken()) {
        const w = await api<{ wallet: any }>('/api/tokens/wallet');
        setWallet({
          balance: Number(w.wallet?.balance ?? 0),
          giftedBalance: Number(w.wallet?.giftedBalance ?? 0),
        });
      }
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
    if (!getToken()) {
      Alert.alert('Log in required', 'Create an account or log in before buying Tokens.');
      return;
    }
    setBuyingId(pack.id);
    impact('medium');
    try {
      const res = await api<{
        checkout?: { authorizationUrl?: string };
        purchase?: { status: string; tokens?: number };
      }>('/api/tokens/purchase', {
        method: 'POST',
        body: JSON.stringify({ packId: pack.id, paymentMethod: 'card' }),
      });

      if (res.checkout?.authorizationUrl) {
        // Real provider checkout — opens the hosted Paystack/FLW/Stripe page.
        await Linking.openURL(res.checkout.authorizationUrl);
        Alert.alert(
          'Complete your payment',
          'Finish the payment in the page that just opened, then pull to refresh to see your new balance.',
        );
      } else if (res.purchase?.status === 'completed') {
        impact('success');
        Alert.alert('Purchase complete', res.purchase.tokens + ' tokens were added to your wallet.');
        await load();
      }
    } catch (e: any) {
      Alert.alert('Purchase failed', e.message || 'Could not start checkout. Try again.');
    } finally {
      setBuyingId(null);
    }
  }

  const bonus = (p: Pack) => Number(p.bonusTokens ?? p.bonus_tokens ?? 0);
  const priceCents = (p: Pack) => Number(p.priceCents ?? p.price_cents ?? 0);

  return (
    <Screen refreshing={refreshing} onRefresh={load}>
      <Text style={[styles.h1, { color: colors.text }]}>Wallet</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Checkout runs through Paystack, Flutterwave or Stripe depending on your country.
      </Text>

      {wallet && (
        <View style={styles.walletRow}>
          <View style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700' }}>BALANCE</Text>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>{wallet.balance}</Text>
          </View>
          <View style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700' }}>GIFTED</Text>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>{wallet.giftedBalance}</Text>
          </View>
        </View>
      )}

      {packs.length === 0 && !refreshing ? (
        <EmptyState
          icon="wallet-outline"
          title="No packs available"
          body="Token packs are managed on the server. Pull to refresh once the backend is live."
        />
      ) : (
        <View style={{ gap: 12 }}>
          {packs.map((pack) => {
            const totalTokens = pack.tokens + bonus(pack);
            const price = (priceCents(pack) / 100).toFixed(2);

            return (
              <GlassCard key={pack.id}>
                <View style={styles.packHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.packName, { color: colors.text }]}>
                      {pack.name}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
                      {pack.tokens}
                      {bonus(pack) > 0 ? ' + ' + bonus(pack) + ' bonus' : ''} tokens
                    </Text>
                  </View>
                  <Text style={[styles.price, { color: colors.primary }]}>
                    {'$' + price}
                  </Text>
                </View>

                {bonus(pack) > 0 && (
                  <View
                    style={[
                      styles.bonusPill,
                      { backgroundColor: colors.primaryMuted },
                    ]}
                  >
                    <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>
                      +{bonus(pack)} bonus · {totalTokens} total
                    </Text>
                  </View>
                )}

                <View style={{ marginTop: spacing.md }}>
                  <GradientButton
                    label={buyingId === pack.id ? 'Opening checkout…' : 'Buy'}
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
  walletRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.md,
  },
  tile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 12,
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
