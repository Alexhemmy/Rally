import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { api } from '@/lib/api';
import { colors, spacing, radii } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';

export default function WalletTab() {
  const [packs, setPacks] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { impact } = useHaptics();

  const load = useCallback(async () => {
    setRefreshing(true);
    impact('selection');
    try {
      const r = await api<{ packs: any[] }>('/api/tokens/packs');
      setPacks(r.packs || []);
    } catch {
      /* offline */
    } finally {
      setRefreshing(false);
    }
  }, [impact]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen refreshing={refreshing} onRefresh={load}>
      <Text style={styles.h1}>Wallet</Text>
      <Text style={styles.muted}>Mobile checkout uses provider layer (Paystack / Flutterwave / Stripe)</Text>
      {packs.map((p) => (
        <View key={p.id} style={styles.card}>
          <Text style={styles.name}>{p.name}</Text>
          <Text style={styles.muted}>
            {p.tokens}+{p.bonusTokens} · ${(p.priceCents / 100).toFixed(2)}
          </Text>
          <PrimaryButton
            label="Buy"
            onPress={() => impact('success')}
            style={{ marginTop: 10 }}
          />
        </View>
      ))}
      {!refreshing && packs.length === 0 && (
        <Text style={styles.muted}>Start API + seed to load packs. Pull to retry.</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  muted: { color: colors.muted, marginBottom: 12, fontSize: 14 },
  name: { color: colors.text, fontWeight: '700', fontSize: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: 10,
  },
});
