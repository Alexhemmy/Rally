import { Text, StyleSheet } from 'react-native';
import { Screen } from '@/components/Screen';
import { colors, spacing, radii } from '@/constants/theme';

export default function HowToUse() {
  return (
    <Screen>
      <Text style={styles.h1}>How to use</Text>
      {['Register as Fan or Favorite', 'Buy Tokens', 'Send Gifts on pages & Moments', 'Share profiles from the system sheet', 'Favorites verify KYC and cash out'].map((t) => (
        <Text key={t} style={styles.card}>{t}</Text>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 12, marginTop: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: 8,
    color: colors.muted,
  },
});
