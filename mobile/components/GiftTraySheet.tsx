/** GiftTraySheet - Rally design
 * Bottom sheet gift tray: token balance + Naira value + top up, category
 * tabs, circular gift grid with T + naira costs, quantity stepper,
 * weekly spend-limit bar, message with counter, anonymity toggle,
 * and a gold Send button. Dual pricing: 1 Token = 10 naira.
 */
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  Switch,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '@/components/ThemeProvider';
import { radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const NAIRA = '\u20a6';
const NAIRA_PER_TOKEN = 10;
const MAX_QTY = 10;

function naira(tokens: number) {
  return NAIRA + (tokens * NAIRA_PER_TOKEN).toLocaleString('en-US');
}

type IconName = keyof typeof Ionicons.glyphMap;
type CatalogItem = {
  id: string;
  slug: string;
  name: string;
  tokenCost: number;
  category?: string;
};

function giftVisual(slug: string): { icon: IconName; color: string } {
  if (slug.indexOf('heart') >= 0) return { icon: 'heart', color: '#E91E63' };
  if (slug.indexOf('flame') >= 0) return { icon: 'flame', color: '#FF5722' };
  if (slug.indexOf('drum') >= 0 || slug.indexOf('talk') >= 0) return { icon: 'musical-notes', color: '#9C27B0' };
  if (slug.indexOf('spark') >= 0) return { icon: 'sparkles', color: GOLD };
  if (slug.indexOf('mic') >= 0 || slug.indexOf('sing') >= 0) return { icon: 'mic', color: '#4CAF50' };
  if (slug.indexOf('vinyl') >= 0 || slug.indexOf('disc') >= 0 || slug.indexOf('music') >= 0) return { icon: 'disc', color: '#2196F3' };
  if (slug.indexOf('trophy') >= 0) return { icon: 'trophy', color: '#FFC107' };
  if (slug.indexOf('crown') >= 0) return { icon: 'ribbon', color: '#FFC107' };
  if (slug.indexOf('clap') >= 0) return { icon: 'hand-left', color: '#4CAF50' };
  return { icon: 'gift', color: GOLD };
}

export function GiftTraySheet({
  visible,
  onClose,
  name,
  onSend,
  sending,
}: {
  visible: boolean;
  onClose: () => void;
  name: string;
  onSend: (giftId: string, message: string, anonymous: boolean, quantity: number) => void;
  sending: boolean;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('Popular');
  const [selected, setSelected] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [week, setWeek] = useState<{ cap: number | null; spent: number } | null>(null);

  useEffect(() => {
    if (!visible) return;
    setSelected(null);
    setQty(1);
    setMessage('');
    setAnonymous(false);
    setLoading(true);
    (async () => {
      try {
        const res = await api<{ items: CatalogItem[] }>('/api/gifts/catalog', { skipAuth: true });
        setCatalog(res.items || []);
      } catch {
        setCatalog([]);
      } finally {
        setLoading(false);
      }
    })();
    if (getToken()) {
      api<{ wallet: any }>('/api/tokens/wallet')
        .then((w) => setBalance(Number(w.wallet?.balance ?? 0) + Number(w.wallet?.giftedBalance ?? 0)))
        .catch(() => setBalance(null));
      api<any>('/api/limits')
        .then((d) => {
          setWeek({ cap: d.weeklySpendCap == null ? null : Number(d.weeklySpendCap), spent: Number(d.spentThisWeek || 0) });
          if (d.anonymityDefault) setAnonymous(true);
        })
        .catch(() => setWeek(null));
    } else {
      setBalance(null);
      setWeek(null);
    }
  }, [visible]);

  const categories = ['Popular'];
  catalog.forEach((c) => {
    if (c.category && categories.indexOf(c.category) === -1) categories.push(c.category);
  });
  const shown = tab === 'Popular' || tab === 'All' ? catalog : catalog.filter((c) => c.category === tab);
  const selectedItem = catalog.find((c) => c.id === selected);
  const totalCost = selectedItem ? selectedItem.tokenCost * qty : 0;
  const canAfford = balance === null || !selectedItem || totalCost <= balance;
  const weekPct = week && week.cap ? Math.min(100, Math.round((week.spent / week.cap) * 100)) : null;
  const weekOver = !!(week && week.cap != null && week.spent > week.cap);
  const capReached = !!(week && week.cap != null && week.spent >= week.cap);
  const buyMode = !capReached && balance !== null && !!selectedItem && totalCost > balance;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, paddingBottom: Math.max(16, insets.bottom) },
          ]}
        >
          <View style={styles.grabHandle} />

          {/* Header: recipient + balance */}
          <View style={styles.header}>
            <View style={[styles.avatar, { backgroundColor: GOLD }]}>
              <Text style={styles.avatarText}>
                {(name || '?').slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.title, { color: colors.text }]}>Gift {name}</Text>
              <View style={styles.balanceRow}>
                <View style={styles.tokenBadge}>
                  <Text style={styles.tokenBadgeText}>T</Text>
                </View>
                <Text style={[styles.balance, { color: colors.text }]}>
                  {balance === null ? '\u2014' : balance.toLocaleString('en-US')}
                </Text>
                {balance !== null && (
                  <Text style={[styles.balanceNaira, { color: colors.muted }]}>
                    {'\u2248'} {naira(balance)}
                  </Text>
                )}
                <Pressable
                  onPress={() => router.push('/wallet')}
                  style={({ pressed }) => [styles.topUp, pressed && { opacity: 0.7 }]}
                  accessibilityLabel="Top up"
                >
                  <Text style={styles.topUpText}>Top up</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Weekly spend-limit bar */}
          {week && week.cap != null && (
            <View style={[styles.weekWrap, { borderColor: colors.border }]}>
              <View style={styles.weekLabels}>
                <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '700' }}>WEEKLY LIMIT</Text>
                <Text style={{ color: weekOver ? '#ef5350' : colors.text, fontSize: 11, fontWeight: '800' }}>
                  T {week.spent.toLocaleString('en-US')} / {week.cap.toLocaleString('en-US')}
                </Text>
              </View>
              <View style={[styles.weekTrack, { backgroundColor: colors.border }]}>
                <View
                  style={{
                    width: (weekPct || 0) + '%',
                    height: '100%',
                    borderRadius: 3,
                    backgroundColor: weekOver ? '#ef5350' : GOLD,
                  }}
                />
              </View>
            </View>
          )}

          {/* Category tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, marginBottom: 14 }}
            contentContainerStyle={{ gap: 8, paddingRight: 16 }}
          >
            {categories.map((c) => {
              const active = tab === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setTab(c)}
                  style={[
                    styles.tab,
                    {
                      borderColor: active ? GOLD : colors.border,
                      backgroundColor: active ? GOLD : colors.surface,
                    },
                  ]}
                >
                  <Text style={{ color: active ? '#111' : colors.muted, fontWeight: '800', fontSize: 13 }}>
                    {c}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Gift grid */}
          {loading ? (
            <ActivityIndicator color={GOLD} style={{ marginVertical: 24 }} />
          ) : shown.length === 0 ? (
            <Text style={[styles.empty, { color: colors.muted }]}>
              No gifts available right now.
            </Text>
          ) : (
            <View style={styles.grid}>
              {shown.map((gif) => {
                const v = giftVisual(gif.slug);
                const active = selected === gif.id;
                return (
                  <Pressable
                    key={gif.id}
                    style={styles.giftCell}
                    onPress={() => { setSelected(gif.id); setQty(1); }}
                    accessibilityLabel={gif.name + " \u00b7 " + gif.tokenCost + " tokens"}
                  >
                    <View
                      style={[
                        styles.giftBubble,
                        {
                          backgroundColor: active ? GOLD : v.color + '22',
                          borderWidth: active ? 2 : 0,
                        },
                      ]}
                    >
                      <Ionicons name={v.icon} size={22} color={active ? '#111' : v.color} />
                    </View>
                    <Text numberOfLines={1} style={[styles.giftName, { color: colors.text }]}>
                      {gif.name}
                    </Text>
                    <Text style={[styles.giftCost, { color: GOLD }]}>T {gif.tokenCost}</Text>
                    <Text style={[styles.giftCostNaira, { color: colors.muted }]}>{naira(gif.tokenCost)}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Quantity stepper */}
          {selectedItem && (
            <View style={[styles.qtyRow, { borderColor: colors.border }]}>
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>Quantity</Text>
              <View style={styles.stepper}>
                <Pressable
                  onPress={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1 || sending}
                  style={[styles.stepBtn, qty <= 1 && { opacity: 0.35 }]}
                  accessibilityLabel="Decrease quantity"
                >
                  <Ionicons name="remove" size={16} color={colors.text} />
                </Pressable>
                <Text style={[styles.qtyValue, { color: colors.text }]}>{qty}</Text>
                <Pressable
                  onPress={() => setQty((q) => Math.min(MAX_QTY, q + 1))}
                  disabled={qty >= MAX_QTY || sending}
                  style={[styles.stepBtn, qty >= MAX_QTY && { opacity: 0.35 }]}
                  accessibilityLabel="Increase quantity"
                >
                  <Ionicons name="add" size={16} color={colors.text} />
                </Pressable>
              </View>
              <View style={styles.qtyTotal}>
                <Text style={{ color: GOLD, fontWeight: '900', fontSize: 14 }}>T {totalCost}</Text>
                <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '600' }}>{naira(totalCost)}</Text>
              </View>
            </View>
          )}

          {/* Message */}
          <View style={[styles.inputWrap, { borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Add a message"
              placeholderTextColor={colors.muted}
              value={message}
              onChangeText={(t) => setMessage(t.slice(0, 280))}
              maxLength={280}
              multiline
            />
            <Text style={[styles.counter, { color: colors.muted }]}>
              {message.length}/280
            </Text>
          </View>

          {/* Anonymity */}
          <View style={styles.toggleRow}>
            <Text style={{ color: colors.text, fontSize: 14 }}>Send anonymously</Text>
            <Switch
              value={anonymous}
              onValueChange={setAnonymous}
              trackColor={{ false: colors.border, true: GOLD }}
              thumbColor={anonymous ? '#fff' : '#999'}
            />
          </View>

          {/* Send */}
          <Pressable
            onPress={() => {
              if (buyMode) {
                onClose();
                router.push('/wallet');
              } else if (selected) {
                onSend(selected, message, anonymous, qty);
              }
            }}
            disabled={!selected || sending || capReached || (!canAfford && !buyMode)}
            accessibilityLabel={buyMode ? 'Buy Tokens' : 'Send gift'}
          >
            <LinearGradient
              colors={[GOLD, GOLD_DEEP] as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.sendBtn, (!selected || sending || (!canAfford && !buyMode) || capReached) && { opacity: 0.4 }]}
            >
              <Text style={styles.sendText}>
                {sending
                  ? 'Sending\u2026'
                  : capReached
                  ? 'Weekly limit reached'
                  : buyMode
                  ? 'Buy Tokens'
                  : selectedItem
                  ? 'Send \u00b7 T ' + totalCost + ' (' + naira(totalCost) + ')'
                  : 'Pick a gift'}
              </Text>
            </LinearGradient>
          </Pressable>
          {capReached ? (
            <Text style={{ color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 8 }}>
              Your weekly limit resets at the start of next week.
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  grabHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#111',
    fontWeight: '900',
    fontSize: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tokenBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,167,38,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenBadgeText: {
    color: GOLD,
    fontWeight: '900',
    fontSize: 11,
  },
  balance: {
    fontWeight: '800',
    fontSize: 15,
  },
  balanceNaira: {
    fontSize: 12,
    fontWeight: '600',
  },
  topUp: {
    backgroundColor: GOLD,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  topUpText: {
    color: '#111',
    fontWeight: '800',
    fontSize: 12,
  },
  weekWrap: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  weekLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  weekTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  tab: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  giftCell: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 12,
  },
  giftBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: GOLD,
  },
  giftName: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 5,
  },
  giftCost: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 1,
  },
  giftCostNaira: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  empty: {
    textAlign: 'center',
    marginVertical: 24,
    fontSize: 14,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 12,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,167,38,0.14)',
  },
  qtyValue: {
    width: 34,
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 15,
  },
  qtyTotal: {
    flex: 1,
    alignItems: 'flex-end',
  },
  inputWrap: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  input: {
    fontSize: 14,
    minHeight: 40,
    padding: 0,
  },
  counter: {
    fontSize: 11,
    textAlign: 'right',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sendBtn: {
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  sendText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
});
