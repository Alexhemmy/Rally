import { Text, StyleSheet } from 'react-native';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { SwipeBack } from '@/components/SwipeBack';

export default function Page() {
  return (
    <SwipeBack>
      <Screen>
        <Text style={styles.h1}>Onboarding</Text>
        <Text style={styles.muted}>1. Photo & name</Text>
        <Text style={styles.muted}>2. Bio & category</Text>
        <Text style={styles.muted}>3. Verify KYC</Text>
        <Text style={styles.muted}>4. Connect payout</Text>
        <Text style={styles.muted}>5. Publish first Moment</Text>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: spacing.sm, marginBottom: 12 },
  muted: { color: colors.muted, marginBottom: 8, fontSize: 14 },
});
