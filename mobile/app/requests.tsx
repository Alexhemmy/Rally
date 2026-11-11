/** Requests and Orders (mock 20) - the Favorite's delivery queue.
 * The mock's custom video requests have no backend yet, so this
 * screen shows the real store order queue (/api/store/orders/pending)
 * with Deliver and Refund actions, and says plainly that custom
 * requests arrive with the requests backend.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const TEAL = '#34D399';

type Order = {
  id: string;
  amountCents: number;
  currency: string;
  status: string;
  dueAt: string;
  overdue: boolean;
  itemId: string;
};

const TABS = ['New', 'In progress', 'Delivered'] as const;
type Tab = (typeof TABS)[number];

function money(cents: number, currency: string): string {
  const symbol = currency === 'NGN' ? '\u20A6' : currency === 'USD' ? '$' : currency + ' ';
  return symbol + (cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function dueLabel(iso: string): string {
  try {
    return 'due ' + new Date(iso).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch { return ''; }
}

export default function RequestsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const { click, success } = useSounds();

  const [tab, setTab] = useState<Tab>('New');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    setLoading(true);
    try {
      const r = await api<{ orders: Order[] }>('/api/store/orders/pending');
      setOrders(r.orders || []);
    } catch { /* offline */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deliver(o: Order) {
    if (actingId) return;
    setActingId(o.id);
    impact('medium');
    try {
      await api('/api/store/orders/' + o.id + '/deliver', {
        method: 'POST',
        body: JSON.stringify({ deliveryProof: 'Delivered from the Rally app' }),
      });
      success();
      impact('success');
      await load();
    } catch (e: any) {
      Alert.alert('Deliver', e.message || 'Could not mark as delivered');
    } finally {
      setActingId(null);
    }
  }

  async function refund(o: Order) {
    if (actingId) return;
    setActingId(o.id);
    impact('medium');
    try {
      await api('/api/store/orders/' + o.id + '/refund', { method: 'POST' });
      click();
      await load();
    } catch (e: any) {
      Alert.alert('Refund', e.message || 'Could not refund');
    } finally {
      setActingId(null);
    }
  }

  const visible = tab === 'Delivered' ? [] : orders;

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Requests</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* Tabs */}
        <View style={styles.chipRow}>
          {TABS.map((t) => {
            const on = tab === t;
            return (
              <Pressable
                key={t}
                onPress={() => { impact('light'); setTab(t); }}
                style={[styles.chip, on ? { borderColor: GOLD, backgroundColor: GOLD + '14' } : { backgroundColor: colors.surfaceElevated, borderColor: 'transparent' }]}
                accessibilityLabel={t}
              >
                <Text style={{ color: on ? GOLD : colors.text, fontWeight: '800', fontSize: 16 }}>{t}</Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
          {loading ? (
            <Text style={{ color: colors.muted, fontSize: 14 }}>Loading\u2026</Text>
          ) : tab === 'Delivered' ? (
            <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>
              Delivered order history arrives with the orders backend. Today you see what is still pending.
            </Text>
          ) : visible.length === 0 ? (
            <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>
              Nothing waiting on you. New orders appear here the moment a fan pays.
            </Text>
          ) : (
            <View style={{ gap: 14 }}>
              {visible.map((o) => (
                <View key={o.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.cardTop}>
                    <View style={[styles.avatar, { backgroundColor: TEAL }]}>
                      <Text style={{ color: '#04120C', fontWeight: '900', fontSize: 13 }}>ORD</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 }}>Store order</Text>
                      <Text style={{ color: colors.muted, fontSize: 14, marginTop: 2 }}>
                        {dueLabel(o.dueAt) + (o.overdue ? ' \u00b7 overdue' : '')}
                      </Text>
                    </View>
                    <Text style={{ color: colors.text, fontWeight: '900', fontSize: 18 }}>
                      {money(o.amountCents, o.currency)}
                    </Text>
                  </View>
                  <View style={styles.btnRow}>
                    <Pressable
                      onPress={() => deliver(o)}
                      disabled={!!actingId}
                      style={({ pressed }) => [styles.acceptBtn, (pressed || actingId === o.id) && { opacity: 0.8 }]}
                      accessibilityLabel="Deliver order"
                    >
                      <Text style={{ color: '#111', fontWeight: '900', fontSize: 16 }}>
                        {actingId === o.id ? 'Working\u2026' : 'Deliver'}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => refund(o)}
                      disabled={!!actingId}
                      style={[styles.declineBtn, { backgroundColor: colors.surfaceElevated }]}
                      accessibilityLabel="Refund order"
                    >
                      <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16 }}>Refund</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Notes */}
          <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Ionicons name="shield-checkmark-outline" size={16} color={TEAL} />
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              Fans pay up front and money is held until you deliver. Orders that miss their window refund automatically.
            </Text>
          </View>
          <Text style={[styles.localNote, { color: colors.muted }]}>
            Custom video requests land here once the requests backend ships - store orders show up today.
          </Text>
        </ScrollView>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  chipRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.md },
  chip: { borderWidth: 1.5, borderRadius: radii.full, paddingHorizontal: 20, paddingVertical: 12 },
  card: { borderWidth: 1, borderRadius: radii.lg, padding: 16 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  acceptBtn: {
    flex: 1,
    backgroundColor: GOLD,
    borderRadius: radii.full,
    paddingVertical: 15,
    alignItems: 'center',
  },
  declineBtn: { flex: 1, borderRadius: radii.full, paddingVertical: 15, alignItems: 'center' },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 14,
    marginTop: spacing.md,
  },
  noteText: { flex: 1, fontSize: 14, lineHeight: 20 },
  localNote: { fontSize: 12, marginTop: spacing.md, lineHeight: 18 },
});
