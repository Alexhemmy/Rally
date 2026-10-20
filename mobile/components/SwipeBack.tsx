/** SwipeBack
 * Smooth pull-down or left-edge swipe to go back.
 * Feels native, has proper thresholds, and plays a subtle whoosh.
 */
import { ReactNode, useRef } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSounds } from '@/hooks/useSounds';

type Props = {
  children: ReactNode;
  /** Enable vertical pull-down to go back (default: true) */
  pullDown?: boolean;
  /** Enable left-edge swipe to go back (default: true) */
  edgeSwipe?: boolean;
};

export function SwipeBack({
  children,
  pullDown = true,
  edgeSwipe = true,
}: Props) {
  const router = useRouter();
  const { whoosh } = useSounds();
  const { height, width } = useWindowDimensions();

  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  const goBack = () => {
    whoosh();
    if (router.canGoBack()) {
      router.back();
    }
  };

  const reset = () => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }),
    ]).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        // Left-edge horizontal swipe
        if (
          edgeSwipe &&
          gesture.x0 < 28 &&
          gesture.dx > 10 &&
          Math.abs(gesture.dy) < 35
        ) {
          return true;
        }

        // Pull-down from the upper portion of the screen
        if (
          pullDown &&
          gesture.dy > 12 &&
          Math.abs(gesture.dx) < 28 &&
          gesture.y0 < height * 0.38
        ) {
          return true;
        }

        return false;
      },

      onPanResponderMove: (_, gesture) => {
        // Horizontal edge swipe
        if (edgeSwipe && gesture.x0 < 40 && gesture.dx > 0) {
          translateX.setValue(Math.min(gesture.dx, width * 0.45));
        }

        // Vertical pull-down
        if (pullDown && gesture.dy > 0) {
          translateY.setValue(Math.min(gesture.dy, height * 0.42));
        }
      },

      onPanResponderRelease: (_, gesture) => {
        const shouldGoBack =
          (edgeSwipe && gesture.dx > 90 && gesture.x0 < 40) ||
          (pullDown && (gesture.dy > 110 || gesture.vy > 1.1));

        if (shouldGoBack) {
          // Animate out then navigate
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: height,
              duration: 220,
              useNativeDriver: true,
            }),
            Animated.timing(translateX, {
              toValue: width * 0.6,
              duration: 220,
              useNativeDriver: true,
            }),
          ]).start(goBack);
        } else {
          reset();
        }
      },

      onPanResponderTerminate: reset,
    }),
  ).current;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY },
            { translateX },
          ],
          opacity: translateY.interpolate({
            inputRange: [0, height * 0.32],
            outputRange: [1, 0.6],
            extrapolate: 'clamp',
          }),
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Invisible left edge zone for easier swipe detection */}
      {edgeSwipe && <View style={styles.edgeZone} pointerEvents="none" />}

      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  edgeZone: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 28,
    zIndex: 30,
  },
});
