import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, spacing, useLayout, scaleFont } from '@/constants/theme';
import { useState, useCallback } from 'react';

export default function HomeTab() {
  const { isTablet, fontScale } = useLayout();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Text style={styles.badge}>Mobile · pull to refresh</Text>
      <Text style={[styles.title, { fontSize: scaleFont(isTablet ? 40 : 34, fontScale) }]}>Rally</Text>
      <Text style={styles.subtitle}>
        Support Favorites with Gifts and Moments. Native share, offline banner, and haptic taps are
        mobile-only.
      </Text>
      <View style={styles.actions}>
        <Link href="/favorite/mia" asChild>
          <View>
            <PrimaryButton label="Open @mia" onPress={() => {}} />
          </View>
        </Link>
        {/* Link wraps need Pressable — use href buttons via router in production */}
        <Link href="/explore" asChild>
          <View style={{ marginTop: 10 }}>
            <PrimaryButton label="Explore" onPress={() => {}} variant="ghost" />
          </View>
        </Link>
        <Link href="/compose-moment" asChild>
          <View style={{ marginTop: 10 }}>
            <PrimaryButton label="Compose Moment" onPress={() => {}} variant="ghost" />
          </View>
        </Link>
        <Link href="/login" asChild>
          <View style={{ marginTop: 10 }}>
            <PrimaryButton label="Log in" onPress={() => {}} variant="ghost" />
          </View>
        </Link>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>On this device</Text>
        <Text style={styles.muted}>• Bottom tabs · safe areas</Text>
        <Text style={styles.muted}>• System share sheet</Text>
        <Text style={styles.muted}>• Vibration haptics</Text>
        <Text style={styles.muted}>• Offline health probe</Text>
        <Text style={styles.muted}>• Pull-to-refresh</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    color: colors.primaryHover,
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.35)',
  },
  title: { fontWeight: '800', color: colors.primary, marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.muted, marginBottom: spacing.lg, lineHeight: 22 },
  actions: { marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  cardTitle: { color: colors.primaryHover, fontWeight: '700', marginBottom: 8 },
  muted: { color: colors.muted, marginBottom: 4, fontSize: 14 },
});
