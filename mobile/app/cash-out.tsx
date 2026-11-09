/** Cash Out (UX 33) - Rally design
 * Amount field with quick percentages, the verified payout account in
 * your own name, a summary of what arrives and when, and a held-for-review
 * note stated before you confirm. The button shows the amount.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api } from '@/lib/api';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const TEAL = '#00897B';
const RED = '#ef5350';
const MIN_CASHOUT = 1000;

function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export default function CashOutScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();

  const [available, setAvailable] = useState(0);
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState('');
  const [bank, setBank] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ balance: { available: number } }>('/api/payouts/me');
      setAvailable(Number(res.balance?.available ?? 0));
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const value = Number(amount || 0);
  const setPercent = (p: number) => {
    impact('light');
    setAmount(String(Math.floor((available * p) / 100)));
  };

  const amountError =
    value > available ? 'More than your available balance' :
    value > 0 && value < MIN_CASHOUT ? 'Cash out at least \u20A6' + fmt(MIN_CASHOUT) : '';
  const canSend = value > 0 && value <= available && value >= MIN_CASHOUT && account.length >= 6 && bank.length >= 2 && !sending;

  async function submit() {
    if (!canSend) return;
    setSending(true);
    setStatus(null);
    impact('medium');
    try {
      await api<any>('/api/payouts/request', {
        method: 'POST',
        body: JSON.stringify({
          amount: value,
          method: 'bank',
          destination: bank + ' ' + account,
          onDemand: false,
        }),
      });
      impact('success');
      setStatus({
        ok: true,
        text: 'Cash out of \u20A6' + fmt(value) + ' requested. It arrives on the next payout day, or sooner once reviewed.',
      });
      setAmount('');
      await load();
    } catch (e: any) {
      setStatus({ ok: false, text: e && e.message ? e.message : 'Could not request the payout.' });
    } finally {
      setSending(false);
    }
  }

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Cash out</Text>
        </View>

        {/* Amount */}
        <View style={[styles.amountCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '800' }}>AMOUNT TO CASH OUT</Text>
          <View style={[styles.amountRow, { borderColor: colors.border }]}>
            <Text style={{ color: TEAL, fontWeight: '900', fontSize: 20 }}>{'\u20A6'}</Text>
            <TextInput
              style={[styles.amountInput, { color: colors.text }]}
              placeholder="0"
              placeholderTextColor={colors.muted}
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={9}
            />
            <Text style={{ color: colors.muted, fontSize: 13 }}>
              {'of \u20A6' + fmt(available) + ' available'}
            </Text>
          </View>
          <View style={styles.percentRow}>
            {[25, 50, 75, 100].map((p) => (
              <Pressable
                key={p}
                onPress={() => setPercent(p)}
                style={[styles.percentChip, { borderColor: colors.border }]}
                accessibilityLabel={p + ' percent'}
              >
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>{p + '%'}</Text>
              </Pressable>
            ))}
          </View>
          {amountError ? <Text style={styles.amountError}>{amountError}</Text> : null}
        </View>

        {/* Verified payout account */}
        <View style={[styles.accountCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.accountHead}>
            <Ionicons name="shield-checkmark" size={20} color={TEAL} />
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15, marginLeft: 8 }}>
              Verified payout account
            </Text>
          </View>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>
            Payouts go only to an account in your own name. KYC protects your earnings.
          </Text>
          <TextInput
            style={[styles.accountInput, { borderColor: colors.border, color: colors.text }]}
            placeholder="Bank name"
            placeholderTextColor={colors.muted}
            value={bank}
            onChangeText={setBank}
          />
          <TextInput
            style={[styles.accountInput, { borderColor: colors.border, color: colors.text }]}
            placeholder="Account number (10 digits)"
            placeholderTextColor={colors.muted}
            value={account}
            onChangeText={(t) => setAccount(t.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            maxLength={10}
          />
        </View>

        {/* Summary of what arrives and when */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sumRow}>
            <Text style={{ color: colors.muted, fontSize: 13 }}>You cash out</Text>
            <Text style={{ color: colors.text, fontWeight: '800' }}>{'\u20A6' + fmt(value)}</Text>
          </View>
          <View style={[styles.sumRow, { borderTopColor: colors.border }]}>
            <Text style={{ color: colors.muted, fontSize: 13 }}>Fee</Text>
            <Text style={{ color: colors.text, fontWeight: '800' }}>{'\u20A60'}</Text>
          </View>
          <View style={[styles.sumRow, { borderTopColor: colors.border }]}>
            <Text style={{ color: colors.muted, fontSize: 13 }}>Arrives</Text>
            <Text style={{ color: colors.text, fontWeight: '800' }}>Next payout day</Text>
          </View>
        </View>

        {/* Held-for-review note, stated before you confirm */}
        <Text style={[styles.note, { color: colors.muted }]}>
          Payouts can be held for review if recent activity looks unusual. The screen will say so and you keep the reference either way.
        </Text>

        {status ? (
          <Text style={{ color: status.ok ? TEAL : RED, fontSize: 14, fontWeight: '700', marginBottom: 10 }}>
            {status.text}
          </Text>
        ) : null}

        {/* Sticky gold primary button showing the amount */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable
            style={({ pressed }) => [styles.sendBtn, pressed && { opacity: 0.85 }]}
            onPress={submit}
            disabled={!canSend}
            accessibilityLabel="Cash out"
          >
            <LinearGradient
              colors={[GOLD, GOLD_DEEP] as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.sendGradient, !canSend && { opacity: 0.5 }]}
            >
              <Text style={styles.sendText}>{sending ? 'Sending\u2026' : 'Cash out \u20A6' + fmt(value)}</Text>
            </LinearGradient>
          </Pressable>
          {!canSend && value === 0 ? (
            <Text style={styles.hint}>Enter an amount to cash out.</Text>
          ) : null}
        </KeyboardAvoidingView>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.sm },
  h1: { fontSize: 24, fontWeight: '900' },
  amountCard: { borderWidth: 1, borderRadius: radii.lg, padding: 16, marginTop: spacing.md },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: 16,
    height: 50,
    marginTop: 12,
  },
  amountInput: { flex: 1, fontSize: 18, fontWeight: '800', padding: 0 },
  percentRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  percentChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.full,
    alignItems: 'center',
    paddingVertical: 8,
  },
  amountError: { color: RED, fontSize: 12, fontWeight: '700', marginTop: 8 },
  accountCard: { borderWidth: 1, borderRadius: radii.lg, padding: 16, marginTop: spacing.md },
  accountHead: { flexDirection: 'row', alignItems: 'center' },
  accountInput: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 12,
    fontSize: 15,
  },
  summaryCard: { borderWidth: 1, borderRadius: radii.lg, padding: 16, marginTop: spacing.md },
  sumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'transparent',
  },
  note: { fontSize: 12, lineHeight: 18, marginTop: 12 },
  sendBtn: { borderRadius: radii.full, marginTop: spacing.md, overflow: 'hidden' },
  sendGradient: { alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  sendText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  hint: { color: '#8A8A9E', fontSize: 12, textAlign: 'center', marginTop: 8 },
});
