import { Text, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, spacing, radii } from '@/constants/theme';
import { SwipeBack } from '@/components/SwipeBack';

export default function CampaignDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <SwipeBack>
      <Screen>
        <Text style={styles.h1}>Campaign</Text>
        <Text style={styles.muted}>ID: {String(id)}</Text>
        <View style={styles.card}>
          <Text style={styles.h2}>Transparency</Text>
          <Text style={styles.muted}>• Raised, fees, payouts with dates</Text>
          <Text style={styles.muted}>• Payee is verified organization only</Text>
          <PrimaryButton label="Donate" onPress={() => {}} style={{ marginTop: 12 }} />
        </View>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  h2: { fontSize: 16, fontWeight: '600', color: colors.primaryHover, marginBottom: 8 },
  muted: { color: colors.muted, marginBottom: 6, fontSize: 14 },
  card: {
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1,
    borderColor: colors.border, padding: spacing.md, marginTop: 8,
  },
});
