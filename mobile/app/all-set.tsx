/** All Set - Rally design (screen 62)
 * End of onboarding. Three things to try first, the Tokens note,
 * Start exploring lands on Home.
 */
import { Text, StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GradientButton } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { spacing, radii, type as typo } from '@/constants/theme';

const GREEN = '#34D399';

const CARDS = [
  { icon: 'play', label: 'Watch a Moment', value: 'Swipe up' },
  { icon: 'chatbubbles', label: 'Join a thread', value: 'Tap a comment' },
  { icon: 'gift', label: 'Send your first Gift', value: 'From \u20a6100' },
];

export default function AllSetScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name: string }>();
  const { impact } = useHaptics();
  const { success } = useSounds();

  function start() {
    impact('success');
    success();
    router.replace('/(tabs)' as any);
  }

  const first = String(name || '').trim().split(/\s+/)[0];

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <Text style={[styles.h1, { color: colors.text }]}>You are in{first ? ', ' + first : ''}</Text>
        <Text style={[styles.sub, { color: colors.muted }]}>Here are three things to try first.</Text>

        {CARDS.map((c) => (
          <View key={c.label} style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <View style={[styles.cardIcon, { backgroundColor: 'rgba(255,167,38,0.15)' }]}>
              <Ionicons name={c.icon as any} size={22} color={'#FFA726'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>{c.label}</Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{c.value}</Text>
            </View>
            <Ionicons name={'chevron-forward'} size={18} color={colors.muted} />
          </View>
        ))}

        <View style={styles.noteRow}>
          <Ionicons name={'checkmark-circle'} size={16} color={GREEN} />
          <Text style={[styles.note, { color: colors.muted }]}>
            Tokens are for sending Gifts. They cannot be withdrawn or sold, and spending never changes anyone{'\u2019'}s rank.
          </Text>
        </View>

        <GradientButton label={'Start exploring'} onPress={start} fullWidth />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { ...typo.h1, fontSize: 26, marginBottom: 6 },
  sub: { fontSize: 13, lineHeight: 19, marginBottom: spacing.lg },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: radii.lg, padding: 14, marginBottom: 12 },
  cardIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  noteRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginVertical: spacing.md },
  note: { flex: 1, fontSize: 12, lineHeight: 18 },
});
