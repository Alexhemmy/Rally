/** Account Created - Rally design (screen 13)
 * Green success mark, confirmed contact line, settings note,
 * Set up my profile continues to language and interests.
 */
import { Text, StyleSheet, View } from 'react-native';
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

export default function AccountCreatedScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { email, phone } = useLocalSearchParams<{ email: string; phone: string }>();
  const { impact } = useHaptics();
  const { success } = useSounds();

  return (
    <Screen>
      <View style={styles.track}>
        <View style={{ flex: 0.8, backgroundColor: GOLD, borderRadius: 2 }} />
        <View style={{ flex: 0.2 }} />
      </View>
      <View style={styles.center}>
        <View style={styles.mark}>
          <Ionicons name={'checkmark'} size={56} color={'#fff'} />
        </View>
        <Text style={[styles.h1, { color: colors.text }]}>Account created</Text>
        <Text style={[styles.sub, { color: colors.muted }]}>
          {email
            ? 'Your email ' + email + ' is confirmed.'
            : 'Your phone number ' + (phone || '') + ' is confirmed.'}
          {'\n'}Next, tell us your language and what you love.
        </Text>
        <View style={styles.noteRow}>
          <Ionicons name={'checkmark-circle'} size={16} color={GREEN} />
          <Text style={[styles.note, { color: colors.muted }]}>You can change your language, interests and limits at any time in Settings.</Text>
        </View>
      </View>
      <GradientButton
        label={'Set up my profile'}
        onPress={() => { impact('success'); success(); router.replace('/onboarding-preferences' as any); }}
        fullWidth
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', height: 4, borderRadius: 2, backgroundColor: 'rgba(128,128,128,0.25)', marginBottom: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mark: { width: 96, height: 96, borderRadius: 28, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  h1: { ...typo.h1, fontSize: 28, marginBottom: 8 },
  sub: { fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 300, marginBottom: spacing.lg },
  noteRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', maxWidth: 300 },
  note: { flex: 1, fontSize: 12, lineHeight: 17 },
});
