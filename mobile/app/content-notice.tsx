/** Content notice (mock 26) - removal / strike notice.
 * There is no notices-or-strikes backend yet, so this screen renders
 * from route params (title, detail, rule, strike, appealBy, momentId)
 * that a future notifications tap can pass. Opened directly with no
 * params it shows an honest empty state. Appeal and Delete have no
 * endpoints, so they explain themselves instead of pretending.
 */
import { Text, StyleSheet, View, Pressable, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';

const GOLD = '#FFA726';
const TEAL = '#34D399';
const RED = '#E9355B';

export default function ContentNoticeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const p = useLocalSearchParams<{ title?: string; detail?: string; rule?: string; strike?: string; appealBy?: string; momentId?: string }>();

  const hasNotice = !!(p.title && p.detail);

  function appeal() {
    impact('medium');
    Alert.alert(
      'Appeal this decision',
      'A person reviews every appeal. Appeals are queued with the trust and safety backend - until it ships, contact support and quote this notice.',
    );
  }

  function remove() {
    impact('medium');
    Alert.alert(
      'Delete the Moment',
      p.momentId
        ? 'Moment deletion from a notice arrives with the moderation backend. You can delete it from your profile today.'
        : 'You can delete Moments from your profile today.',
    );
  }

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Notice</Text>
          <View style={{ width: 26 }} />
        </View>

        {!hasNotice ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="notifications-off-outline" size={26} color={colors.muted} />
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 17, marginTop: 12 }}>No notices right now</Text>
            <Text style={{ color: colors.muted, fontSize: 14, marginTop: 6, lineHeight: 20, textAlign: 'center' }}>
              If a Moment is ever removed, the reason, the rule and your appeal window appear here.
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={[styles.iconWrap, { backgroundColor: RED }]}>
              <Ionicons name="warning-outline" size={44} color="#fff" />
            </View>

            <Text style={[styles.bigTitle, { color: colors.text }]}>{p.title}</Text>
            <Text style={[styles.detail, { color: colors.muted }]}>{p.detail}</Text>

            <View style={[styles.ruleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {p.rule ? (
                <View style={[styles.ruleRow, { borderBottomColor: colors.border }]}>
                  <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 }}>Rule</Text>
                  <Text style={{ color: colors.muted, fontSize: 16, marginTop: 4 }}>{p.rule}</Text>
                </View>
              ) : null}
              {p.strike ? (
                <View style={[styles.ruleRow, { borderBottomColor: colors.border }]}>
                  <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 }}>Your account</Text>
                  <Text style={{ color: colors.muted, fontSize: 16, marginTop: 4 }}>{p.strike}</Text>
                </View>
              ) : null}
              {p.appealBy ? (
                <View style={styles.ruleRow}>
                  <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 }}>Appeal by</Text>
                  <Text style={{ color: colors.muted, fontSize: 16, marginTop: 4 }}>{p.appealBy}</Text>
                </View>
              ) : null}
            </View>

            <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Ionicons name="shield-checkmark-outline" size={16} color={TEAL} />
              <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                This does not affect your rank or earnings. A person reviews every appeal.
              </Text>
            </View>

            <Pressable onPress={appeal} accessibilityLabel="Appeal this decision">
              <LinearGradient colors={['#F59E0B', GOLD]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.appealBtn}>
                <Text style={{ color: '#111', fontWeight: '900', fontSize: 18 }}>Appeal this decision</Text>
              </LinearGradient>
            </Pressable>
            <Pressable onPress={remove} accessibilityLabel="Delete the Moment">
              <Text style={[styles.deleteText, { color: colors.muted }]}>Delete the Moment</Text>
            </Pressable>
          </ScrollView>
        )}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  emptyCard: { borderWidth: 1, borderRadius: radii.lg, padding: 24, alignItems: 'center', marginTop: spacing.md },
  iconWrap: { width: 96, height: 96, borderRadius: 28, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: spacing.md },
  bigTitle: { fontSize: 28, fontWeight: '900', textAlign: 'center', marginTop: 20 },
  detail: { fontSize: 16, textAlign: 'center', marginTop: 10, lineHeight: 23, paddingHorizontal: 8 },
  ruleCard: { borderWidth: 1, borderRadius: radii.lg, marginTop: spacing.md },
  ruleRow: { padding: 16, borderBottomWidth: 1 },
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
  appealBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: radii.full, marginTop: spacing.md },
  deleteText: { textAlign: 'center', fontWeight: '800', fontSize: 16, marginTop: 16 },
});
