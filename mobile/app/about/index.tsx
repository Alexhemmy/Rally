/** About Rally
 * Vision and mission of the platform.
 */
import { Text, StyleSheet, View, Image } from 'react-native';
import { Screen } from '@/components/Screen';
import { GlassCard } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, type as typo } from '@/constants/theme';

export default function AboutScreen() {
  const { colors } = useTheme();

  return (
    <SwipeBack>
      <Screen>
        <Text style={[styles.h1, { color: colors.text }]}>About Rally</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Supporting the people you love, made simple.
        </Text>

        {/* Optional logo placement */}
        <View style={styles.logoWrap}>
          <Image
            source={require('@/assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={{ gap: 12, marginTop: spacing.md }}>
          <GlassCard>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Vision
            </Text>
            <Text style={[styles.cardBody, { color: colors.muted }]}>
              Make supporting someone you love as easy as following them.
            </Text>
          </GlassCard>

          <GlassCard>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Mission
            </Text>
            <Text style={[styles.cardBody, { color: colors.muted }]}>
              Turn passive fandom into active support — so creators and Favorites can thrive with the people who believe in them.
            </Text>
          </GlassCard>
        </View>

        <Text
          style={[
            styles.footer,
            { color: colors.muted },
          ]}
        >
          Built with care for fans and Favorites.
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
    marginBottom: spacing.md,
    lineHeight: 21,
  },
  logoWrap: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 18,
  },
  cardTitle: {
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 6,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 21,
  },
  footer: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: spacing.xl,
    lineHeight: 18,
  },
});
