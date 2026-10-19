import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SwipeBack } from '@/components/SwipeBack';
import { api } from '@/lib/api';
import { colors, spacing, radii } from '@/constants/theme';

type Order = {
  id: string;
  status: string;
  amountCents: number;
  currency: string;
  dueAt: string | null;
  item: { title: string; deliveryWindowDays: number } | null;
};

export default function Page() {
  const [library, setLibrary] = useState<Order[]>([]);
  const [msg, setMsg] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await api<{ orders: Order[] }>('/api/store/library');
      setLibrary(r.orders || []);
    } catch { /* offline */ } finally { setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <SwipeBack>
      <Screen refreshing={refreshing} onRefresh={load}>
        <Text style={styles.h1}>Store</Text>
        <Text style={styles.muted}>
          Real services from Favorites. Auto-refund if delivery misses the deadline. Never exchangeable for Gifts.
        </Text>
        {msg ? <Text style={styles.badge}>{msg}</Text> : null}
        <View style={styles.card}>
          <Text style={styles.name}>Purchase library</Text>
          {library.map((o) => (
            <View key={o.id} style={{ marginBottom: 10 }}>
              <Text style={styles.badge}>
                {o.item?.title ?? 'Item'} · {o.status} · {(o.amountCents / 100).toFixed(2)} {o.currency}
              </Text>
              {o.dueAt ? (
                <Text style={styles.muted}>Due {new Date(o.dueAt).toLocaleDateString()}</Text>
              ) : null}
            </View>
          ))}
          {library.length === 0 && (
            <Text style={styles.muted}>No purchases yet. Browse a Favorite's store from their profile.</Text>
          )}
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
