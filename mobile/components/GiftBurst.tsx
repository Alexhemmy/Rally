import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/theme';

type Props = { visible: boolean; emoji?: string; onDone?: () => void };

export function GiftBurst({ visible, emoji = '🎁', onDone }: Props) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const particles = useRef(
    Array.from({ length: 8 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      o: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0.2);
    opacity.setValue(1);
    particles.forEach((p) => {
      p.x.setValue(0);
      p.y.setValue(0);
      p.o.setValue(1);
    });
    const burst = particles.map((p, i) => {
      const angle = (i / particles.length) * Math.PI * 2;
      const dist = 80 + (i % 3) * 30;
      return Animated.parallel([
        Animated.timing(p.x, { toValue: Math.cos(angle) * dist, duration: 700, useNativeDriver: true }),
        Animated.timing(p.y, { toValue: Math.sin(angle) * dist - 40, duration: 700, useNativeDriver: true }),
        Animated.timing(p.o, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]);
    });
    Animated.parallel([
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.25, friction: 4, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
      ]),
      Animated.timing(opacity, { toValue: 0, duration: 900, delay: 350, useNativeDriver: true }),
      ...burst,
    ]).start(() => onDone?.());
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View style={[styles.center, { opacity, transform: [{ scale }] }]}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.label}>Gift sent!</Text>
      </Animated.View>
      {particles.map((p, i) => (
        <Animated.Text
          key={i}
          style={[styles.particle, { opacity: p.o, transform: [{ translateX: p.x }, { translateY: p.y }] }]}
        >
          {['✨', '💛', '⭐', '💫'][i % 4]}
        </Animated.Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  center: { alignItems: 'center' },
  emoji: { fontSize: 64 },
  label: { marginTop: 8, color: colors.primaryHover, fontWeight: '800', fontSize: 18 },
  particle: { position: 'absolute', fontSize: 22 },
});
