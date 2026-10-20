/** Screen
 * Themed safe-area wrapper with optional scroll, pull-to-refresh,
 * keyboard avoidance, and haptic feedback on refresh complete.
 * Fully responsive and tablet-aware.
 */
import { ReactNode, useCallback, useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLayout } from '@/constants/theme';
import { useTheme } from '@/components/ThemeProvider';
import { OfflineBanner } from './OfflineBanner';
import { useHaptics } from '@/hooks/useHaptics';

type ScreenProps = {
  children: ReactNode;
  /** Enable scrolling (default: true) */
  scroll?: boolean;
  /** Controlled refreshing state */
  refreshing?: boolean;
  /** Called when the user pulls to refresh */
  onRefresh?: () => void | Promise<void>;
  /** Apply horizontal padding (default: true) */
  padded?: boolean;
  /** Show pull-to-refresh even without onRefresh (default: true) */
  enableRefresh?: boolean;
  /** Extra style for the content container */
  contentStyle?: ViewStyle;
  /** Edges for SafeAreaView (default: left + right) */
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
};

export function Screen({
  children,
  scroll = true,
  refreshing: controlledRefreshing,
  onRefresh,
  padded = true,
  enableRefresh = true,
  contentStyle,
  edges = ['left', 'right'],
}: ScreenProps) {
  const { horizontalPad, contentMax, isTablet } = useLayout();
  const { colors } = useTheme();
  const { refreshComplete } = useHaptics();

  const [internalRefreshing, setInternalRefreshing] = useState(false);
  const refreshing = controlledRefreshing ?? internalRefreshing;

  const handleRefresh = useCallback(async () => {
    if (!onRefresh && !enableRefresh) return;

    if (controlledRefreshing === undefined) {
      setInternalRefreshing(true);
    }

    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        // Minimal delay so the spinner feels intentional
        await new Promise((resolve) => setTimeout(resolve, 450));
      }
    } finally {
      if (controlledRefreshing === undefined) {
        setInternalRefreshing(false);
      }
      refreshComplete();
    }
  }, [onRefresh, enableRefresh, controlledRefreshing, refreshComplete]);

  const showRefresh = enableRefresh || !!onRefresh;

  const content = (
    <View
      style={[
        isTablet && { width: '100%', maxWidth: contentMax },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  const body = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.grow,
        padded && {
          paddingHorizontal: horizontalPad,
          paddingBottom: 36,
        },
        isTablet && { alignItems: 'center' },
      ]}
      refreshControl={
        showRefresh ? (
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        ) : undefined
      }
    >
      {content}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.flex,
        padded && { paddingHorizontal: horizontalPad },
      ]}
    >
      {content}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.bg }]}
      edges={edges}
    >
      <OfflineBanner />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        {body}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  grow: {
    flexGrow: 1,
  },
});
