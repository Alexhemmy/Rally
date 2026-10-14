import { Text, StyleSheet } from 'react-native';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { SwipeBack } from '@/components/SwipeBack';

export default function Page() {
  return (
    <SwipeBack>
      <Screen>
        <Text style={styles.h1}>Privacy policy</Text>
        <Text style={styles.muted}>Account and payment data processed per policy.</Text>
        <Text style={styles.muted}>Rights: access, export, deletion.</Text>
        <Text style={styles.muted}>Sessions expire after 7 days of inactivity.</Text>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: spacing.sm, marginBottom: 12 },
  muted: { color: colors.muted, marginBottom: 8, fontSize: 14 },
});
