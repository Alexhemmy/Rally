import { ReactNode, useRef } from 'react';
import { Animated, PanResponder, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSounds } from '@/hooks/useSounds';

type Props = { children: ReactNode; pullDown?: boolean; edgeSwipe?: boolean };

/** Pull-down or left-edge swipe to go back */
export function SwipeBack({ children, pullDown = true, edgeSwipe = true }: Props) {
  const router = useRouter();
  const { whoosh } = useSounds();
  const { height, width } = useWindowDimensions();
  const ty = useRef(new Animated.Value(0)).current;
  const tx = useRef(new Animated.Value(0)).current;

  const goBack = () => {
    whoosh();
    if (router.canGoBack()) router.back();
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => {
        if (edgeSwipe && g.x0 < 28 && g.dx > 12 && Math.abs(g.dy) < 40) return true;
        if (pullDown && g.dy > 14 && Math.abs(g.dx) < 30 && g.y0 < height * 0.35) return true;
        return false;
      },
      onPanResponderMove: (_, g) => {
        if (g.dx > 0 && g.x0 < 40) tx.setValue(Math.min(g.dx, width * 0.5));
        if (g.dy > 0) ty.setValue(Math.min(g.dy, height * 0.4));
      },
      onPanResponderRelease: (_, g) => {
        const shouldBack = (g.dx > 80 && g.x0 < 40) || g.dy > 100 || g.vy > 0.9;
        if (shouldBack) {
          Animated.timing(ty, { toValue: height, duration: 180, useNativeDriver: true }).start(goBack);
        } else {
          Animated.spring(ty, { toValue: 0, useNativeDriver: true }).start();
          Animated.spring(tx, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.flex,
        {
          transform: [{ translateY: ty }, { translateX: tx }],
          opacity: ty.interpolate({
            inputRange: [0, height * 0.35],
            outputRange: [1, 0.55],
            extrapolate: 'clamp',
          }),
        },
      ]}
      {...pan.panHandlers}
    >
      {edgeSwipe && <View style={styles.edge} />}
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  edge: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 24, zIndex: 20 },
});
