/** Receipt (mock 22) - a store order receipt.
 * Real order from GET /api/store/library matched by orderId. Honest
 * deviations: the backend does not store card details or a RLY- style
 * reference yet, so "Paid with" shows the checkout method used and the
 * reference is the order id.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ActivityIndicator, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const TEAL = '#34D399';

type Order = {
  id: string;
  amountCents: number;
  currency: string;
  status: string;
  dueAt: string | null;
  deliveredAt: string | null;
  refundedAt: string | null;
  deliveryProof: string | null;
  createdAt: string;
  item: { title: string } | null;
};

function naira(cents: number): string {
  return '\u20A6' + Math.round(cents / 100).toLocaleString('en-US');
}

function when(iso: string | null): string {
  if (!iso) return '\u2014';
  try {
    return new Date(iso).toLocaleString('en-US', {
      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch { return '\u2014'; }
}

export default function ReceiptScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { impact } = useHaptics();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    try {
      const r = await api<{ orders: Order[] }>('/api/store/library');
      const found = (r.orders || []).find((o) => o.id === orderId) || null;
      setOrder(found);
    } catch { /* offline */ }
    setLoading(false);
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  const statusLabel = order
    ? order.status === 'delivered' ? 'Delivered' : order.status === 'refunded' ? 'Refunded' : 'In progress'
    : '';

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={[styles.h1, { color: colors.text }]}>Receipt</Text>
        <View style={{ width: 26 }} />
      </View>

      {loading ? <ActivityIndicator color={GOLD} style={{ marginTop: 40 }} /> : null}

      {!loading && !order ? (
        <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 24 }}>
          Receipt not found. Pull down to refresh, or check Memberships for your orders.
        </Text>
      ) : null}

      {order ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Success mark */}
          <View style={styles.hero}>
            <View style={[styles.checkWrap, { backgroundColor: TEAL }]}>
              <Ionicons name="checkmark" size={34} color="#04120C" />
            </View>
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 34, marginTop: 14 }}>
              {naira(order.amountCents)}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 16, marginTop: 4 }}>
              {(order.item ? order.item.title : 'Order') + ' \u00b7 ' + statusLabel}
            </Text>
          </View>

          {/* Details card */}
          <View style={[styles.details, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.row}>
              <Text style={{ color: colors.muted, fontSize: 16 }}>Ordered</Text>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 15 }}>{when(order.createdAt)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={{ color: colors.muted, fontSize: 16 }}>Paid with</Text>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 15 }}>Rally checkout</Text>
            </View>
            <View style={styles.row}>
              <Text style={{ color: colors.muted, fontSize: 16 }}>Reference</Text>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 15 }} numberOfLines={1}>
                {order.id.slice(0, 8).toUpperCase()}
              </Text>
            </View>
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <Text style={{ color: colors.muted, fontSize: 16 }}>Order</Text>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 15 }}>
                {'#' + order.id.slice(0, 6)}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.btnRow}>
            <Pressable
              onPress={() => {
                impact('light');
                if (order.deliveryProof) {
                  Linking.openURL(order.deliveryProof).catch(() => Alert.alert('Download', 'Could not open the delivery file.'));
                } else {
                  Alert.alert('Download', 'This order has not been delivered yet.');
                }
              }}
              style={[styles.pillBtn, { backgroundColor: colors.surfaceElevated }]}
              accessibilityLabel="Download"
            >
              <Ionicons name="download-outline" size={18} color={colors.text} />
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15, marginLeft: 8 }}>Download</Text>
            </Pressable>
            <Pressable
              onPress={() => { impact('light'); router.push('/support'); }}
              style={[styles.pillBtn, { backgroundColor: colors.surfaceElevated }]}
              accessibilityLabel="Report a problem"
            >
              <Ionicons name="flag-outline" size={18} color={colors.text} />
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15, marginLeft: 8 }}>Report a problem</Text>
            </Pressable>
          </View>

          {order.status !== 'refunded' ? (
            <Pressable
              onPress={() => { impact('light'); router.push({ pathname: '/refund', params: { orderId: order.id } }); }}
              style={styles.refundLink}
              accessibilityLabel="Request a refund"
            >
              <Text style={{ color: GOLD, fontWeight: '900', fontSize: 16 }}>Request a refund</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.sm },
  h1: { fontSize: 20, fontWeight: '900', flex: 1, textAlign: 'center' },
  hero: { alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.lg },
  checkWrap: {
    width: 92,
    height: 92,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: { borderWidth: 1, borderRadius: radii.lg, paddingHorizontal: 16, marginBottom: spacing.lg },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  btnRow: { flexDirection: 'row', gap: 10 },
  pillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    paddingVertical: 16,
  },
  refundLink: { alignItems: 'center', paddingVertical: 20 },
});
