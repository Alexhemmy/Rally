/** Onboarding
 * Step-by-step checklist for new Favorites.
 */
import { Text, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { GlassCard } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, radii, type as typo } from '@/constants/theme';

const STEPS = [
  {
    number: '1',
    title: 'Photo & name',
    body: 'Add a profile photo and the name you want fans to see.',
  },
  {
    number: '2',
    title: 'Bio & category',
    body: 'Write a short bio and choose the category that fits you best.',
  },
  {
    number: '3',
    title: 'Verify KYC',
    body: 'Complete identity verification so you can receive payouts safely.',
  },
  {
    number: '4',
    title: 'Connect payout',
    body: 'Link your preferred payout method.',
  },
  {
    number: '5',
    title: 'Publish first Moment',
    body: 'Share your first Moment and start connecting with fans.',
  },
];

export default function OnboardingScreen() {
  const { colors } = useTheme();

  return (
    <SwipeBack>
      <Screen>
        <Text style={[styles.h1, { color: colors.text }]}>Onboarding</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Everything you need to get started as a Favorite.
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
                  <Text
                    style={{
                      color: colors.primary,
                      fontWeight: '800',
                      fontSize: 15,
                    }}
                  >
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
    </SwipeBack>
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
