import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/components/ThemeProvider';
import { PrimaryButton } from '@/components/PrimaryButton';
import * as Notifications from 'expo-notifications';

type PermStatus = 'unknown' | 'granted' | 'denied' | 'undetermined';

/** App permissions — currently notification permission; extensible. */
export default function PermissionsScreen() {
  const { colors } = useTheme();
  const [notif, setNotif] = useState<PermStatus>('unknown');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const cur = await Notifications.getPermissionsAsync();
        setNotif(cur.granted ? 'granted' : cur.canAskAgain ? 'undetermined' : 'denied');
      } catch {
        setNotif('unknown');
      }
    })();
  }, []);

  const request = async () => {
    setBusy(true);
    try {
      const res = await Notifications.requestPermissionsAsync();
      setNotif(res.granted ? 'granted' : res.canAskAgain ? 'undetermined' : 'denied');
    } catch {
      setNotif('unknown');
    } finally {
      setBusy(false);
    }
  };

  const label =
    notif === 'granted' ? 'Granted' :
    notif === 'denied' ? 'Blocked — enable it in system settings' :
    notif === 'undetermined' ? 'Not asked yet' : 'Unknown';

  const badgeColor =
    notif === 'granted' ? colors.success : notif === 'denied' ? colors.danger : colors.muted;

  return (
    <View style={[styles.wrap, { backgroundColor: colors.bg }]}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHead}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Notifications</Text>
          <Text style={[styles.badge, { color: badgeColor }]}>{label}</Text>
        </View>
        <Text style={[styles.cardBody, { color: colors.muted }]}>
          Rally sends alerts for new Moments, gifts, campaign updates and security events.
          {notif === 'denied' ? ' You previously declined — please re-enable it in your phone settings.' : ''}
        </Text>
        {notif !== 'granted' && (
          <PrimaryButton label={busy ? 'Asking…' : 'Allow notifications'} onPress={request} disabled={busy} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 20, gap: 12 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '800' },
  badge: { fontSize: 12, fontWeight: '700' },
  cardBody: { fontSize: 14, lineHeight: 20 },
});
