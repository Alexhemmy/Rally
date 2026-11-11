/** Store front (mock 18) - a Favorite's store.
 * Real items from GET /api/store/favorite/:favoriteId and real orders via
 * POST /api/store/orders {itemId} (mock payment; money held until delivery).
 * Honest deviation: the backend has no store categories, so the tabs are
 * derived from deliveryType (download = Digital, message = Shoutouts,
 * link = Commissions). Services are never exchangeable for Gifts.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const TEAL = '#34D399';

type Item = {
  id: string;
  title: string;
  description: string | null;
  priceCents: number;
  currency: string;
  deliveryType: 'download' | 'link' | 'message';
  deliveryWindowDays: number;
};

const TABS = ['Digital', 'Shoutouts', 'Commissions'] as const;
type Tab = (typeof TABS)[number];

const TYPE_FOR_TAB: Record<Tab, Item['deliveryType']> = {
  Digital: 'download',
  Shoutouts: 'message',
  Commissions: 'link',
};

const BTN_FOR_TAB: Record<Tab, string> = {
  Digital: 'Buy',
  Shoutouts: 'Order',
  Commissions: 'Request',
};

const ICON_FOR_TYPE: Record<Item['deliveryType'], string> = {
  download: 'albums-outline',
  message: 'mic-outline',
  link: 'book-outline',
};

const GRADS: [string, string][] = [
  ['#B06AB3', '#F57C00'],
  ['#4A6CF7', '#7B61FF'],
  ['#0F9B8E', '#34D399'],
  ['#E9355B', '#F57C00'],
];

function naira(cents: number): string {
  return '\u20A6' + Math.round(cents / 100).toLocaleString('en-US');
}

export default function StoreFrontScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const { impact } = useHaptics();

  const [tab, setTab] = useState<Tab>('Digital');
  const [items, setItems] = useState<Item[]>([]);
  const [storeName, setStoreName] = useState('Store');
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!handle) { setLoading(false); return; }
    try {
      const fav = await api<any>('/api/favorites/' + handle);
      const f = fav.favorite || {};
      setStoreName((f.displayName || f.handle || 'Store') + "'s Store");
      if (f.id) {
        const r = await api<{ items: Item[] }>('/api/store/favorite/' + f.id, { skipAuth: true });
        setItems(r.items || []);
      }
    } catch { /* offline */ }
    setLoading(false);
  }, [handle]);

  useEffect(() => { load(); }, [load]);

  async function order(item: Item) {
    if (buyingId) return;
    if (!getToken()) { router.push('/login'); return; }
    setBuyingId(item.id);
    impact('medium');
    try {
      const r = await api<{ order: { id: string } }>('/api/store/orders', {
        method: 'POST',
        body: JSON.stringify({ itemId: item.id }),
      });
      impact('success');
      router.push({ pathname: '/receipt', params: { orderId: r.order.id } });
    } catch (e: any) {
      Alert.alert('Order', e.message || 'Could not place the order');
    } finally {
      setBuyingId(null);
    }
  }

  function openRequest(item: Item) {
    impact('light');
    router.push({
      pathname: '/request-shoutout',
      params: {
        itemId: item.id,
        title: item.title,
        priceCents: String(item.priceCents),
        days: String(item.deliveryWindowDays),
        favoriteName: storeName.replace("'s Store", ''),
      },
    });
  }

  const visible = items.filter((i) => i.deliveryType === TYPE_FOR_TAB[tab]);

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={[styles.h1, { color: colors.text }]} numberOfLines={1}>{storeName}</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabRow, { borderColor: colors.border }]}>
        {TABS.map((t) => (
          <Pressable
            key={t}
            onPress={() => { impact('light'); setTab(t); }}
            style={[styles.tab, tab === t && { backgroundColor: '#1C1C22' }]}
            accessibilityLabel={t}
          >
            <Text style={{ color: tab === t ? colors.text : colors.muted, fontWeight: '800', fontSize: 15 }}>{t}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? <ActivityIndicator color={GOLD} style={{ marginTop: 30 }} /> : null}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {!loading && visible.length === 0 ? (
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 20 }}>
            Nothing in {tab} right now. Check the other tabs.
          </Text>
        ) : null}

        {visible.map((item, idx) => (
          <View key={item.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <LinearGradient
              colors={GRADS[idx % GRADS.length]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.thumb}
            >
              <Ionicons name={(ICON_FOR_TYPE[item.deliveryType] as any) || 'cube-outline'} size={30} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 18 }} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={styles.chipRow}>
                <View style={[styles.chip, { backgroundColor: colors.surfaceElevated }]}>
                  <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700' }}>
                    {item.deliveryType === 'download' ? 'Instant download' : 'Delivered in ' + item.deliveryWindowDays + ' days'}
                  </Text>
                </View>
                <View style={[styles.chip, { backgroundColor: colors.surfaceElevated }]}>
                  <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700' }}>Escrow</Text>
                </View>
              </View>
              <View style={styles.priceRow}>
                <Text style={{ color: colors.text, fontWeight: '900', fontSize: 18 }}>{naira(item.priceCents)}</Text>
                <Pressable
                  disabled={buyingId === item.id}
                  onPress={() => { tab === 'Shoutouts' ? openRequest(item) : order(item); }}
                  style={({ pressed }) => [styles.buyBtn, pressed && { opacity: 0.8 }]}
                  accessibilityLabel={BTN_FOR_TAB[tab] + ' ' + item.title}
                >
                  <Text style={{ color: '#111', fontWeight: '900', fontSize: 15 }}>
                    {buyingId === item.id ? '\u2026' : BTN_FOR_TAB[tab]}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}

        {/* Escrow note */}
        <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Ionicons name="shield-checkmark-outline" size={16} color={TEAL} />
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20, flex: 1 }}>
            Your money is held until delivery. Services are never exchanged for Gifts.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 20, fontWeight: '900', flex: 1, textAlign: 'center' },
  tabRow: { flexDirection: 'row', borderWidth: 1, borderRadius: radii.full, padding: 3, marginBottom: spacing.md },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radii.full },
  card: { borderWidth: 1, borderRadius: radii.lg, padding: 14, marginBottom: 14, flexDirection: 'row' },
  thumb: { width: 86, height: 86, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  chipRow: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  chip: { borderRadius: radii.md, paddingHorizontal: 10, paddingVertical: 5 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  buyBtn: {
    backgroundColor: GOLD,
    borderRadius: radii.full,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 14,
    marginTop: spacing.sm,
  },
});
