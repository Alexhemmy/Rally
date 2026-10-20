/** OfflineBanner
 * Floating pill that only appears when the server is unreachable.
 * Subtle, non-intrusive, and easy to act on.
 */
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNetwork } from '@/hooks/useNetwork';
import { useTheme } from '@/components/ThemeProvider';
import { radii, spacing } from '@/constants/theme';

export function OfflineBanner() {
  const { online, checking, configured, recheck } = useNetwork();
  const { colors } = useTheme();
  const router = useRouter();

  // Don't show anything when we're online
  if (online) return null;

  const statusText = checking
    ? 'Checking connection…'
    : configured
    ? "Can't reach Rally · Tap to retry"
    : 'No server connected';

  return (
    <View style={styles.anchor} pointerEvents="box-none">
      <View
        style={[
          styles.pill,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.border,
          },
        ]}
      >
        {/* Status indicator */}
        <View
          style={[
            styles.dot,
            {
              backgroundColor: configured ? colors.danger : colors.warning,
            },
          ]}
        />

        {/* Main action – retry */}
        <Pressable
          style={styles.press}
          onPress={recheck}
          hitSlop={6}
        >
          <Text
            style={[styles.text, { color: colors.text }]}
            numberOfLines={1}
          >
            {statusText}
          </Text>
        </Pressable>

        {/* Settings shortcut */}
        <Pressable
          onPress={() => router.push('/connection')}
          accessibilityLabel="Connection settings"
          hitSlop={10}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons
            name="settings-outline"
            size={17}
            color={colors.primary}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    zIndex: 40,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radii.full,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    // Soft elevated shadow
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  press: {
    flex: 1,
  },
  text: {
    fontWeight: '700',
    fontSize: 12.5,
    letterSpacing: 0.1,
  },
});
