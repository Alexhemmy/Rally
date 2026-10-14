import { useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { api, getToken } from '@/lib/api';
import { colors, spacing, radii } from '@/constants/theme';
import { SwipeBack } from '@/components/SwipeBack';

export default function VerifyScreen() {
  const [session, setSession] = useState<any>(null);
  const [error, setError] = useState('');

  async function start() {
    const token = getToken();
    if (!token) { setError('Auth required'); return; }
    try {
      const r = await api<{ session: any }>('/api/providers/kyc/start', { method: 'POST', token });
      setSession(r.session);
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <SwipeBack>
      <Screen>
        <Text style={styles.h1}>Verification</Text>
        <Text style={styles.muted}>Required before payouts.</Text>
        <PrimaryButton label="Start KYC" onPress={start} />
        {session && (
          <View style={styles.card}>
            <Text style={styles.muted}>Provider: {session.provider}</Text>
            <Text style={styles.muted}>Status: {session.status}</Text>
          </View>
        )}
        {!!error && <Text style={styles.err}>{error}</Text>}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  muted: { color: colors.muted, marginBottom: 8, fontSize: 14 },
  err: { color: colors.danger, marginTop: 8 },
  card: {
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1,
    borderColor: colors.border, padding: spacing.md, marginTop: 12,
  },
});
