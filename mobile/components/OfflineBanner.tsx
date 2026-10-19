import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNetwork } from '@/hooks/useNetwork';
import { useTheme } from '@/components/ThemeProvider';

/** Floating pill — only shows when the server is truly unreachable. */
export function OfflineBanner() {
  const { online, checking, configured, recheck } = useNetwork();
  const { colors } = useTheme();
  const router = useRouter();
  if (online) return null;

  return (
    <View style={styles.anchor}>
      <View style={[styles.pill, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        <View style={[styles.dot, { backgroundColor: configured ? colors.danger : colors.warning }]} />
        <Pressable style={styles.press} onPress={recheck}>
          <Text style={[styles.text, { color: colors.text }]}>
            {checking ? 'Checking…' : configured ? "Can't reach Rally · Tap to retry" : 'No server connected'}
          </Text>
        </Pressable>
        <Pressable onPress={() => router.push('/connection')} accessibilityLabel="Connection settings" hitSlop={8}>
          <Ionicons name="settings-outline" size={17} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: { position: 'absolute', top: 10, left: 16, right: 16, zIndex: 30 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  press: { flex: 1 },
  text: { fontWeight: '700', fontSize: 12.5 },
});
