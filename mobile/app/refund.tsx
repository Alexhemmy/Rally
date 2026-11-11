/** Request a Refund (mock 23) - reason picker for a store order.
 * Real refund via POST /api/store/orders/:id/refund. Honest deviation:
 * the backend endpoint takes no reason or details yet, so the reason
 * picked here is shown in the confirmation but not stored server-side.
 */
import { useState } from 'react';
import { Text, StyleSheet, View, Pressable, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const TEAL = '#34D399';

const REASONS = [
  'It was not delivered',
  'It does not match my request',
  'The quality was poor',
  'I was charged twice',
  'Something else',
];

function naira(cents: number): string {
  return '\u20A6' + Math.round(cents / 100).toLocaleString('en-US');
}

export default function RefundScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { impact } = useHaptics();
  const { success } = useSounds();

  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!reason || submitting) return;
    if (!getToken()) { router.push('/login'); return; }
    setSubmitting(true);
    impact('medium');
    try {
      await api('/api/store/orders/' + orderId + '/refund', { method: 'POST' });
      success();
      impact('success');
      Alert.alert(
        'Refund requested',
        reason + (details ? ' - ' + details : '') + '. You are refunded when the order is confirmed refundable; missed deadlines refund automatically.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e: any) {
      Alert.alert('Refund', e.message || 'Could not submit the request');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={[styles.h1, { color: colors.text }]}>Refund</Text>
        <View style={{ width: 26 }} />
      </View>

      <Text style={{ color: colors.muted, fontSize: 15, marginBottom: spacing.md }}>
        {'Order #' + String(orderId || '').slice(0, 6)}
      </Text>

      {/* Policy note */}
      <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        <Ionicons name="time-outline" size={16} color={TEAL} />
        <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20, flex: 1 }}>
          You can request a refund within 7 days of delivery. Tokens already spent on Gifts cannot be refunded.
        </Text>
      </View>

      <Text style={[styles.section, { color: colors.muted }]}>WHAT WENT WRONG?</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {REASONS.map((r) => {
          const on = reason === r;
          return (
            <Pressable
              key={r}
              onPress={() => { impact('light'); setReason(r); }}
              style={[styles.reasonRow, { borderBottomColor: colors.border }]}
              accessibilityLabel={r}
            >
              <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={24} color={on ? GOLD : colors.muted} />
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 17, marginLeft: 16, flex: 1 }}>{r}</Text>
            </Pressable>
          );
        })}

        <Text style={[styles.label, { color: colors.muted }]}>Details</Text>
        <TextInput
          value={details}
          onChangeText={setDetails}
          placeholder="Tell us what happened"
          placeholderTextColor={colors.muted}
          multiline
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
          accessibilityLabel="Details"
        />
      </ScrollView>

      <Pressable
        onPress={submit}
        disabled={!reason || submitting}
        accessibilityLabel="Submit request"
        style={({ pressed }) => [styles.submitBtn, (!reason || submitting) && { opacity: 0.5 }, pressed && { opacity: 0.7 }]}
      >
        {submitting ? (
          <ActivityIndicator color="#111" />
        ) : (
          <Text style={{ color: '#111', fontWeight: '900', fontSize: 18 }}>Submit request</Text>
        )}
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.sm },
  h1: { fontSize: 20, fontWeight: '900', flex: 1, textAlign: 'center' },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 14,
    marginBottom: spacing.md,
  },
  section: { fontSize: 13, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  label: { fontSize: 15, fontWeight: '800', marginTop: spacing.md, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 110,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  submitBtn: {
    backgroundColor: GOLD,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    marginTop: spacing.sm,
  },
});
