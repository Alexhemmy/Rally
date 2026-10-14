import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, radii } from '@/constants/theme';

export default function Settings() {
  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <Text style={styles.h1}>Settings</Text>
      <View style={styles.card}>
        <Text style={styles.h2}>Language</Text>
        <Text style={styles.muted}>en · fr · es · pt · ar · sw · ha · yo · ig · pcm</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.h2}>Spend cap</Text>
        <Text style={styles.muted}>Monthly Token limit · soft reminders</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.h2}>Providers</Text>
        <Text style={styles.muted}>Payments · KYC · Live · Translate via env config</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: spacing.md },
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 12 },
  h2: { color: colors.primaryHover, fontWeight: '600', marginBottom: 4 },
  muted: { color: colors.muted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: 10,
  },
});
