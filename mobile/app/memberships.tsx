/** Memberships & Orders (UX 54) - Rally design
 * Clubs, Orders and Library tabs. Each club shows its tier, price and
 * renewal date with Change tier (proration stated), Pause and Cancel.
 * Orders show a three-step tracker and the refund guarantee. The Library
 * lists delivered items with re-download.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ActivityIndicator, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const RED = '#ef5350';
const TEAL = '#00897B';

type Tier = { id: string; name: string; priceCents: number; currency: string; perks: string[] };
type Membership = {
  id: string;
  status: string;
  autoRenew: boolean;
  favoriteName: string;
  favoriteHandle: string;
  currentPeriodEnd: string;
  tier: Tier | null;
  tiers: Tier[];
};
type Order = {
  id: string;
  title: string;
  amountCents: number;
  currency: string;
  status: string;
  step: number;
  dueAt: string;
  deliveryProof: string | null;
  createdAt: string;
};

function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}
function price(t: Tier): string {
  return '\u20A6' + fmt(t.priceCents / 100) + ' / month';
}
function day(iso: string): string {
  return String(iso || '').slice(0, 10);
}

const TABS = ['Clubs', 'Orders', 'Library'] as const;

export default function MembershipsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();

  const [tab, setTab] = useState<(typeof TABS)[number]>('Clubs');
  const [loading, setLoading] = useState(true);
  const [clubs, setClubs] = useState<Membership[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [changeFor, setChangeFor] = useState<string | null>(null);
  const [cancelFor, setCancelFor] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    setLoading(true);
    try {
      const [m, o] = await Promise.all([
        api<{ memberships: Membership[] }>('/api/money/memberships'),
        api<{ orders: Order[] }>('/api/money/orders'),
      ]);
      setClubs(m.memberships || []);
      setOrders(o.orders || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function act(path: string, body?: object) {
    setBusy(true);
    setNote('');
    try {
      const res = await api<any>(path, {
        method: 'POST',
        body: JSON.stringify(body || {}),
      });
      impact('success');
      if (res && res.prorationNote) setNote(res.prorationNote);
      await load();
    } catch (e: any) {
      setNote(e && e.message ? e.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  const delivered = orders.filter((o) => o.status === 'delivered' && o.deliveryProof);

  return (
    <SwipeBack>
      <Screen refreshing={loading} onRefresh={load}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Memberships</Text>
        </View>

        {/* Tabs */}
        <View style={[styles.tabRow, { borderColor: colors.border }]}>
          {TABS.map((t) => (
            <Pressable
              key={t}
              onPress={() => { impact('light'); setTab(t); }}
              style={[styles.tab, tab === t && { backgroundColor: GOLD }]}
              accessibilityLabel={t}
            >
              <Text style={[styles.tabText, { color: tab === t ? '#111' : colors.muted }]}>{t}</Text>
            </Pressable>
          ))}
        </View>

        {note ? <Text style={styles.note}>{note}</Text> : null}

        {loading && clubs.length === 0 && orders.length === 0 ? (
          <ActivityIndicator color={GOLD} style={{ marginTop: 60 }} />
        ) : tab === 'Clubs' ? (
          clubs.length === 0 ? (
            <EmptyState
              icon="people-outline"
              title="No fan clubs yet"
              body="Join a fan club from any Favorite page to see it here."
            />
          ) : (
            <View style={{ gap: 12, marginBottom: spacing.lg }}>
              {clubs.map((c) => (
                <View
                  key={c.id}
                  style={[styles.clubCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16 }}>{c.favoriteName}</Text>
                  {c.tier ? (
                    <>
                      <Text style={{ color: GOLD, fontWeight: '800', fontSize: 14, marginTop: 2 }}>
                        {c.tier.name + ' \u00B7 ' + price(c.tier)}
                      </Text>
                      <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
                        {'Renews ' + day(c.currentPeriodEnd) + (c.status === 'paused' ? ' (paused)' : '')}
                      </Text>
                    </>
                  ) : null}
                  <View style={styles.clubBtns}>
                    <Pressable
                      style={[styles.smallBtn, { borderColor: colors.border }]}
                      onPress={() => { impact('light'); setChangeFor(changeFor === c.id ? null : c.id); }}
                      accessibilityLabel="Change tier"
                    >
                      <Text style={[styles.smallText, { color: colors.text }]}>Change tier</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.smallBtn, { borderColor: colors.border }]}
                      disabled={busy}
                      onPress={() => act('/api/subscriptions/' + c.id + '/pause')}
                      accessibilityLabel="Pause membership"
                    >
                      <Text style={[styles.smallText, { color: colors.text }]}>
                        {c.status === 'paused' ? 'Resume' : 'Pause'}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.smallBtn, { borderColor: RED + '66' }]}
                      onPress={() => { impact('light'); setCancelFor(cancelFor === c.id ? null : c.id); }}
                      accessibilityLabel="Cancel membership"
                    >
                      <Text style={[styles.smallText, { color: RED }]}>Cancel</Text>
                    </Pressable>
                  </View>

                  {/* Change tier sheet with proration stated */}
                  {changeFor === c.id ? (
                    <View style={[styles.tierSheet, { borderTopColor: colors.border }]}>
                      {c.tiers.map((t) => (
                        <Pressable
                          key={t.id}
                          style={[styles.tierRow, { borderColor: colors.border }]}
                          disabled={busy || t.id === (c.tier ? c.tier.id : '')}
                          onPress={() => act('/api/money/memberships/' + c.id + '/change-tier', { tierId: t.id })}
                          accessibilityLabel={t.name}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>{t.name}</Text>
                            <Text style={{ color: colors.muted, fontSize: 11, marginTop: 1 }}>
                                Prorated fairly at the next renewal
                            </Text>
                          </View>
                          <Text style={{ color: GOLD, fontWeight: '800', fontSize: 13 }}>{price(t)}</Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}

                  {/* Cancel confirmation inside the screen */}
                  {cancelFor === c.id ? (
                    <View style={[styles.confirmBox, { borderTopColor: colors.border }]}>
                      <Text style={{ color: colors.text, fontSize: 13, lineHeight: 19 }}>
                        Cancel this club at the end of the cycle? You keep access until then and can rejoin any time. No hidden steps.
                      </Text>
                      <View style={styles.confirmBtns}>
                        <Pressable
                          style={[styles.smallBtn, { borderColor: colors.border }]}
                          onPress={() => setCancelFor(null)}
                          accessibilityLabel="Keep membership"
                        >
                          <Text style={[styles.smallText, { color: colors.text }]}>Keep</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.smallBtn, { borderColor: RED + '66' }]}
                          disabled={busy}
                          onPress={() => { setCancelFor(null); act('/api/subscriptions/' + c.id + '/cancel'); }}
                          accessibilityLabel="Confirm cancel"
                        >
                          <Text style={[styles.smallText, { color: RED }]}>Confirm cancel</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          )
        ) : tab === 'Orders' ? (
          orders.length === 0 ? (
            <EmptyState
              icon="cube-outline"
              title="No orders yet"
              body="Orders from Favorite stores appear here with a delivery tracker."
            />
          ) : (
            <View style={{ gap: 12, marginBottom: spacing.lg }}>
              <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>
                Every order is covered by the refund guarantee: if a Favorite misses the delivery window, you are refunded automatically.
              </Text>
              {orders.map((o) => (
                <View
                  key={o.id}
                  style={[styles.orderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={styles.orderHead}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }} numberOfLines={1}>{o.title}</Text>
                      <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                        {o.status === 'refunded' ? 'Refunded' : 'Due ' + day(o.dueAt)}
                      </Text>
                    </View>
                    <Text style={{ color: colors.text, fontWeight: '900', fontSize: 15 }}>
                      {'\u20A6' + fmt(o.amountCents / 100)}
                    </Text>
                  </View>

                  {/* Three-step tracker */}
                  <View style={styles.tracker}>
                    {['Placed', 'In progress', 'Delivered'].map((label, i) => {
                      const done = o.status !== 'refunded' && o.step > i;
                      return (
                        <View key={label} style={styles.trackerStep}>
                          <View
                            style={[
                              styles.trackerDot,
                              { backgroundColor: done ? GOLD : colors.border },
                            ]}
                          />
                          <Text style={{ color: done ? colors.text : colors.muted, fontSize: 10, fontWeight: '700' }}>
                            {label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                  {o.status === 'refunded' ? (
                    <Text style={{ color: RED, fontSize: 12, fontWeight: '700' }}>Refunded</Text>
                  ) : null}
                </View>
              ))}
            </View>
          )
        ) : (
          delivered.length === 0 ? (
            <EmptyState
              icon="download-outline"
              title="Your library is empty"
              body="Delivered items from Favorite stores are kept here for re-download."
            />
          ) : (
            <View style={{ gap: 12, marginBottom: spacing.lg }}>
              {delivered.map((o) => (
                <View
                  key={o.id}
                  style={[styles.orderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }} numberOfLines={1}>{o.title}</Text>
                  <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>
                    {'Delivered ' + day(String(o.createdAt))}
                  </Text>
                  <Pressable
                    style={[styles.smallBtn, { borderColor: colors.border, alignSelf: 'flex-start', marginTop: 10 }]}
                    onPress={() => { impact('light'); if (o.deliveryProof) Linking.openURL(o.deliveryProof); }}
                    accessibilityLabel="Open item"
                  >
                    <Text style={[styles.smallText, { color: TEAL }]}>Open</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )
        )}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.sm },
  h1: { fontSize: 24, fontWeight: '900' },
  tabRow: { flexDirection: 'row', borderWidth: 1, borderRadius: radii.full, padding: 3, marginTop: spacing.md },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radii.full },
  tabText: { fontWeight: '800', fontSize: 13 },
  note: { color: '#34D399', fontSize: 13, fontWeight: '700', marginTop: 12, lineHeight: 19 },
  clubCard: { borderWidth: 1, borderRadius: radii.lg, padding: 16 },
  clubBtns: { flexDirection: 'row', gap: 8, marginTop: 12 },
  smallBtn: {
    borderWidth: 1,
    borderRadius: radii.full,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  smallText: { fontWeight: '700', fontSize: 13 },
  tierSheet: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 12, paddingTop: 8 },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
  },
  confirmBox: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 12, paddingTop: 12 },
  confirmBtns: { flexDirection: 'row', gap: 8, marginTop: 10 },
  orderCard: { borderWidth: 1, borderRadius: radii.lg, padding: 16 },
  orderHead: { flexDirection: 'row', alignItems: 'center' },
  tracker: { flexDirection: 'row', marginTop: 14 },
  trackerStep: { flex: 1, alignItems: 'center', gap: 4 },
  trackerDot: { width: 12, height: 12, borderRadius: 6 },
});
