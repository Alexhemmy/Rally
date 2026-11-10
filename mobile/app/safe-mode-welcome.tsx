/** Safe Mode Welcome (Under 18) - Rally design (screen 60)
 * Shown to minors after setup. Lists the extra protections and
 * the parent or guardian link, then continues to All Set.
 */
import { Text, StyleSheet, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GradientButton } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { spacing, radii, type as typo } from '@/constants/theme';

const GREEN = '#34D399';

const ITEMS = [
  'Messages only from people you follow',
  'Lower spending limit, set with a parent',
  'No Rivalry, Call-Outs or cash gifting',
  'Break reminders every 30 minutes',
];

export default function SafeModeWelcomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name: string }>();
  const { impact } = useHaptics();
  const { success } = useSounds();

  function next() {
    impact('success');
    success();
    router.replace(('/all-set?name=' + encodeURIComponent(String(name || ''))) as any);
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <View style={styles.shieldWrap}>
          <View style={styles.shield}>
            <Ionicons name={'shield-checkmark'} size={36} color={'#fff'} />
          </View>
        </View>
        <Text style={[styles.h1, { color: colors.text }]}>Your account is set to Safe mode</Text>
        <Text style={[styles.sub, { color: colors.muted }]}>
          Because you are under 18, Rally turns on extra protections. They switch off automatically on your 18th birthday.
        </Text>

        {ITEMS.map((it) => (
          <View key={it} style={styles.itemRow}>
            <Ionicons name={'checkmark'} size={18} color={GREEN} />
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', flex: 1 }}>{it}</Text>
          </View>
        ))}

        <View style={[styles.noteBox, { backgroundColor: colors.surface }]}>
          <Ionicons name={'person'} size={18} color={GREEN} />
          <Text style={[styles.noteText, { color: colors.muted }]}>
            A parent or guardian can link to your account to see limits and reports. They cannot read your messages.
          </Text>
        </View>

        <GradientButton label={'Got it, continue'} onPress={next} fullWidth />
        <Text
          style={[styles.link, { color: colors.muted }]}
          onPress={() => router.push('/faq' as any)}
        >
          Learn more about Safe mode
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  shieldWrap: { alignItems: 'center', marginBottom: spacing.lg, marginTop: spacing.xl },
  shield: { width: 76, height: 76, borderRadius: 38, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  h1: { ...typo.h1, fontSize: 24, lineHeight: 32, textAlign: 'center', marginBottom: 8 },
  sub: { fontSize: 13, lineHeight: 20, textAlign: 'center', marginBottom: spacing.lg },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  noteBox: { flexDirection: 'row', gap: 10, borderRadius: radii.lg, padding: 14, marginTop: spacing.md, marginBottom: spacing.lg, alignItems: 'flex-start' },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18 },
  link: { textAlign: 'center', fontSize: 13, fontWeight: '700', marginTop: 16 },
});
