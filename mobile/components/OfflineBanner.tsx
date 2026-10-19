import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useNetwork } from '@/hooks/useNetwork';
import { useTheme } from '@/components/ThemeProvider';

/**
 * Shown only when the Rally server is actually unreachable, or when no
 * server is configured at all (tap the gear to set one).
 */
export function OfflineBanner() {
  const { online, checking, configured, recheck } = useNetwork();
  const { colors } = useTheme();
  const router = useRouter();
  if (online) return null;

  return (
    <View style={[styles.wrap, { backgroundColor: configured ? colors.danger : colors.primary }]}>
      <Pressable style={styles.press} onPress={recheck} accessibilityRole="alert">
        <Text style={[styles.text, { color: colors.onPrimary }]}>
          {checking
            ? 'Checking connection…'
            : configured
              ? "Can't reach Rally · Tap to retry"
              : 'No server connected yet'}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => router.push('/connection')}
        accessibilityLabel="Connection settings"
        style={styles.gear}
      >
        <Text style={[styles.text, { color: colors.onPrimary, fontSize: 15 }]}>⚙︎</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  press: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  gear: { paddingHorizontal: 16, paddingVertical: 4 },
  text: { fontWeight: '700', fontSize: 13 },
});
