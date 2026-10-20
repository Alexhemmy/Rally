/** Terms of use
 * Short, clear summary of the key platform rules.
 */
import { Text, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { GlassCard } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, type as typo } from '@/constants/theme';

const TERMS = [
  {
    title: 'Support is voluntary',
    body: 'Gifts and support are given freely. There is no obligation to continue supporting any Favorite.',
  },
  {
    title: 'Tokens are closed-loop',
    body: 'Tokens can only be spent inside Rally (on Gifts and experiences). They are never withdrawable or convertible to cash.',
  },
  {
    title: 'Zero tolerance',
    body: 'Threats, hate speech, harassment, and exploitation of any kind are strictly prohibited and will result in removal.',
  },
];

export default function TermsScreen() {
  const { colors } = useTheme();

  return (
    <SwipeBack>
      <Screen>
        <Text style={[styles.h1, { color: colors.text }]}>Terms of use</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          The essentials of using Rally.
        </Text>

        <View style={{ gap: 12, marginTop: spacing.sm }}>
          {TERMS.map((item) => (
            <GlassCard key={item.title}>
              <Text style={[styles.termTitle, { color: colors.text }]}>
                {item.title}
              </Text>
              <Text style={[styles.termBody, { color: colors.muted }]}>
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
          Full legal terms are available on the website.
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
  termTitle: {
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 6,
  },
  termBody: {
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
