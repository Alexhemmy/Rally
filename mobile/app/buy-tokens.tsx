/** Buy Tokens (mock 10) - pack picker.
 * Real packs from GET /api/tokens/packs, balance from /api/tokens/wallet,
 * monthly limit left from /api/limits. The cheapest pack per Token gets
 * the BEST VALUE badge. Continue hands the chosen pack to the Pay screen.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const TEAL = '#34D399';

type Pack = { id: string; name: string; tokens: number; bonus_tokens?: number; bonusTokens?: number; price_cents?: number; priceCents?: number };

function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export default function BuyTokensScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();

  const [packs, setPacks] = useState<Pack[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [monthLeft, setMonthLeft] = useState<number | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await api<{ packs: Pack[] }>('/api/tokens/packs', { skipAuth: true });
      setPacks(r.packs || []);
      if (getToken()) {
        const w = await api<{ wallet: any }>('/api/tokens/wallet');
        setBalance(Number(w.wallet?.balance ?? 0) + Number(w.wallet?.giftedBalance ?? 0));
        const l = await api<any>('/api/limits');
        if (l.monthlySpendCap != null) {
          setMonthLeft(Math.max(0, Number(l.monthlySpendCap) - Number(l.spentThisMonth || 0)));
        } else {
          setMonthLeft(null);
        }
      }
    } catch { /* offline */ }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const bonusOf = (p: Pack) => Number(p.bonusTokens ?? p.bonus_tokens ?? 0);
  const priceOf = (p: Pack) => Number(p.priceCents ?? p.price_cents ?? 0);
  const totalOf = (p: Pack) => p.tokens + bonusOf(p);
  const perToken = (p: Pack) => (totalOf(p) > 0 ? priceOf(p) / totalOf(p) : Infinity);
  const bestId = packs.length > 0 ? packs.reduce((a, b) => (perToken(b) < perToken(a) ? b : a)).id : null;
  const pickedPack = packs.find((p) => p.id === picked) || null;

  return (
    <Screen refreshing={refreshing} onRefresh={load}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={[styles.h1, { color: colors.text }]}>Buy Tokens</Text>
        <View style={{ width: 26 }} />
      </View>

      {loading ? <ActivityIndicator color={GOLD} style={{ marginTop: 20 }} /> : null}

      {/* Balance */}
      <View style={[styles.balanceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.tokenCoin}>
          <Text style={{ color: '#111', fontWeight: '900', fontSize: 16 }}>T</Text>
        </View>
        <View style={{ marginLeft: 14 }}>
          <Text style={{ color: colors.muted, fontSize: 14 }}>Your balance</Text>
          <Text style={{ color: colors.text, fontWeight: '900', fontSize: 24 }}>
            {balance === null ? 'Log in to see' : fmt(balance) + ' Tokens'}
          </Text>
        </View>
      </View>

      {/* Packs */}
      {packs.map((p) => {
        const active = picked === p.id;
        const isBest = p.id === bestId;
        return (
          <Pressable
            key={p.id}
            onPress={() => { impact('light'); setPicked(p.id); }}
            style={[styles.packCard, { backgroundColor: colors.surface, borderColor: active ? GOLD : colors.border }, active && { borderWidth: 1.5 }]}
            accessibilityLabel={p.name}
          >
            {isBest ? (
              <View style={styles.bestBadge}>
                <Text style={styles.bestText}>BEST VALUE</Text>
              </View>
            ) : null}
            <View style={styles.tokenCoin}>
              <Text style={{ color: '#111', fontWeight: '900', fontSize: 16 }}>T</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 20 }}>{fmt(totalOf(p))}</Text>
              <Text style={{ color: colors.muted, fontSize: 14, marginTop: 1 }}>
                {p.name + (bonusOf(p) > 0 ? ' \u00b7 +' + bonusOf(p) + ' bonus' : '')}
                {isBest ? '' : ' \u00b7 \u20A6' + perToken(p).toFixed(2) + ' per Token'}
              </Text>
            </View>
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 19 }}>{'\u20A6' + fmt(priceOf(p) / 100)}</Text>
          </Pressable>
        );
      })}

      {/* Limit note */}
      <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        <Ionicons name="shield-checkmark-outline" size={16} color={TEAL} />
        <Text style={[styles.noteText, { color: colors.textSecondary }]}>
          {monthLeft === null
            ? 'Tokens are for sending Gifts. They cannot be withdrawn or sold.'
            : 'Tokens are for sending Gifts. They cannot be withdrawn or sold. You have \u20A6' + fmt(monthLeft * 10) + ' left in your monthly limit.'}
        </Text>
      </View>

      {/* Continue */}
      <Pressable
        onPress={() => {
          if (!pickedPack) return;
          impact('medium');
          router.push({
            pathname: '/pay',
            params: {
              packId: pickedPack.id,
              tokens: String(totalOf(pickedPack)),
              amount: fmt(priceOf(pickedPack) / 100),
            },
          });
        }}
        disabled={!pickedPack}
        accessibilityLabel="Continue"
      >
        <LinearGradient
          colors={[GOLD, GOLD_DEEP] as [string, string]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.continueBtn, !pickedPack && { opacity: 0.4 }]}
        >
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18 }}>
            {pickedPack ? 'Continue \u00b7 \u20A6' + fmt(priceOf(pickedPack) / 100) : 'Pick a pack'}
          </Text>
        </LinearGradient>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  balanceCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radii.lg, padding: 16, marginBottom: 14 },
  tokenCoin: { width: 44, height: 44, borderRadius: 22, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' },
  packCard: { borderWidth: 1, borderRadius: radii.lg, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  bestBadge: {
    position: 'absolute',
    top: -10,
    right: 14,
    backgroundColor: TEAL,
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  bestText: { color: '#111', fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 14,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  noteText: { flex: 1, fontSize: 14, lineHeight: 20 },
  continueBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: radii.full, marginTop: 'auto' },
});
