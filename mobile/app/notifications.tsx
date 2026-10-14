import { Text, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { colors, spacing, radii } from '@/constants/theme';

export default function Notifications() {
  return (
    <Screen>
      <Text style={styles.h1}>Notifications</Text>
      <Text style={styles.muted}>
        Mobile push via FCM / APNs when keys are configured. In-app list mirrors /api/notifications.
      </Text>
      <View style={styles.card}>
        <Text style={styles.item}>No notifications yet</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  muted: { color: colors.muted, marginBottom: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  item: { color: colors.muted },
});
