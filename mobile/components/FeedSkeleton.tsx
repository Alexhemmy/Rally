/** FeedSkeleton - Rally design
 * Loading placeholders for the Home feed: avatar circle, text lines and
 * a media block per card, with a gentle opacity pulse. Calm by default.
 */
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '@/components/ThemeProvider';
import { radii, spacing } from '@/constants/theme';

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  const { colors } = useTheme();
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.45, duration: 750, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const bone = { backgroundColor: colors.surfaceHover, opacity: pulse } as const;

  return (
    <View style={styles.wrap}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.head}>
            <Animated.View style={[styles.avatar, bone]} />
            <View style={styles.headLines}>
              <Animated.View style={[styles.line, { width: '45%' }, bone]} />
              <Animated.View style={[styles.line, { width: '85%' }, bone]} />
              <Animated.View style={[styles.line, { width: '60%' }, bone]} />
            </View>
          </View>
          {i === 0 ? <Animated.View style={[styles.media, bone]} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  card: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 14,
  },
  head: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  headLines: { flex: 1, marginLeft: 10, gap: 8 },
  line: { height: 12, borderRadius: 6 },
  media: {
    height: 180,
    borderRadius: radii.md,
    marginTop: 12,
  },
});
