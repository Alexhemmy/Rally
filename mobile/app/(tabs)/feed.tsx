import { useCallback, useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { colors, spacing, radii } from '@/constants/theme';
import { shareMoment } from '@/hooks/useShare';
import { PrimaryButton } from '@/components/PrimaryButton';

export default function FeedTab() {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 700);
  }, []);

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Text style={styles.h1}>Feed</Text>
      <Text style={styles.muted}>Pull down to refresh · chronological Moments</Text>
      <View style={styles.card}>
        <Text style={styles.title}>Demo Moment</Text>
        <Text style={styles.muted}>@mia · New single snippet</Text>
        <PrimaryButton
          label="Share via system sheet"
          variant="ghost"
          onPress={() => shareMoment('New single snippet', 'demo')}
          style={{ marginTop: 12 }}
        />
      </View>
      <View style={styles.card}>
        <Text style={styles.muted}>Follow Favorites after login to fill this feed from the API.</Text>
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
