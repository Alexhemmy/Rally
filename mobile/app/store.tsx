/** Store
 * Purchase library for real services from Favorites.
 * Auto-refund if delivery misses the deadline.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { GlassCard, SectionHeader, EmptyState } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { api } from '@/lib/api';
import { spacing, radii, type as typo } from '@/constants/theme';

type Order = {
  id: string;
  status: string;
  amountCents: number;
  currency: string;
  dueAt: string | null;
  item: {
    title: string;
    deliveryWindowDays: number;
  } | null;
};

export default function StoreScreen() {
  const { colors } = useTheme();

  const [library, setLibrary] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await api<{ orders: Order[] }>('/api/store/library');
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

  return (
    <SwipeBack>
      <Screen refreshing={refreshing} onRefresh={load}>
        {/* Header */}
        <Text style={[styles.h1, { color: colors.text }]}>Store</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Real services from Favorites. Auto-refund if delivery misses the deadline. Never exchangeable for Gifts.
        </Text>

        {/* Purchase Library */}
        <GlassCard>
          <SectionHeader title="Purchase library" />

          {library.length === 0 ? (
            <EmptyState
              icon="bag-handle-outline"
              title="No purchases yet"
              body="Browse a Favorite’s store from their profile to get started."
            />
          ) : (
            <View style={{ gap: 12, marginTop: 4 }}>
              {library.map((order) => (
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
                      {order.item?.title ?? 'Service'}
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
                              : order.status === 'cancelled' || order.status === 'refunded'
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
                              : order.status === 'cancelled' || order.status === 'refunded'
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
                </View>
              ))}
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
});
