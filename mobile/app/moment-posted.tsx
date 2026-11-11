/** Moment Posted - Rally design (mock 20)
 * Success screen after publishing. View Moment opens the real Moment,
 * Post another returns to the composer.
 */
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GradientButton } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing } from '@/constants/theme';

const GOLD = '#FFA726';
const TEAL = '#34D399';

export default function MomentPostedScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();
  const router = useRouter();
  const p = useLocalSearchParams<{ id?: string; title?: string }>();

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.wrap}>
          <View style={styles.checkWrap}>
            <View style={styles.check}>
              <Ionicons name={'checkmark'} size={44} color={'#063'} />
            </View>
          </View>
          <Text style={[styles.h1, { color: colors.text }]}>Your Moment is live</Text>
          <Text style={[styles.sub, { color: colors.muted }]}>
            Fans who follow you will see it first. It can also appear in For you.
          </Text>
          <LinearGradient colors={['#B0347C', '#E9703C', GOLD] as [string, string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.thumb} />
        </View>
        <View style={styles.footer}>
          <GradientButton
            label={'View Moment'}
            onPress={() => {
              impact('medium');
              if (p.id) router.replace('/moments/' + p.id);
              else router.back();
            }}
            fullWidth
          />
          <Pressable
            onPress={() => {
              impact('light');
              router.replace('/compose-moment');
            }}
            style={{ paddingVertical: 14 }}
          >
            <Text style={[styles.again, { color: colors.muted }]}>Post another</Text>
          </Pressable>
        </View>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 90 },
  checkWrap: { shadowColor: TEAL, shadowOpacity: 0.5, shadowRadius: 30, shadowOffset: { width: 0, height: 0 } },
  check: { width: 88, height: 88, borderRadius: 26, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center' },
  h1: { fontSize: 28, fontWeight: '900', marginTop: 28, textAlign: 'center' },
  sub: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 10, paddingHorizontal: 30 },
  thumb: { width: 130, height: 180, borderRadius: 16, marginTop: 40 },
  footer: { marginTop: 'auto', marginBottom: spacing.lg },
  again: { textAlign: 'center', fontWeight: '800', fontSize: 15 },
});
