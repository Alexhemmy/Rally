/** Notifications
 * In-app notification list, wired to /api/notifications.
 * Tap a notification to mark it read.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable } from 'react-native';
import { Screen } from '@/components/Screen';
import { GlassCard, EmptyState } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { api } from '@/lib/api';
import { spacing, radii, type as typo } from '@/constants/theme';

type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await api<{ notifications: AppNotification[] }>('/api/notifications');
      setNotifications(r.notifications || []);
    } catch {
      // offline — keep current list
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = useCallback(async (n: AppNotification) => {
    if (n.isRead) return;
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    try {
      await api('/api/notifications/' + n.id + '/read', { method: 'POST' });
    } catch {
      // best effort
    }
  }, []);

  return (
    <Screen refreshing={refreshing} onRefresh={load}>
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
        <GlassCard padded={false}>
          {notifications.map((n, index) => (
            <Pressable
              key={n.id}
              onPress={() => markRead(n)}
              style={({ pressed }) => [
                styles.item,
                {
                  borderBottomWidth: index < notifications.length - 1 ? StyleSheet.hairlineWidth : 0,
                  borderBottomColor: colors.border,
                  backgroundColor: pressed ? colors.surfaceHover : 'transparent',
                },
              ]}
            >
              <View style={styles.dotRow}>
                {!n.isRead && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
                <Text style={{ color: colors.muted, fontSize: 12 }}>
                  {new Date(n.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={[styles.title, { color: n.isRead ? colors.muted : colors.text }]}>
                {n.title}
              </Text>
              {n.body ? (
                <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 19 }}>
                  {n.body}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </GlassCard>
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
  item: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 4,
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    fontWeight: '700',
    fontSize: 15,
  },
});
