/** Permissions
 * App permissions — currently notification permission (extensible).
 * Clean status display + request flow.
 */
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen } from '@/components/Screen';
import { GradientButton, GlassCard } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, radii, type as typo } from '@/constants/theme';
import * as Notifications from 'expo-notifications';
import { useHaptics } from '@/hooks/useHaptics';

type PermStatus = 'unknown' | 'granted' | 'denied' | 'undetermined';

export default function PermissionsScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();

  const [notif, setNotif] = useState<PermStatus>('unknown');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const current = await Notifications.getPermissionsAsync();
        setNotif(
          current.granted
            ? 'granted'
            : current.canAskAgain
            ? 'undetermined'
            : 'denied',
        );
      } catch {
        setNotif('unknown');
      }
    })();
  }, []);

  const request = async () => {
    setBusy(true);
    impact('medium');

    try {
      const res = await Notifications.requestPermissionsAsync();
      setNotif(
        res.granted
          ? 'granted'
          : res.canAskAgain
          ? 'undetermined'
          : 'denied',
      );

      if (res.granted) {
        impact('success');
      }
    } catch {
      setNotif('unknown');
    } finally {
      setBusy(false);
    }
  };

  const statusLabel =
    notif === 'granted'
      ? 'Granted'
      : notif === 'denied'
      ? 'Blocked — enable in system settings'
      : notif === 'undetermined'
      ? 'Not asked yet'
      : 'Unknown';

  const badgeColor =
    notif === 'granted'
      ? colors.success
      : notif === 'denied'
      ? colors.danger
      : colors.muted;

  return (
    <Screen scroll={false} padded>
      <Text style={[styles.h1, { color: colors.text }]}>Permissions</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Control what Rally can access on your device.
      </Text>

      <GlassCard style={{ marginTop: spacing.sm }}>
        <View style={styles.cardHead}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Notifications
          </Text>
          <View
            style={[
              styles.badge,
              { backgroundColor: badgeColor + '20' },
            ]}
          >
            <Text style={{ color: badgeColor, fontWeight: '700', fontSize: 12 }}>
              {statusLabel}
            </Text>
          </View>
        </View>

        <Text style={[styles.cardBody, { color: colors.muted }]}>
          Rally sends alerts for new Moments, gifts, campaign updates, and security events.
          {notif === 'denied'
            ? ' You previously declined — please re-enable notifications in your phone settings.'
            : ''}
        </Text>

        {notif !== 'granted' && (
          <View style={{ marginTop: spacing.md }}>
            <GradientButton
              label={busy ? 'Asking…' : 'Allow notifications'}
              onPress={request}
              loading={busy}
              disabled={busy || notif === 'denied'}
              fullWidth
            />
          </View>
        )}

        {notif === 'granted' && (
          <Text
            style={{
              marginTop: spacing.md,
              color: colors.success,
              fontWeight: '600',
              fontSize: 13,
            }}
          >
            You’re all set — you’ll receive important updates.
          </Text>
        )}
      </GlassCard>
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
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
  },
});
