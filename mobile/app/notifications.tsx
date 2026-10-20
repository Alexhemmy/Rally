/** Notifications
 * In-app notification list.
 * Currently a clean empty state — ready to be wired to /api/notifications.
 */
import { Text, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { GlassCard, EmptyState } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, type as typo } from '@/constants/theme';

export default function NotificationsScreen() {
  const { colors } = useTheme();

  // Placeholder — replace with real data later
  const notifications: any[] = [];

  return (
    <Screen>
      <Text style={[styles.h1, { color: colors.text }]}>Notifications</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Stay updated on Moments, gifts, campaigns, and security events.
      </Text>

      {notifications.length === 0 ? (
        <EmptyState
          icon="notifications-outline"
          title="No notifications yet"
          body="When something important happens, it will show up here."
        />
      ) : (
        <View style={{ gap: 10 }}>
          {/* Future notification items go here */}
        </View>
      )}
    </Screen>
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
});
