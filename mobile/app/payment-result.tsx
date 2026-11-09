/** Payment result (UX 50/51) - Rally design
 * Payment Confirmed: success mark, amount + Tokens, method, reference,
 * new balance, Back to the Moment and View receipt (emailed copy).
 * Payment Failed: plain words, nothing charged, Try again on the SAME
 * order, another method, Contact support - the reference is kept.
 */
import { useState } from 'react';
import { Text, StyleSheet, View, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api } from '@/lib/api';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const RED = '#ef5350';

const METHODS: { id: string; label: string }[] = [
  { id: 'card', label: 'Card' },
  { id: 'bank', label: 'Bank transfer' },
  { id: 'mobile_money', label: 'Mobile money' },
];

export default function PaymentResultScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const params = useLocalSearchParams<{
    status?: string;
    tokens?: string;
    amount?: string;
    method?: string;
    reference?: string;
    purchaseId?: string;
    packId?: string;
    balance?: string;
    reason?: string;
  }>();

  const [status, setStatus] = useState(params.status === 'failed' ? 'failed' : 'confirmed');
  const [tokens, setTokens] = useState(Number(params.tokens || 0));
  const [amount, setAmount] = useState(params.amount || '');
  const [method, setMethod] = useState(params.method || 'card');
  const [reference, setReference] = useState(params.reference || '');
  const [balance, setBalance] = useState(params.balance || '');
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState('');

  const methodLabel = (m: string) => {
    const found = METHODS.find((x) => x.id === m);
    return found ? found.label : m;
  };

  async function attempt(m: string) {
    if (retrying) return;
    setRetrying(true);
    setError('');
    impact('medium');
    try {
      let res: any;
      if (params.purchaseId) {
        res = await api<any>('/api/money/purchases/' + params.purchaseId + '/retry', {
          method: 'POST',
          body: JSON.stringify({ paymentMethod: m }),
        });
      } else if (params.packId) {
        res = await api<any>('/api/tokens/purchase', {
          method: 'POST',
          body: JSON.stringify({ packId: params.packId, paymentMethod: m }),
        });
      } else {
        throw new Error('This payment cannot be retried here. Open Wallet and try again.');
      }
      if (res.purchase && res.purchase.status === 'completed') {
        impact('success');
        setTokens(Number(res.purchase.tokens || tokens));
        setMethod(res.purchase.paymentMethod || m);
        if (res.purchase.reference) setReference(String(res.purchase.reference));
        if (res.wallet) setBalance(String(Number(res.wallet.balance) + Number(res.wallet.giftedBalance || 0)));
        setStatus('confirmed');
        setSheetOpen(false);
      } else {
        throw new Error('The payment is still waiting on the provider. Check Wallet soon.');
      }
    } catch (e: any) {
      setError(e && e.message ? e.message : 'Could not retry. Try again shortly.');
    } finally {
      setRetrying(false);
    }
  }

  return (
    <Screen scroll={false}>
      <View style={styles.wrap}>
        <View
          style={[
            styles.markCircle,
            { backgroundColor: status === 'confirmed' ? GOLD + '22' : RED + '22' },
          ]}
        >
          <Ionicons
            name={status === 'confirmed' ? 'checkmark' : 'close'}
            size={44}
            color={status === 'confirmed' ? GOLD : RED}
          />
        </View>

        {status === 'confirmed' ? (
          <>
            <Text style={[styles.title, { color: colors.text }]}>Payment confirmed</Text>
            <Text style={[styles.amount, { color: colors.text }]}>{'\u20A6' + amount}</Text>
            <Text style={[styles.tokensLine, { color: colors.muted }]}>
              {tokens + ' Tokens added to your wallet'}
            </Text>
            <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>METHOD</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{methodLabel(method)}</Text>
              </View>
              <View style={[styles.detailRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>REFERENCE</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{reference || '\u2014'}</Text>
              </View>
              <View style={[styles.detailRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>NEW BALANCE</Text>
                <Text style={[styles.detailValue, { color: GOLD }]}>
                  {balance ? 'T ' + balance : 'Open Wallet to see your balance'}
                </Text>
              </View>
            </View>
            {receiptOpen ? (
              <View style={[styles.receiptCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.receiptTitle, { color: colors.text }]}>Receipt</Text>
                <Text style={[styles.receiptBody, { color: colors.muted }]}>
                  {'Tokens purchase \u00B7 ' + amount + ' \u00B7 ' + tokens + ' T \u00B7 ' + methodLabel(method) + ' \u00B7 ref ' + (reference || '\u2014')}
                </Text>
                <Text style={[styles.receiptBody, { color: colors.muted }]}>
                  A copy was sent to your email.
                </Text>
              </View>
            ) : null}
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
              onPress={() => { impact('light'); router.back(); }}
              accessibilityLabel="Back to the Moment"
            >
              <LinearGradient
                colors={[GOLD, GOLD_DEEP] as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
              >
                <Text style={styles.btnText}>Back to the Moment</Text>
              </LinearGradient>
            </Pressable>
            <Pressable
              style={[styles.secondaryBtn, { borderColor: colors.border }]}
              onPress={() => { impact('light'); setReceiptOpen(!receiptOpen); }}
              accessibilityLabel="View receipt"
            >
              <Text style={[styles.secondaryText, { color: colors.text }]}>
                {receiptOpen ? 'Hide receipt' : 'View receipt'}
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={[styles.title, { color: colors.text }]}>Payment failed</Text>
            <Text style={[styles.bodyText, { color: colors.text }]}>
              Your bank declined the payment. Nothing was charged and your Tokens are unchanged.
            </Text>
            {params.reason ? (
              <Text style={[styles.reason, { color: colors.muted }]}>{params.reason}</Text>
            ) : null}
            <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>AMOUNT</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{'\u20A6' + (amount || '\u2014')}</Text>
              </View>
              <View style={[styles.detailRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>ORDER REFERENCE</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{reference || 'kept with your order'}</Text>
              </View>
            </View>
            {error ? <Text style={[styles.reason, { color: RED }]}>{error}</Text> : null}
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
              onPress={() => attempt(method)}
              disabled={retrying || (!params.purchaseId && !params.packId)}
              accessibilityLabel="Try again"
            >
              <LinearGradient
                colors={[GOLD, GOLD_DEEP] as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.btnGradient, (!params.purchaseId && !params.packId) && { opacity: 0.5 }]}
              >
                <Text style={styles.btnText}>{retrying ? 'Trying\u2026' : 'Try again'}</Text>
              </LinearGradient>
            </Pressable>
            <Pressable
              style={[styles.secondaryBtn, { borderColor: colors.border }]}
              onPress={() => { impact('light'); setSheetOpen(!sheetOpen); }}
              accessibilityLabel="Choose another method"
            >
              <Text style={[styles.secondaryText, { color: colors.text }]}>Choose another method</Text>
            </Pressable>
            {sheetOpen ? (
              <View style={[styles.methodSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {METHODS.map((m) => (
                  <Pressable
                    key={m.id}
                    style={[styles.methodRow, { borderColor: colors.border }]}
                    onPress={() => attempt(m.id)}
                    disabled={retrying}
                    accessibilityLabel={m.label}
                  >
                    <Text style={[styles.methodText, { color: colors.text }]}>{m.label}</Text>
                    {retrying ? <ActivityIndicator color={GOLD} /> : null}
                  </Pressable>
                ))}
              </View>
            ) : null}
            <Pressable
              onPress={() => { impact('light'); router.push('/support'); }}
              accessibilityLabel="Contact support"
            >
              <Text style={[styles.supportText, { color: colors.primary }]}>Contact support</Text>
            </Pressable>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', paddingTop: 48, gap: 10 },
  markCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 24, fontWeight: '900' },
  amount: { fontSize: 34, fontWeight: '900', marginTop: 2 },
  tokensLine: { fontSize: 14, fontWeight: '600' },
  bodyText: { fontSize: 15, lineHeight: 22, textAlign: 'center', paddingHorizontal: spacing.lg },
  reason: { fontSize: 13, textAlign: 'center', paddingHorizontal: spacing.lg },
  detailCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: radii.lg,
    marginTop: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'transparent',
  },
  detailLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  detailValue: { fontSize: 14, fontWeight: '700' },
  receiptCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 14,
  },
  receiptTitle: { fontSize: 13, fontWeight: '900', marginBottom: 6 },
  receiptBody: { fontSize: 12, lineHeight: 18 },
  primaryBtn: { width: '100%', borderRadius: radii.full, marginTop: 14, overflow: 'hidden' },
  btnGradient: { alignItems: 'center', justifyContent: 'center', paddingVertical: 15 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  secondaryBtn: {
    width: '100%',
    borderWidth: 1,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  secondaryText: { fontWeight: '700', fontSize: 15 },
  methodSheet: { width: '100%', borderWidth: 1, borderRadius: radii.md, padding: 6 },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  methodText: { fontSize: 15, fontWeight: '600' },
  supportText: { fontSize: 14, fontWeight: '700', marginTop: 6 },
});
