import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing } from '@/constants/theme';
import { useNetwork } from '@/hooks/useNetwork';

export function OfflineBanner() {
  const { online, checking, recheck } = useNetwork();
  if (online) return null;
  return (
    <Pressable onPress={recheck} style={styles.banner} accessibilityRole="alert">
      <Text style={styles.text}>
        {checking ? 'Checking connection…' : "You're offline · Tap to retry"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.danger,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  text: { color: '#1a0505', fontWeight: '700', fontSize: 13 },
});
