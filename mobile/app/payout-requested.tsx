/** Cash-out requested (mock 13) - confirmation after a payout request.
 * Teal check, bank destination line, amount / reference / status card,
 * Done back to the studio and View statement.
 */
import { Text, StyleSheet, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { spacing, radii } from '@/constants/theme';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const TEAL = '#2BD9A9';

function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export default function PayoutRequestedScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const { click } = useSounds();
  const params = useLocalSearchParams<{ amount?: string; bank?: string; last4?: string; reference?: string }>();

  const amount = Number(params.amount || 0);
  const bank = params.bank || 'your bank';
  const last4 = params.last4 || '';
  const reference = params.reference || '';

  function done() {
    impact('medium');
    click();
    router.replace('/favorite-studio');
  }

  return (
    <Screen>
      <View style={styles.body}>
        {/* Check */}
        <View style={styles.checkWrap}>
          <LinearGradient colors={[TEAL, '#1FA98B'] as [string, string]} style={styles.check}>
            <Ionicons name="checkmark" size={44} color="#04120C" />
          </LinearGradient>
        </View>

        <Text style={[styles.h1, { color: colors.text }]}>Cash-out requested</Text>
        <Text style={[styles.sub, { color: colors.muted }]}>
          {'\u20A6' + fmt(amount) + ' is on its way to ' + bank + (last4 ? ' \u00b7\u00b7 ' + last4 : '') + '. Usually arrives within 1 business day.'}
        </Text>

        {/* Detail card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16 }}>Amount</Text>
              <Text style={{ color: colors.muted, fontSize: 13 }}>After fees</Text>
            </View>
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 }}>{'\u20A6' + fmt(amount)}</Text>
          </View>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16 }}>Reference</Text>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }} numberOfLines={1}>
              {reference || 'RLY'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16 }}>Status</Text>
            <Text style={{ color: GOLD, fontWeight: '900', fontSize: 16 }}>Processing</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable
          onPress={done}
          style={({ pressed }) => [pressed && { opacity: 0.85 }]}
          accessibilityLabel="Done"
        >
          <LinearGradient
            colors={[GOLD, GOLD_DEEP] as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.doneBtn}
          >
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 17 }}>Done</Text>
          </LinearGradient>
        </Pressable>
        <Pressable
          onPress={() => { impact('light'); router.push('/statement'); }}
          hitSlop={8}
          accessibilityLabel="View statement"
        >
          <Text style={{ color: colors.muted, fontWeight: '800', fontSize: 15, marginTop: 14 }}>View statement</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  checkWrap: { shadowColor: TEAL, shadowOpacity: 0.5, shadowRadius: 40, shadowOffset: { width: 0, height: 0 } },
  check: { width: 120, height: 120, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  h1: { fontSize: 32, fontWeight: '900', marginTop: 28, textAlign: 'center' },
  sub: { fontSize: 16, lineHeight: 24, textAlign: 'center', marginTop: 10 },
  card: { borderWidth: 1, borderRadius: radii.lg, padding: 6, marginTop: 32, alignSelf: 'stretch' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  doneBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 17, borderRadius: radii.full },
});
