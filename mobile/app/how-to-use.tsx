import { ScrollView, Text, StyleSheet } from 'react-native';
import { colors, spacing, radii } from '@/constants/theme';

export default function HowToUse() {
  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <Text style={styles.h1}>How to use</Text>
      <Text style={styles.card}>1. Register as Fan or Favorite</Text>
      <Text style={styles.card}>2. Buy Tokens (Paystack / Flutterwave / Stripe)</Text>
      <Text style={styles.card}>3. Send Gifts on pages & Moments</Text>
      <Text style={styles.card}>4. Favorites verify via KYC and cash out Gift Points</Text>
      <Text style={styles.card}>5. Join live sessions when LiveKit/Agora is configured</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: spacing.md, paddingBottom: 40 },
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 12 },
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
