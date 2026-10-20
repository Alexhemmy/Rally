/** Privacy policy
 * Short, clear summary of how Rally handles data.
 */
import { Text, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { GlassCard } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, type as typo } from '@/constants/theme';

const POINTS = [
  {
    title: 'Data we process',
    body: 'Account details and payment information are processed according to our full privacy policy.',
  },
  {
    title: 'Your rights',
    body: 'You can request access to your data, export it, or ask for permanent deletion at any time.',
  },
  {
    title: 'Session security',
    body: 'Sessions automatically expire after 7 days of inactivity for your protection.',
  },
];

export default function PrivacyScreen() {
  const { colors } = useTheme();

  return (
    <SwipeBack>
      <Screen>
        <Text style={[styles.h1, { color: colors.text }]}>Privacy policy</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          How we handle your information.
        </Text>

        <View style={{ gap: 12, marginTop: spacing.sm }}>
          {POINTS.map((item) => (
            <GlassCard key={item.title}>
              <Text style={[styles.pointTitle, { color: colors.text }]}>
                {item.title}
              </Text>
              <Text style={[styles.pointBody, { color: colors.muted }]}>
                {item.body}
              </Text>
            </GlassCard>
          ))}
        </View>

        <Text
          style={[
            styles.footer,
            { color: colors.muted },
          ]}
        >
          Full privacy policy is available on the website.
        </Text>
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
  pointTitle: {
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 6,
  },
  pointBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: spacing.xl,
    lineHeight: 18,
  },
});
