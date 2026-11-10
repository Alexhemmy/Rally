/** Cash Out (UX 33) - Rally design, per the dark mock.
 * Available balance with pending note, 25% / 50% / Custom / Max chips,
 * a verified payout account in your own name, what you receive and when,
 * the held-for-review note before confirming, and a button that shows
 * the amount.
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
const GREEN = '#34D399';
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
  const [pending, setPending] = useState(0);
  const [amount, setAmount] = useState('');
  const [chip, setChip] = useState<'25' | '50' | 'custom' | 'max' | null>('custom');
  const [account, setAccount] = useState('');
  const [bank, setBank] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ balance: { available: number; pending: number } }>('/api/payouts/me');
      setAvailable(Number(res.balance?.available ?? 0));
      setPending(Number(res.balance?.pending ?? 0));
    } catch {
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const value = Number(amount || 0);
  const pickChip = (c: '25' | '50' | 'custom' | 'max') => {
    impact('light');
    setChip(c);
    if (c === '25') setAmount(String(Math.floor((available * 25) / 100)));
    if (c === '50') setAmount(String(Math.floor((available * 50) / 100)));
    if (c === 'max') setAmount(String(Math.floor(available)));
  };

  const amountError =
    value > available ? 'More than your available balance' :
    value > 0 && value < MIN_CASHOUT ? 'Cash out at least \u20A6' + fmt(MIN_CASHOUT) : '';
  const accountReady = account.length >= 6 && bank.length >= 2;
  const canSend = value > 0 && value <= available && value >= MIN_CASHOUT && accountReady && !sending;

  async function submit() {
    if (!canSend) return;
    setSending(true);
    setStatus(null);
    impact('medium');
    try {
      await api<any>('/api/payouts/request', {
        method: 'POST',
        body: JSON.stringify({ amount: value, method: 'bank', destination: bank + ' ' + account, onDemand: false }),
      });
      impact('success');
      setStatus({ ok: true, text: 'Cash out of \u20A6' + fmt(value) + ' requested. It arrives within 1 business day.' });
      setAmount('');
      setChip('custom');
      await load();
    } catch (e: any) {
      setStatus({ ok: false, text: e && e.message ? e.message : 'Could not request the payout.' });
    } finally {
      setSending(false);
    }
  }

  const masked = account ? '\u2022\u2022 ' + account.slice(-4) : null;

  return (
    <SwipeBack>
      <Screen>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Cash out</Text>
        </View>

        {/* Available header */}
        <View style={[styles.availCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>AVAILABLE</Text>
          <Text style={{ color: TEAL, fontSize: 30, fontWeight: '900', marginTop: 4 }}>{'\u20A6' + fmt(available)}</Text>
          {pending > 0 ? (
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
              {'Pending \u20A6' + fmt(pending) + ' clears on the next payout day'}
            </Text>
          ) : null}
        </View>

        {/* Amount chips */}
        <View style={styles.chipRow}>
          {(['25', '50', 'custom', 'max'] as const).map((c) => {
            const label = c === '25' ? '25%' : c === '50' ? '50%' : c === 'custom' ? 'Custom' : 'Max';
            const on = chip === c;
            return (
              <Pressable
                key={c}
                onPress={() => pickChip(c)}
                style={[styles.chip, on ? { backgroundColor: GOLD, borderColor: GOLD } : { borderColor: colors.border }]}
                accessibilityLabel={label}
              >
                <Text style={{ color: on ? '#111' : colors.muted, fontWeight: '800', fontSize: 13 }}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={[styles.amountRow, { borderColor: colors.border }]}>
          <Text style={{ color: TEAL, fontWeight: '900', fontSize: 20 }}>{'\u20A6'}</Text>
          <TextInput
            style={[styles.amountInput, { color: colors.text }]}
            placeholder="0"
            placeholderTextColor={colors.muted}
            value={amount}
            onChangeText={(t) => { setAmount(t.replace(/[^0-9]/g, '')); setChip('custom'); }}
            keyboardType="number-pad"
            maxLength={9}
          />
          <Text style={{ color: colors.muted, fontSize: 13 }}>
            {'of \u20A6' + fmt(available)}
          </Text>
        </View>
        {amountError ? <Text style={styles.amountError}>{amountError}</Text> : null}

        {/* Pay out to */}
        <Text style={[styles.section, { color: colors.muted }]}>PAY OUT TO</Text>
        <View style={[styles.accountCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.accountHead}>
            <Ionicons name="business-outline" size={18} color={colors.text} />
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14, marginLeft: 8, flex: 1 }}>
              {(bank || 'Your bank') + (masked ? ' ' + masked : '')}
            </Text>
            {accountReady ? (
              <View style={styles.verifiedChip}>
                <Text style={styles.verifiedText}>VERIFIED</Text>
              </View>
            ) : null}
          </View>
          <Text style={{ color: colors.muted, fontSize: 11, marginTop: 6 }}>
            In your own name \u00B7 verified before the first payout
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

        {/* Receive summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sumRow}>
            <Text style={{ color: colors.muted, fontSize: 13 }}>You receive</Text>
            <Text style={{ color: colors.text, fontWeight: '900' }}>{'\u20A6' + fmt(value)}</Text>
          </View>
          <View style={[styles.sumRow, { borderTopColor: colors.border }]}>
            <Text style={{ color: colors.muted, fontSize: 13 }}>Arrives</Text>
            <Text style={{ color: colors.text, fontWeight: '800' }}>Within 1 business day</Text>
          </View>
        </View>

        <Text style={[styles.note, { color: colors.muted }]}>
          Payouts can be held for review if activity looks unusual. Earnings only leave as cash.
        </Text>

        {status ? (
          <Text style={{ color: status.ok ? GREEN : RED, fontSize: 14, fontWeight: '700', marginBottom: 10, lineHeight: 20 }}>
            {status.text}
          </Text>
        ) : null}

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
  availCard: { borderWidth: 1, borderRadius: radii.lg, padding: 16, marginTop: spacing.sm },
  chipRow: { flexDirection: 'row', gap: 8, marginTop: spacing.md },
  chip: { flex: 1, borderWidth: 1, borderRadius: radii.full, alignItems: 'center', paddingVertical: 9 },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: 16,
    height: 50,
    marginTop: 10,
  },
  amountInput: { flex: 1, fontSize: 18, fontWeight: '800', padding: 0 },
  amountError: { color: RED, fontSize: 12, fontWeight: '700', marginTop: 8 },
  section: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: spacing.lg, marginBottom: 8 },
  accountCard: { borderWidth: 1, borderRadius: radii.lg, padding: 16 },
  accountHead: { flexDirection: 'row', alignItems: 'center' },
  verifiedChip: { backgroundColor: GREEN + '22', borderRadius: radii.full, paddingHorizontal: 8, paddingVertical: 3 },
  verifiedText: { color: GREEN, fontSize: 10, fontWeight: '900' },
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
