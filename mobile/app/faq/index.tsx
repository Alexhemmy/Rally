/** FAQ
 * Quick answers to the most common questions.
 */
import { Text, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { GlassCard } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, type as typo } from '@/constants/theme';

const FAQS = [
  {
    question: 'What are Tokens?',
    answer:
      'Tokens are a closed-loop currency used only inside Rally. You can spend them on Gifts, but they can never be withdrawn or converted to cash.',
  },
  {
    question: 'How do Gift Points work?',
    answer:
      'When you send a Gift, Gift Points go to the Favorite after platform fees. Favorites can later cash these out once verified.',
  },
  {
    question: 'How long do sessions last?',
    answer:
      'Sessions automatically expire after 7 days of inactivity for security.',
  },
];

export default function FAQScreen() {
  const { colors } = useTheme();

  return (
    <SwipeBack>
      <Screen>
        <Text style={[styles.h1, { color: colors.text }]}>FAQ</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Answers to the most common questions.
        </Text>

        <View style={{ gap: 12, marginTop: spacing.sm }}>
          {FAQS.map((item) => (
            <GlassCard key={item.question}>
              <Text style={[styles.question, { color: colors.text }]}>
                {item.question}
              </Text>
              <Text style={[styles.answer, { color: colors.muted }]}>
                {item.answer}
              </Text>
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
  question: {
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 6,
  },
  answer: {
    fontSize: 14,
    lineHeight: 20,
  },
});
