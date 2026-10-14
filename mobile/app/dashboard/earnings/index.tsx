import { useEffect, useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { api, getToken } from '@/lib/api';
import { colors, spacing, radii } from '@/constants/theme';
import { SwipeBack } from '@/components/SwipeBack';
import { useRouter } from 'expo-router';

export default function EarningsScreen() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) { setError('Auth required'); return; }
    api('/api/favorites/me/earnings', { token }).then(setData).catch((e: any) => setError(e.message));
  }, []);

  return (
    <SwipeBack>
      <Screen>
        <Text style={styles.h1}>Earnings</Text>
        <Text style={styles.muted}>Gift Points convert at published rate.</Text>
        {!!error && <Text style={styles.err}>{error}</Text>}
        {data && (
          <View style={styles.card}>
            <Text style={styles.name}>Available: {String(data.balance?.available)}</Text>
            <Text style={styles.muted}>Pending: {String(data.balance?.pending)}</Text>
            <PrimaryButton label="Go to payouts" onPress={() => router.push('/dashboard/payouts')} style={{ marginTop: 12 }} />
          </View>
        )}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  muted: { color: colors.muted, marginBottom: 8, fontSize: 14 },
  name: { color: colors.text, fontWeight: '700', fontSize: 16 },
  err: { color: colors.danger, marginBottom: 8 },
  card: {
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1,
    borderColor: colors.border, padding: spacing.md, marginTop: 8,
  },
});
