/** Request a Shoutout (mock 19) - brief form for a store service.
 * Real order via POST /api/store/orders {itemId}; the mock payment is
 * held in escrow until delivery. Honest deviation: the backend order
 * takes only the item id today, so the "who is it for" and message
 * brief are not yet stored server-side - they arrive with the requests
 * backend.
 */
import { useState } from 'react';
import { Text, StyleSheet, View, Pressable, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const TEAL = '#34D399';
const MAX_MSG = 280;

function naira(cents: number): string {
  return '\u20A6' + Math.round(cents / 100).toLocaleString('en-US');
}

function dueLabel(days: number): string {
  const d = new Date(Date.now() + days * 86400000);
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function RequestShoutoutScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const { success } = useSounds();
  const params = useLocalSearchParams<{
    itemId: string; title: string; priceCents: string; days: string; favoriteName: string;
  }>();

  const title = params.title || 'Shoutout';
  const priceCents = Number(params.priceCents || 0);
  const days = Number(params.days || 5);
  const favoriteName = params.favoriteName || 'the Favorite';

  const [kind, setKind] = useState('Video shoutout');
  const [who, setWho] = useState('');
  const [message, setMessage] = useState('');
  const [paying, setPaying] = useState(false);

  async function pay() {
    if (paying) return;
    if (!getToken()) { router.push('/login'); return; }
    setPaying(true);
    impact('medium');
    try {
      const r = await api<{ order: { id: string } }>('/api/store/orders', {
        method: 'POST',
        body: JSON.stringify({ itemId: params.itemId }),
      });
      success();
      impact('success');
      router.replace({ pathname: '/receipt', params: { orderId: r.order.id } });
    } catch (e: any) {
      Alert.alert('Request', e.message || 'Could not place the request');
    } finally {
      setPaying(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={[styles.h1, { color: colors.text }]}>Request</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Identity */}
      <View style={styles.identityRow}>
        <LinearGradient colors={[GOLD, '#F0663F'] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>
            {favoriteName.slice(0, 2).toUpperCase()}
          </Text>
        </LinearGradient>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ color: colors.text, fontWeight: '900', fontSize: 20 }} numberOfLines={1}>{favoriteName}</Text>
          <Text style={{ color: colors.muted, fontSize: 14, marginTop: 2 }}>
            {'Delivers in about ' + days + ' days'}
          </Text>
        </View>
      </View>

      {/* Kind tabs */}
      <View style={[styles.tabRow, { borderColor: colors.border }]}>
        {['Video shoutout', 'Song stems'].map((k) => (
          <Pressable
            key={k}
            onPress={() => { impact('light'); setKind(k); }}
            style={[styles.tab, kind === k && { backgroundColor: '#1C1C22' }]}
            accessibilityLabel={k}
          >
            <Text style={{ color: kind === k ? colors.text : colors.muted, fontWeight: '800', fontSize: 15 }}>{k}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={[styles.label, { color: colors.muted }]}>Who is it for?</Text>
        <TextInput
          value={who}
          onChangeText={setWho}
          placeholder="My mum, Funke"
          placeholderTextColor={colors.muted}
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
          accessibilityLabel="Who is it for"
        />

        <Text style={[styles.label, { color: colors.muted }]}>What should {favoriteName.split(' ')[0]} say?</Text>
        <TextInput
          value={message}
          onChangeText={(t) => setMessage(t.slice(0, MAX_MSG))}
          placeholder="Happy birthday! She loves your worship songs."
          placeholderTextColor={colors.muted}
          multiline
          style={[styles.input, styles.msgInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
          accessibilityLabel="Message"
        />
        <Text style={[styles.counter, { color: colors.muted }]}>{message.length + ' / ' + MAX_MSG}</Text>

        {/* Summary */}
        <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.summaryRow}>
            <Text style={{ color: colors.muted, fontSize: 16 }}>{title}</Text>
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 }}>{naira(priceCents)}</Text>
          </View>
          <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
            <Text style={{ color: colors.muted, fontSize: 16 }}>Due by</Text>
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16 }}>{dueLabel(days)}</Text>
          </View>
        </View>

        {/* Escrow note */}
        <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Ionicons name="shield-checkmark-outline" size={16} color={TEAL} />
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20, flex: 1 }}>
            Your money is held until {favoriteName.split(' ')[0]} delivers. If they decline or are late, you are refunded in full.
          </Text>
        </View>
      </ScrollView>

      {/* Pay bar */}
      <View style={styles.payWrap}>
        <Pressable onPress={pay} disabled={paying} accessibilityLabel="Pay">
          <LinearGradient
            colors={[GOLD, GOLD_DEEP] as [string, string]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.payBtn, paying && { opacity: 0.6 }]}
          >
            {paying ? (
              <ActivityIndicator color="#111" />
            ) : (
              <Text style={{ color: '#111', fontWeight: '900', fontSize: 18 }}>{'Pay ' + naira(priceCents)}</Text>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 20, fontWeight: '900', flex: 1, textAlign: 'center' },
  identityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  tabRow: { flexDirection: 'row', borderWidth: 1, borderRadius: radii.full, padding: 3, marginBottom: spacing.md },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radii.full },
  label: { fontSize: 15, fontWeight: '800', marginBottom: 8, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  msgInput: { minHeight: 120, textAlignVertical: 'top', lineHeight: 22 },
  counter: { textAlign: 'right', fontSize: 13, marginTop: 6, marginBottom: spacing.sm },
  summary: { borderWidth: 1, borderRadius: radii.lg, paddingHorizontal: 16, marginBottom: spacing.md },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 14,
  },
  payWrap: { paddingTop: 10 },
  payBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: radii.full },
});
