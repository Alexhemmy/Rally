/** Pay (mock 11) - payment method picker for a token pack.
 * Real purchase: POST /api/tokens/purchase {packId, paymentMethod} with
 * card / bank / mobile_money (USSD rides on mobile money). With provider
 * keys the backend returns a checkout URL - we open it, then confirm via
 * /api/tokens/purchase/confirm and hand the outcome to /payment-result.
 * In dev the purchase completes instantly. Saved cards are not stored
 * yet, so "Add a new card" goes through the provider checkout.
 */
import { useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, Linking, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const TEAL = '#34D399';

type Method = { id: 'card' | 'bank' | 'mobile_money'; label: string; sub: string; icon: keyof typeof Ionicons.glyphMap };

const METHODS: Method[] = [
  { id: 'card', label: 'Card', sub: 'Pay with your debit card', icon: 'card-outline' },
  { id: 'bank', label: 'Bank transfer', sub: 'Pay from any Nigerian bank', icon: 'business-outline' },
  { id: 'mobile_money', label: 'USSD', sub: 'Dial a code on your phone', icon: 'phone-portrait-outline' },
];

export default function PayScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const params = useLocalSearchParams<{ packId?: string; tokens?: string; amount?: string }>();

  const [method, setMethod] = useState<Method['id']>('card');
  const [paying, setPaying] = useState(false);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);

  const tokens = Number(params.tokens || 0);
  const amount = params.amount || '0';

  useEffect(() => {
    if (!params.packId) {
      Alert.alert('Pay', 'Pick a token pack first.', [{ text: 'OK', onPress: () => router.back() }]);
    }
  }, [params.packId]);

  async function confirmAndFinish(reference: string) {
    try {
      const c = await api<any>('/api/tokens/purchase/confirm', {
        method: 'POST',
        body: JSON.stringify({ reference }),
      });
      if (c.purchase && c.purchase.status === 'completed') {
        impact('success');
        router.replace({
          pathname: '/payment-result',
          params: {
            status: 'confirmed',
            tokens: String(c.purchase.tokens ?? tokens),
            amount,
            method,
            reference,
            balance: c.wallet ? String(Number(c.wallet.balance) + Number(c.wallet.giftedBalance || 0)) : '',
          },
        });
        return;
      }
      router.replace({ pathname: '/payment-result', params: { status: 'failed', tokens: String(tokens), amount, method, reference, packId: params.packId || '', reason: 'The payment is still pending with the provider.' } });
    } catch (e: any) {
      router.replace({ pathname: '/payment-result', params: { status: 'failed', tokens: String(tokens), amount, method, reference, packId: params.packId || '', reason: e.message || '' } });
    }
  }

  async function pay() {
    if (paying || awaitingConfirm) return;
    if (!getToken()) { router.push('/login'); return; }
    setPaying(true);
    impact('medium');
    try {
      const res = await api<{
        purchase?: { id?: string; status: string; tokens?: number; reference?: string };
        checkout?: { authorizationUrl?: string; reference?: string };
        wallet?: any;
      }>('/api/tokens/purchase', {
        method: 'POST',
        body: JSON.stringify({ packId: params.packId, paymentMethod: method }),
      });

      if (res.checkout && res.checkout.authorizationUrl) {
        setPaying(false);
        setAwaitingConfirm(true);
        await Linking.openURL(res.checkout.authorizationUrl);
        Alert.alert(
          'Complete your payment',
          'Finish the payment in the page that just opened, then come back and tap "I have paid".',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => setAwaitingConfirm(false) },
            {
              text: 'I have paid',
              onPress: () => {
                const ref = res.checkout && res.checkout.reference ? res.checkout.reference : '';
                if (ref) confirmAndFinish(ref);
                else setAwaitingConfirm(false);
              },
            },
          ],
        );
        return;
      }
      if (res.purchase && res.purchase.status === 'completed') {
        impact('success');
        router.replace({
          pathname: '/payment-result',
          params: {
            status: 'confirmed',
            tokens: String(res.purchase.tokens ?? tokens),
            amount,
            method,
            reference: String(res.purchase.reference ?? ''),
            balance: res.wallet ? String(Number(res.wallet.balance) + Number(res.wallet.giftedBalance || 0)) : '',
          },
        });
        return;
      }
      throw new Error('The payment did not complete. Nothing was charged.');
    } catch (e: any) {
      impact('error');
      router.replace({
        pathname: '/payment-result',
        params: {
          status: 'failed',
          tokens: String(tokens),
          amount,
          method,
          reference: '',
          packId: params.packId || '',
          reason: e.message || '',
        },
      });
    } finally {
      setPaying(false);
    }
  }

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Pay</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
            <Text style={{ color: colors.muted, fontSize: 16 }}>{tokens.toLocaleString('en-US') + ' Tokens'}</Text>
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16 }}>{'\u20A6' + amount}</Text>
          </View>
          <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
            <Text style={{ color: colors.muted, fontSize: 16 }}>Fees</Text>
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16 }}>{'\u20A60'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={{ color: colors.muted, fontSize: 16 }}>Total</Text>
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 18 }}>{'\u20A6' + amount}</Text>
          </View>
        </View>

        <Text style={[styles.section, { color: colors.muted }]}>PAY WITH</Text>

        {METHODS.map((m) => {
          const active = method === m.id;
          return (
            <Pressable
              key={m.id}
              onPress={() => { impact('light'); setMethod(m.id); }}
              style={[styles.methodCard, { backgroundColor: colors.surface, borderColor: active ? GOLD : colors.border }, active && { borderWidth: 1.5 }]}
              accessibilityLabel={m.label}
            >
              <Ionicons name={m.icon} size={22} color={active ? GOLD : colors.muted} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 }}>{m.label}</Text>
                <Text style={{ color: colors.muted, fontSize: 14, marginTop: 2 }}>{m.sub}</Text>
              </View>
              <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={22} color={active ? GOLD : colors.muted} />
            </Pressable>
          );
        })}

        <Pressable
          style={[styles.methodCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => { impact('light'); Alert.alert('Add a new card', 'Card details are entered on the secure provider page - Rally never sees your full card number.'); }}
          accessibilityLabel="Add a new card"
        >
          <Ionicons name="add" size={22} color={colors.muted} />
          <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17, marginLeft: 14 }}>Add a new card</Text>
        </Pressable>

        <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Ionicons name="lock-closed-outline" size={16} color={TEAL} />
          <Text style={[styles.noteText, { color: colors.textSecondary }]}>
            Payments are processed securely. Rally never sees your full card number.
          </Text>
        </View>

        <Pressable onPress={pay} disabled={paying || awaitingConfirm} accessibilityLabel={'Pay ' + amount}>
          <LinearGradient
            colors={[GOLD, GOLD_DEEP] as [string, string]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.payBtn, (paying || awaitingConfirm) && { opacity: 0.6 }]}
          >
            {paying || awaitingConfirm ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18 }}>{'Pay \u20A6' + amount}</Text>
            )}
          </LinearGradient>
        </Pressable>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  summaryCard: { borderWidth: 1, borderRadius: radii.lg },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: 1 },
  section: { fontWeight: '900', fontSize: 13, letterSpacing: 1, marginTop: spacing.md, marginBottom: 8 },
  methodCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radii.lg, padding: 16, marginBottom: 12 },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 14,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  noteText: { flex: 1, fontSize: 14, lineHeight: 20 },
  payBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: radii.full },
});
