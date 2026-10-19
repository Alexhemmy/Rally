import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SwipeBack } from '@/components/SwipeBack';
import { api } from '@/lib/api';
import { colors, spacing, radii } from '@/constants/theme';

type Order = {
  id: string; status: string; amountCents: number; currency: string;
  dueAt: string | null; trackingCode: string | null;
  item: { title: string } | null;
};

export default function MerchScreen() {
  const [library, setLibrary] = useState<Order[]>([]);
  const [msg, setMsg] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await api<{ orders: Order[] }>('/api/merch/library');
      setLibrary(r.orders || []);
    } catch { /* offline */ } finally { setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function act(id: string, action: string) {
    try {
      await api('/api/merch/orders/' + id + '/' + action, { method: 'POST' });
      setMsg('Order ' + action + 'ed');
      load();
    } catch (e: any) { setMsg(e.message); }
  }

  return (
    <SwipeBack>
      <Screen refreshing={refreshing} onRefresh={load}>
        <Text style={styles.h1}>Merch</Text>
        <Text style={styles.muted}>
          Physical merch via fulfillment partners. Auto-refund if delivery misses the window. Never exchangeable for Gifts.
        </Text>
        {!!msg && <Text style={styles.ok}>{msg}</Text>}
        <View style={styles.card}>
          <Text style={styles.name}>Your orders</Text>
          {library.map((o) => (
            <View key={o.id} style={{ marginBottom: 12 }}>
              <Text style={styles.badge}>{o.item?.title ?? 'Item'} · {o.status} · {(o.amountCents / 100).toFixed(2)} {o.currency}</Text>
              {o.dueAt ? <Text style={styles.muted}>Due {new Date(o.dueAt).toLocaleDateString()}</Text> : null}
              {!!o.trackingCode && <Text style={styles.muted}>Tracking: {o.trackingCode}</Text>}
              {o.status === 'shipped' ? (
                <PrimaryButton label="Confirm delivery" onPress={() => act(o.id, 'deliver')} />
              ) : null}
              {['paid', 'shipped'].includes(o.status) && o.dueAt && new Date(o.dueAt) < new Date() ? (
                <PrimaryButton label="Request refund" variant="ghost" onPress={() => act(o.id, 'refund')} />
              ) : null}
            </View>
          ))}
          {library.length === 0 && (
            <Text style={styles.muted}>No merch orders yet. Browse a Favorite's merch from their page on web.</Text>
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
  ok: { color: '#16a34a', marginBottom: 8 },
  card: {
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1,
    borderColor: colors.border, padding: spacing.md, marginBottom: 10,
  },
});
