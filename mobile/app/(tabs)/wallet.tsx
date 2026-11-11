/** Wallet - Rally design
 * Side-by-side Tokens (gold) and Earnings (teal) cards, token
 * packages, and real provider checkout (Paystack/FLW/Stripe).
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Linking, Alert, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { api, getToken } from '@/lib/api';
import { spacing, radii, type as typo } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const TEAL = '#00897B';
const TEAL_DEEP = '#00695C';

type Pack = {
  id: string;
  name: string;
  tokens: number;
  bonus_tokens?: number;
  bonusTokens?: number;
  price_cents?: number;
  priceCents?: number;
  currency?: string;
};

function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export default function WalletTab() {
  const { colors } = useTheme();
  const { impact } = useHaptics();
  const router = useRouter();

  const [packs, setPacks] = useState<Pack[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [wallet, setWallet] = useState<{ balance: number; giftedBalance: number } | null>(null);
  const [earnings, setEarnings] = useState<{ available: number; pending: number } | null>(null);
  const [week, setWeek] = useState<{ cap: number | null; spent: number } | null>(null);
  const [payWith, setPayWith] = useState('card');

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
        const e = await api<{ balance: any }>('/api/favorites/me/earnings');
        setEarnings({
          available: Number(e.balance?.available ?? 0),
          pending: Number(e.balance?.pending ?? 0),
        });
        const l = await api<any>('/api/limits');
        setWeek({
          cap: l.weeklySpendCap == null ? null : Number(l.weeklySpendCap),
          spent: Number(l.spentThisWeek || 0),
        });
      } else {
        setWallet(null);
        setEarnings(null);
        setWeek(null);
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
    const tot = pack.tokens + bonus(pack);
    const amt = fmt(priceCents(pack) / 100);
    try {
      const res = await api<{
        checkout?: { authorizationUrl?: string };
        purchase?: { status: string; tokens?: number };
      }>('/api/tokens/purchase', {
        method: 'POST',
        body: JSON.stringify({ packId: pack.id, paymentMethod: 'card' }),
      });

      if (res.checkout?.authorizationUrl) {
        await Linking.openURL(res.checkout.authorizationUrl);
        Alert.alert(
          'Complete your payment',
          'Finish the payment in the page that just opened, then pull to refresh to see your new balance.',
        );
      } else if (res.purchase?.status === 'completed') {
        impact('success');
        router.push({
          pathname: '/payment-result',
          params: {
            status: 'confirmed',
            tokens: String(res.purchase.tokens ?? tot),
            amount: amt,
            method: 'card',
            reference: String(res.purchase.reference ?? res.purchase.id ?? ''),
            balance: res.wallet ? String(Number(res.wallet.balance) + Number(res.wallet.giftedBalance || 0)) : '',
          },
        });
      }
    } catch (e: any) {
      impact('error');
      router.push({
        pathname: '/payment-result',
        params: {
          status: 'failed',
          tokens: String(tot),
          amount: amt,
          method: 'card',
          reference: '',
          packId: pack.id,
          reason: e && e.message ? e.message : '',
        },
      });
    } finally {
      setBuyingId(null);
    }
  }

  const bonus = (p: Pack) => Number(p.bonusTokens ?? p.bonus_tokens ?? 0);
  const priceCents = (p: Pack) => Number(p.priceCents ?? p.price_cents ?? 0);
  const totalTokens = wallet ? wallet.balance + wallet.giftedBalance : 0;

  return (
    <Screen refreshing={refreshing} onRefresh={load}>
      {/* Header: title + spending limits */}
      <View style={styles.headRow}>
        <Text style={[styles.headTitle, { color: colors.text }]}>Wallet</Text>
        <Pressable
          onPress={() => { impact('light'); router.push('/spending-limits'); }}
          accessibilityLabel="Spending limits"
        >
          <Ionicons name="options-outline" size={22} color={colors.text} />
        </Pressable>
      </View>
      {/* Dual cards: Tokens + Earnings */}
      <View style={styles.cardRow}>
        <LinearGradient
          colors={[GOLD, GOLD_DEEP] as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bigCard}
        >
          <View style={styles.cardTop}>
            <Text style={styles.cardLabel}>TOKENS</Text>
            <View style={styles.tokenBadge}>
              <Text style={styles.tokenBadgeText}>T</Text>
            </View>
          </View>
          <Text style={styles.bigValue}>{wallet ? fmt(totalTokens) : '\u2014'}</Text>
          {wallet ? (
            <Text style={styles.cardSub}>
              {fmt(wallet.balance)} bought · {fmt(wallet.giftedBalance)} gifted
            </Text>
          ) : (
            <Text style={styles.cardSub}>Log in to see your balance</Text>
          )}
          <Pressable
            style={({ pressed }) => [styles.cardBtn, pressed && { opacity: 0.7 }]}
            onPress={() => { impact('light'); router.push('/buy-tokens'); }}
            accessibilityLabel="Buy Tokens"
          >
            <Text style={styles.cardBtnText}>Buy Tokens</Text>
          </Pressable>
        </LinearGradient>

        <LinearGradient
          colors={[TEAL, TEAL_DEEP] as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bigCard}
        >
          <View style={styles.cardTop}>
            <Text style={styles.cardLabel}>EARNINGS</Text>
            <Ionicons name="cash" size={16} color="#fff" />
          </View>
          <Text style={styles.bigValue}>{earnings ? fmt(earnings.available) : '\u2014'}</Text>
          {earnings ? (
            <Text style={styles.cardSub}>{fmt(earnings.pending)} pending</Text>
          ) : (
            <Text style={styles.cardSub}>For Favorites</Text>
          )}
          <Pressable
            style={({ pressed }) => [styles.cardBtn, pressed && { opacity: 0.7 }]}
            onPress={() => { impact('light'); router.push('/cash-out'); }}
            accessibilityLabel="Cash out"
          >
            <Text style={styles.cardBtnText}>Cash out</Text>
          </Pressable>
        </LinearGradient>
      </View>

      {/* Separation note */}
      <View style={styles.sepNote}>
        <Ionicons name="shield-checkmark-outline" size={16} color={TEAL} />
        <Text style={[styles.sepNoteText, { color: colors.muted }]}>
          Tokens and earnings are separate. Gift Points never turn into Tokens, and Tokens cannot be withdrawn.
        </Text>
      </View>

      {/* Token packages */}
      <View style={styles.buyHeadRow}>
        <Text style={[styles.sectionLabel, { color: colors.muted, marginBottom: 0 }]}>BUY TOKENS</Text>
        <Text style={{ color: TEAL, fontWeight: '900', fontSize: 14 }}>{'\u20A615 per Token'}</Text>
      </View>

      {packs.length === 0 && !refreshing ? (
        <EmptyState
          icon="wallet-outline"
          title="No packs available"
          body="Token packs are managed on the server. Pull to refresh once the backend is live."
        />
      ) : (
        <View style={{ gap: 12, marginBottom: spacing.lg }}>
          {packs.map((pack) => {
            const total = pack.tokens + bonus(pack);
            const price = fmt(priceCents(pack) / 100);
            return (
              <View
                key={pack.id}
                style={[styles.packCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                {pack.tokens === 500 ? (
                  <View style={styles.popPill}>
                    <Text style={styles.popText}>MOST POPULAR</Text>
                  </View>
                ) : null}
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
                  <Text style={[styles.price, { color: GOLD }]}>
                    {'\u20A6' + price}
                  </Text>
                </View>

                {bonus(pack) > 0 && (
                  <View style={[styles.bonusPill, { backgroundColor: GOLD + '22' }]}>
                    <Text style={{ color: GOLD, fontWeight: '700', fontSize: 12 }}>
                      +{bonus(pack)} bonus · {total} total
                    </Text>
                  </View>
                )}

                <Pressable
                  style={({ pressed }) => [
                    styles.buyBtn,
                    !!buyingId && { opacity: 0.6 },
                    pressed && { transform: [{ scale: 0.97 }] },
                  ]}
                  onPress={() => buy(pack)}
                  disabled={!!buyingId}
                  accessibilityLabel={'Buy ' + pack.name}
                >
                  <LinearGradient
                    colors={[GOLD, GOLD_DEEP] as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buyGradient}
                  >
                    <Text style={styles.buyText}>
                      {buyingId === pack.id ? 'Opening checkout\u2026' : 'Buy Tokens'}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      {/* Pay with */}
      <Text style={[styles.sectionLabel, { color: colors.muted }]}>PAY WITH</Text>
      <View style={styles.payRow}>
        {([
          ['card', 'Card', 'card-outline'],
          ['transfer', 'Transfer', 'business-outline'],
          ['mobile', 'Mobile money', 'phone-portrait-outline'],
        ] as [string, string, string][]).map(([key, label, icon]) => (
          <Pressable
            key={key}
            onPress={() => {
              impact('light');
              if (key === 'card') { setPayWith('card'); return; }
              Alert.alert('Payment methods', 'Card checkout is live. Transfer and mobile money arrive with the providers update.');
            }}
            style={[styles.payChip, { borderColor: payWith === key ? GOLD : colors.border }]}
            accessibilityLabel={label}
          >
            <Ionicons name={icon as any} size={22} color={payWith === key ? GOLD : colors.muted} />
            <Text style={{ color: payWith === key ? GOLD : colors.text, fontWeight: '800', fontSize: 14, marginTop: 6 }}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Weekly limit bar */}
      {week && week.cap != null ? (
        <View style={styles.weekBarWrap}>
          <Text style={{ color: colors.muted, fontSize: 13 }}>Weekly limit</Text>
          <View style={styles.weekBarTrack}>
            <View
              style={{
                width: week && week.cap ? Math.min(100, Math.round((week.spent / week.cap) * 100)) : 0 + '%',
                height: '100%',
                borderRadius: 3,
                backgroundColor: TEAL,
              }}
            />
          </View>
          <Text style={{ color: colors.muted, fontSize: 13 }}>
            {fmt(week.spent)} / {week.cap == null ? '—' : fmt(week.cap)}
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.lg,
  },
  bigCard: {
    flex: 1,
    borderRadius: radii.lg,
    padding: 14,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tokenBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenBadgeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
  bigValue: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
  },
  cardSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 10,
  },
  cardBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cardBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  packCard: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 14,
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
  buyBtn: {
    marginTop: spacing.md,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  buyGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
  },
  buyText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headTitle: {
    fontSize: 26,
    fontWeight: '900',
  },
  weekBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: spacing.sm,
  },
  weekBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(128,128,128,0.25)',
    overflow: 'hidden',
  },
  sepNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: spacing.lg },
  sepNoteText: { flex: 1, fontSize: 13, lineHeight: 19 },
  buyHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  popPill: { position: 'absolute', top: -10, right: 14, zIndex: 2, backgroundColor: TEAL, borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 4 },
  popText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  payRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.lg },
  payChip: { flex: 1, borderWidth: 1.5, borderRadius: radii.lg, alignItems: 'center', paddingVertical: 16 },
});
