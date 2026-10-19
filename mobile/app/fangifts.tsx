import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, TextInput } from 'react-native';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SwipeBack } from '@/components/SwipeBack';
import { api } from '@/lib/api';
import { colors, spacing, radii } from '@/constants/theme';

type FanGift = {
  id: string;
  kind: string;
  tokens: number | null;
  status: string;
};

export default function Page() {
  const [received, setReceived] = useState<FanGift[]>([]);
  const [sent, setSent] = useState<FanGift[]>([]);
  const [handle, setHandle] = useState('');
  const [amount, setAmount] = useState('10');
  const [msg, setMsg] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [r1, r2] = await Promise.all([
        api<{ gifts: FanGift[] }>('/api/fangifts/received'),
        api<{ gifts: FanGift[] }>('/api/fangifts/sent'),
      ]);
      setReceived(r1.gifts || []);
      setSent(r2.gifts || []);
    } catch { /* offline */ } finally { setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function sendTokens() {
    setMsg('');
    try {
      await api('/api/fangifts/tokens', {
        method: 'POST',
        body: JSON.stringify({ recipientHandle: handle, amount: parseInt(amount, 10) || 0 }),
      });
      setMsg('Sent! Recipient has 72 hours to accept.');
      load();
    } catch (e: any) {
      setMsg(e.message || 'Send failed');
    }
  }

  async function act(id: string, action: 'accept' | 'decline') {
    try {
      await api(`/api/fangifts/${id}/${action}`, { method: 'POST' });
      load();
    } catch (e: any) {
      setMsg(e.message || 'Action failed');
    }
  }

  return (
    <SwipeBack>
      <Screen refreshing={refreshing} onRefresh={load}>
        <Text style={styles.h1}>Fan Gifts</Text>
        <Text style={styles.muted}>
          Send Tokens to fellow fans. Received Tokens are spend-only on Gifts — never cashed out.
        </Text>
        {msg ? <Text style={styles.badge}>{msg}</Text> : null}
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Recipient handle"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            value={handle}
            onChangeText={setHandle}
          />
          <TextInput
            style={styles.input}
            placeholder="Token amount (1–1000)"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            value={amount}
            onChangeText={setAmount}
          />
          <PrimaryButton label="Send Tokens" onPress={sendTokens} />
        </View>
        <View style={styles.card}>
          <Text style={styles.name}>Received</Text>
          {received.map((g) => (
            <View key={g.id} style={styles.row}>
              <Text style={styles.muted}>
                {g.kind === 'tokens' ? `${g.tokens} Tokens` : 'Cosmetic'} · {g.status}
              </Text>
              {g.status === 'pending' && g.kind === 'tokens' ? (
                <View style={styles.row}>
                  <PrimaryButton label="Accept" onPress={() => act(g.id, 'accept')} />
                  <PrimaryButton label="Decline" onPress={() => act(g.id, 'decline')} />
                </View>
              ) : null}
            </View>
          ))}
          {received.length === 0 && <Text style={styles.muted}>Nothing yet.</Text>}
        </View>
        <View style={styles.card}>
          <Text style={styles.name}>Sent</Text>
          {sent.map((g) => (
            <Text key={g.id} style={styles.muted}>
              {g.kind === 'tokens' ? `${g.tokens} Tokens` : 'Cosmetic'} · {g.status}
            </Text>
          ))}
          {sent.length === 0 && <Text style={styles.muted}>Nothing yet.</Text>}
        </View>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: spacing.sm, marginBottom: 8 },
  muted: { color: colors.muted, marginBottom: 12, fontSize: 14 },
  name: { color: colors.text, fontWeight: '700', fontSize: 16, marginBottom: 4 },
  badge: { color: colors.primaryHover, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: 10,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    color: colors.text,
    padding: 12,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
});
