/** Merch
 * Physical merchandise orders via fulfillment partners.
 * Auto-refund if delivery misses the window. Never exchangeable for Gifts.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { GradientButton, GlassCard, SectionHeader, EmptyState } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { api } from '@/lib/api';
import { spacing, radii, type as typo } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';

type Order = {
  id: string;
  status: string;
  amountCents: number;
  currency: string;
  dueAt: string | null;
  trackingCode: string | null;
  item: { title: string } | null;
};

export default function MerchScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();

  const [library, setLibrary] = useState<Order[]>([]);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await api<{ orders: Order[] }>('/api/merch/library');
      setLibrary(r.orders || []);
    } catch {
      // offline
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, action: 'deliver' | 'refund') {
    setActingId(id);
    setMsg(null);
    impact('medium');

    try {
      await api(`/api/merch/orders/${id}/${action}`, { method: 'POST' });
      setMsg({
        type: 'success',
        text: action === 'deliver' ? 'Delivery confirmed' : 'Refund requested',
      });
      impact('success');
      await load();
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Action failed' });
    } finally {
      setActingId(null);
    }
  }

  return (
    <SwipeBack>
      <Screen refreshing={refreshing} onRefresh={load}>
        {/* Header */}
        <Text style={[styles.h1, { color: colors.text }]}>Merch</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Physical merch via fulfillment partners. Auto-refund if delivery misses the window. Never exchangeable for Gifts.
        </Text>

        {/* Feedback */}
        {msg && (
          <View
            style={[
              styles.feedback,
              {
                backgroundColor:
                  msg.type === 'success'
                    ? colors.success + '18'
                    : colors.danger + '18',
              },
            ]}
          >
            <Text
              style={{
                color: msg.type === 'success' ? colors.success : colors.danger,
                fontWeight: '700',
                fontSize: 13,
              }}
            >
              {msg.text}
            </Text>
          </View>
        )}

        {/* Orders */}
        <GlassCard>
          <SectionHeader title="Your orders" />

          {library.length === 0 ? (
            <EmptyState
              icon="shirt-outline"
              title="No merch orders yet"
              body="Browse a Favorite’s merch from their page on the web."
            />
          ) : (
            <View style={{ gap: 14, marginTop: 4 }}>
              {library.map((order) => {
                const isOverdue =
                  order.dueAt &&
                  ['paid', 'shipped'].includes(order.status) &&
                  new Date(order.dueAt) < new Date();

                return (
                  <View
                    key={order.id}
                    style={[
                      styles.orderCard,
                      {
                        backgroundColor: colors.bg,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.orderHeader}>
                      <Text
                        style={[styles.orderTitle, { color: colors.text }]}
                        numberOfLines={2}
                      >
                        {order.item?.title ?? 'Item'}
                      </Text>
                      <Text style={[styles.price, { color: colors.primary }]}>
                        {(order.amountCents / 100).toFixed(2)} {order.currency}
                      </Text>
                    </View>

                    <View style={styles.metaRow}>
                      <View
                        style={[
                          styles.statusPill,
                          {
                            backgroundColor:
                              order.status === 'delivered'
                                ? colors.success + '20'
                                : order.status === 'refunded' || order.status === 'cancelled'
                                ? colors.danger + '20'
                                : colors.primaryMuted,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color:
                              order.status === 'delivered'
                                ? colors.success
                                : order.status === 'refunded' || order.status === 'cancelled'
                                ? colors.danger
                                : colors.primary,
                            fontSize: 12,
                            fontWeight: '700',
                            textTransform: 'capitalize',
                          }}
                        >
                          {order.status}
                        </Text>
                      </View>

                      {order.dueAt && (
                        <Text style={{ color: colors.muted, fontSize: 13 }}>
                          Due {new Date(order.dueAt).toLocaleDateString()}
                        </Text>
                      )}
                    </View>

                    {!!order.trackingCode && (
                      <Text style={{ color: colors.muted, fontSize: 13 }}>
                        Tracking: {order.trackingCode}
                      </Text>
                    )}

                    <View style={styles.actions}>
                      {order.status === 'shipped' && (
                        <GradientButton
                          label="Confirm delivery"
                          size="sm"
                          onPress={() => act(order.id, 'deliver')}
                          loading={actingId === order.id}
                          disabled={!!actingId}
                        />
                      )}

                      {isOverdue && (
                        <GradientButton
                          label="Request refund"
                          size="sm"
                          variant="outline"
                          onPress={() => act(order.id, 'refund')}
                          loading={actingId === order.id}
                          disabled={!!actingId}
                        />
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </GlassCard>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: {
    ...typo.h1,
    marginTop: spacing.sm,
    marginBottom: 6,
  },
  subtitle: {
    ...typo.body,
    marginBottom: spacing.lg,
    lineHeight: 21,
  },
  feedback: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  orderCard: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 14,
    gap: 10,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  orderTitle: {
    flex: 1,
    fontWeight: '700',
    fontSize: 15,
    lineHeight: 20,
  },
  price: {
    fontWeight: '800',
    fontSize: 15,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
});
