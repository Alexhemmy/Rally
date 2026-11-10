/** Favorite Page Ready - Rally design (screen 61)
 * Shown to new Favorites once their page is live: setup checklist
 * with the next action highlighted, fair-rankings note, and buttons
 * to post a first Moment or view the page.
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

const GOLD = '#FFA726';
const GREEN = '#34D399';

export default function FavoriteReadyScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { name, categories } = useLocalSearchParams<{ name: string; categories: string }>();
  const { impact } = useHaptics();
  const { success } = useSounds();

  const steps = [
    { label: 'Profile and specialties', meta: 'Done', done: true },
    { label: 'Post your first Moment', meta: '2 min', done: false },
    { label: 'Choose your Gifts', meta: 'Optional', done: false },
    { label: 'Add a payout account', meta: 'To cash out', done: false },
  ];

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <Text style={[styles.h1, { color: colors.text }]}>Your page is live</Text>
        <Text style={[styles.sub, { color: colors.muted }]}>
          Fans can find you in {String(categories || 'Gospel and Afro-fusion')}. Three steps help you get your first supporters.
        </Text>

        {steps.map((s, i) => (
          <View
            key={s.label}
            style={[
              styles.step,
              { borderColor: i === 1 ? GOLD : colors.border, backgroundColor: colors.surface },
            ]}
          >
            <View style={[styles.stepNum, s.done ? { backgroundColor: GREEN } : { backgroundColor: 'rgba(128,128,128,0.25)' }]}>
              {s.done ? (
                <Ionicons name={'checkmark'} size={16} color={'#fff'} />
              ) : (
                <Text style={{ color: colors.text, fontWeight: '900', fontSize: 13 }}>{i + 1}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>{s.label}</Text>
            </View>
            <Text style={{ color: s.done ? GREEN : colors.muted, fontWeight: '700', fontSize: 12 }}>{s.meta}</Text>
          </View>
        ))}

        <View style={styles.noteRow}>
          <Ionicons name={'checkmark-circle'} size={16} color={GREEN} />
          <Text style={[styles.note, { color: colors.muted }]}>
            Rankings depend on activity and community, not on what fans spend.
          </Text>
        </View>

        <GradientButton
          label={'Post a Moment'}
          onPress={() => { impact('success'); success(); router.push('/compose-moment' as any); }}
          fullWidth
        />
        <View style={{ marginTop: 12 }} />
        <GradientButton
          label={'Go to my page'}
          variant={'ghost'}
          onPress={() => { impact('light'); router.replace('/(tabs)' as any); }}
          fullWidth
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { ...typo.h1, fontSize: 26, marginBottom: 6 },
  sub: { fontSize: 13, lineHeight: 19, marginBottom: spacing.lg },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 2, borderRadius: radii.lg, padding: 14, marginBottom: 12 },
  stepNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  noteRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginVertical: spacing.md },
  note: { flex: 1, fontSize: 12, lineHeight: 18 },
});
