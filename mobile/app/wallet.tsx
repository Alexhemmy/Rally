import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { api } from '@/lib/api';
import { colors, spacing, radii } from '@/constants/theme';

export default function Wallet() {
  const [packs, setPacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ packs: any[] }>('/api/tokens/packs')
      .then((r) => setPacks(r.packs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <Text style={styles.h1}>Wallet</Text>
      <Text style={styles.muted}>Paystack · Flutterwave · Stripe via /api/providers/payments</Text>
      {loading && <ActivityIndicator color={colors.primary} />}
      {packs.map((p) => (
        <View key={p.id} style={styles.card}>
          <Text style={styles.name}>{p.name}</Text>
          <Text style={styles.muted}>
            {p.tokens}+{p.bonusTokens} tokens · ${(p.priceCents / 100).toFixed(2)}
          </Text>
          <Pressable style={styles.btn}>
            <Text style={styles.btnText}>Buy</Text>
          </Pressable>
        </View>
      ))}
      {!loading && packs.length === 0 && (
        <Text style={styles.muted}>Start backend + seed to load packs</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: spacing.md, paddingBottom: 40 },
  h1: { fontSize: 24, fontWeight: '700', color: colors.text },
  muted: { color: colors.muted, marginBottom: 12, fontSize: 14 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: 10,
  },
  name: { color: colors.text, fontWeight: '700', fontSize: 16 },
  btn: {
    marginTop: 10,
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 44,
  },
  btnText: { color: '#04101F', fontWeight: '700' },
});
