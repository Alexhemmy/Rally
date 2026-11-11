/** Help Center (UX 51) - Rally design
 * Search and popular help articles with real answers, plus Talk to
 * support. Articles expand in place; support opens the message form.
 */
import { useState } from 'react';
import { Text, StyleSheet, View, Pressable, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';

const GOLD = '#FFA726';

const ARTICLES: { icon: string; title: string; body: string }[] = [
  {
    icon: 'card-outline',
    title: 'My payment failed',
    body: 'First check that your card or bank allows online payments. Then try again from Wallet - a failed payment never charges you twice, and Tokens only arrive after payment clears. If money left your account but Tokens did not, message support with the receipt.',
  },
  {
    icon: 'gift-outline',
    title: 'How Gifts and Tokens work',
    body: 'Tokens are a closed-loop currency used only inside Rally. You spend them on Gifts; they can never be withdrawn or converted to cash. When you send a Gift, Gift Points go to the Favorite after platform fees, and your support counts toward their level and the supporter wall.',
  },
  {
    icon: 'lock-closed-outline',
    title: 'Recover my account',
    body: 'Use Forgot password on the login screen - reset links expire in 30 minutes and come only from official Rally channels. If you have two-factor enabled and lost your codes, use a recovery code, or message support from the email on your account.',
  },
  {
    icon: 'flag-outline',
    title: 'Report someone',
    body: 'Open the person\u2019s profile, tap the menu, and choose Report. Reports go to moderation and are reviewed within 24 hours. Blocking someone hides you from each other without telling them.',
  },
  {
    icon: 'trophy-outline',
    title: 'How ranking works',
    body: 'Rank blends unique supporters, gifts (soft-capped so money never dominates) and recent activity. It updates daily, money cannot buy a spot, and no earnings are shown anywhere.',
  },
];

export default function HelpCenterScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();

  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const filtered = ARTICLES.filter((a) => a.title.toLowerCase().indexOf(q.trim().toLowerCase()) >= 0);

  return (
    <SwipeBack>
      <Screen>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Help</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Search */}
          <View style={[styles.searchBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Ionicons name="search" size={18} color={colors.muted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search for help"
              placeholderTextColor={colors.muted}
              value={q}
              onChangeText={setQ}
              returnKeyType="search"
            />
          </View>

          <Text style={[styles.section, { color: colors.muted }]}>{q.trim() ? 'RESULTS' : 'POPULAR'}</Text>

          {filtered.length === 0 ? (
            <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>
              Nothing matches that. Talk to support below.
            </Text>
          ) : (
            <View style={[styles.list, { borderColor: colors.border }]}>
              {filtered.map((a, i) => {
                const isOpen = open === a.title;
                return (
                  <View key={a.title} style={[i < filtered.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                    <Pressable
                      style={styles.row}
                      onPress={() => { impact('light'); setOpen(isOpen ? null : a.title); }}
                      accessibilityLabel={a.title}
                    >
                      <View style={[styles.iconBubble, { backgroundColor: colors.surfaceElevated }]}>
                        <Ionicons name={a.icon as any} size={19} color={GOLD} />
                      </View>
                      <Text style={[styles.rowLabel, { color: colors.text }]}>{a.title}</Text>
                      <Ionicons name={isOpen ? 'chevron-up' : 'chevron-forward'} size={18} color={colors.muted} />
                    </Pressable>
                    {isOpen ? (
                      <Text style={[styles.answer, { color: colors.muted }]}>{a.body}</Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}

          {/* Talk to support */}
          <Pressable
            style={[styles.supportCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            onPress={() => router.push('/support')}
            accessibilityLabel="Talk to support"
          >
            <View style={[styles.supportIcon, { backgroundColor: colors.surface }]}>
              <Ionicons name="chatbubble-outline" size={20} color={GOLD} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 }}>Talk to support</Text>
              <Text style={{ color: colors.muted, fontSize: 14, marginTop: 2 }}>Usually replies in under 2 hours</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Pressable>
        </ScrollView>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: radii.full, paddingHorizontal: 16, paddingVertical: 13 },
  searchInput: { flex: 1, fontSize: 16, padding: 0 },
  section: { fontSize: 12, fontWeight: '900', letterSpacing: 1, marginTop: spacing.md, marginBottom: 8 },
  list: { borderWidth: 1, borderRadius: radii.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 14 },
  iconBubble: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 16, fontWeight: '700' },
  answer: { fontSize: 14, lineHeight: 21, paddingHorizontal: 14, paddingBottom: 16 },
  supportCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: radii.lg, padding: 16, marginTop: spacing.md },
  supportIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
