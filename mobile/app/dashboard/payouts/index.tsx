import { useEffect, useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SoundTextInput } from '@/components/SoundTextInput';
import { api, getToken } from '@/lib/api';
import { colors, spacing, radii } from '@/constants/theme';
import { SwipeBack } from '@/components/SwipeBack';

export default function PayoutsScreen() {
  const [data, setData] = useState<any>(null);
  const [amount, setAmount] = useState('10');
  const [destination, setDestination] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  function load() {
    const token = getToken();
    if (!token) return;
    api('/api/payouts/me', { token }).then(setData).catch((e: any) => setError(e.message));
  }
  useEffect(() => { load(); }, []);

  async function request() {
    const token = getToken();
    if (!token) return;
    try {
      await api('/api/payouts/request', {
        method: 'POST', token,
        body: JSON.stringify({ amount: Number(amount), method: 'bank', destination, onDemand: false }),
      });
      setMsg('Payout requested');
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <SwipeBack>
      <Screen>
        <Text style={styles.h1}>Payouts</Text>
        <View style={styles.card}>
          <Text style={styles.name}>Available: {data ? String(data.balance?.available) : '—'}</Text>
        </View>
        <SoundTextInput style={styles.input} placeholder="Amount" placeholderTextColor={colors.muted}
          value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
        <SoundTextInput style={styles.input} placeholder="Bank / mobile money destination" placeholderTextColor={colors.muted}
          value={destination} onChangeText={setDestination} />
        <PrimaryButton label="Request payout" onPress={request} />
        {!!msg && <Text style={styles.ok}>{msg}</Text>}
        {!!error && <Text style={styles.err}>{error}</Text>}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: spacing.sm, marginBottom: 12 },
  name: { color: colors.text, fontWeight: '700', fontSize: 16 },
  input: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md,
    padding: 14, color: colors.text, marginBottom: 12, minHeight: 48, fontSize: 16,
  },
  ok: { color: colors.success, marginTop: 8 },
  err: { color: colors.danger, marginTop: 8 },
  card: {
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1,
    borderColor: colors.border, padding: spacing.md, marginBottom: 10,
  },
});
