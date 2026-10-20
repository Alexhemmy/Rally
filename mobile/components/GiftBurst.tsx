/** GiftBurst
 * Fun celebratory animation when a gift is sent.
 * Shows a bouncing emoji + exploding particles, then fades out.
 */
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/components/ThemeProvider';

type Props = {
  visible: boolean;
  emoji?: string;
  onDone?: () => void;
};

export function GiftBurst({ visible, emoji = '🎁', onDone }: Props) {
  const { colors } = useTheme();

  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const particles = useRef(
    Array.from({ length: 8 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      o: new Animated.Value(0),
    })),
  ).current;

  useEffect(() => {
    if (!visible) return;

    // Reset values
    scale.setValue(0.2);
    opacity.setValue(1);
    particles.forEach((p) => {
      p.x.setValue(0);
      p.y.setValue(0);
      p.o.setValue(1);
    });

    // Create particle burst
    const burstAnimations = particles.map((p, i) => {
      const angle = (i / particles.length) * Math.PI * 2;
      const distance = 75 + (i % 3) * 28;

      return Animated.parallel([
        Animated.timing(p.x, {
          toValue: Math.cos(angle) * distance,
          duration: 680,
          useNativeDriver: true,
        }),
        Animated.timing(p.y, {
          toValue: Math.sin(angle) * distance - 36,
          duration: 680,
          useNativeDriver: true,
        }),
        Animated.timing(p.o, {
          toValue: 0,
          duration: 680,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel([
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.28,
          friction: 4,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 880,
        delay: 320,
        useNativeDriver: true,
      }),
      ...burstAnimations,
    ]).start(() => {
      onDone?.();
    });
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View
        style={[
          styles.center,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={[styles.label, { color: colors.primaryHover }]}>
          Gift sent!
        </Text>
      </Animated.View>

      {particles.map((p, i) => (
        <Animated.Text
          key={i}
          style={[
            styles.particle,
            {
              opacity: p.o,
              transform: [
                { translateX: p.x },
                { translateY: p.y },
              ],
            },
          ]}
        >
          {['✨', '💛', '⭐', '💫'][i % 4]}
        </Animated.Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  center: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
  },
  label: {
    marginTop: 8,
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: -0.2,
  },
  particle: {
    position: 'absolute',
    fontSize: 22,
  },
});
