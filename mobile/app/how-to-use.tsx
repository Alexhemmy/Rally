/** How to use
 * Simple step-by-step guide for new users.
 */
import { Text, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { GlassCard } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, radii, type as typo } from '@/constants/theme';

const STEPS = [
  {
    number: '1',
    title: 'Register as Fan or Favorite',
    body: 'Create an account and choose your role.',
  },
  {
    number: '2',
    title: 'Buy Tokens',
    body: 'Tokens are used to send Gifts and support Favorites.',
  },
  {
    number: '3',
    title: 'Send Gifts',
    body: 'Gift on profiles and Moments to show support.',
  },
  {
    number: '4',
    title: 'Share profiles',
    body: 'Use the system share sheet to spread the word.',
  },
  {
    number: '5',
    title: 'Favorites: Verify & cash out',
    body: 'Complete KYC to withdraw earnings safely.',
  },
];

export default function HowToUseScreen() {
  const { colors } = useTheme();

  return (
    <Screen>
      <Text style={[styles.h1, { color: colors.text }]}>How to use</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        A quick overview of the core flow on Rally.
      </Text>

      <View style={{ gap: 12, marginTop: spacing.sm }}>
        {STEPS.map((step) => (
          <GlassCard key={step.number} style={styles.stepCard}>
            <View style={styles.row}>
              <View
                style={[
                  styles.numberCircle,
                  { backgroundColor: colors.primaryMuted },
                ]}
              >
                <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 15 }}>
                  {step.number}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, { color: colors.text }]}>
                  {step.title}
                </Text>
                <Text style={[styles.stepBody, { color: colors.muted }]}>
                  {step.body}
                </Text>
              </View>
            </View>
          </GlassCard>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: {
    ...typo.h1,
    marginTop: spacing.sm,
    marginBottom: 6,
  },
  subtitle: {
    ...typo.body,
    marginBottom: spacing.lg,
    lineHeight: 21,
  },
  stepCard: {
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  numberCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 2,
  },
  stepBody: {
    fontSize: 13,
    lineHeight: 18,
  },
});
