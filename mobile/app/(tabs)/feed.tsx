import { useCallback, useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { colors, spacing, radii } from '@/constants/theme';
import { shareMoment } from '@/hooks/useShare';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useHaptics } from '@/hooks/useHaptics';
import { api, getToken } from '@/lib/api';

export default function FeedTab() {
  const [refreshing, setRefreshing] = useState(false);
  const [moments, setMoments] = useState<any[]>([]);
  const { impact } = useHaptics();

  const load = useCallback(async () => {
    setRefreshing(true);
    impact('selection');
    try {
      const token = typeof getToken === 'function' ? getToken() : null;
      if (token) {
        const res = await api<{ moments: any[] }>('/api/feed/home', { token });
        setMoments(res.moments || []);
      }
    } catch {
      /* offline or unauthenticated */
    } finally {
      setRefreshing(false);
    }
  }, [impact]);

  return (
    <Screen refreshing={refreshing} onRefresh={load}>
      <Text style={styles.h1}>Feed</Text>
      <Text style={styles.muted}>Pull down to refresh · haptic on complete</Text>
      {moments.map((m) => (
        <View key={m.id} style={styles.card}>
          <Text style={styles.title}>{m.title}</Text>
          <Text style={styles.muted}>@{m.favorite?.user?.handle}</Text>
        </View>
      ))}
      <View style={styles.card}>
        <Text style={styles.title}>Demo Moment</Text>
        <Text style={styles.muted}>@mia · New single snippet</Text>
        <PrimaryButton
          label="Share via system sheet"
          variant="ghost"
          onPress={() => {
            impact('light');
            shareMoment('New single snippet', 'demo');
          }}
          style={{ marginTop: 12 }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  muted: { color: colors.muted, marginBottom: 12, fontSize: 14 },
  title: { color: colors.text, fontWeight: '700', fontSize: 16, marginBottom: 4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: 10,
  },
});
