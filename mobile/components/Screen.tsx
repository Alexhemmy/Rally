import { ReactNode, useCallback, useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, useLayout } from '@/constants/theme';
import { OfflineBanner } from './OfflineBanner';
import { useHaptics } from '@/hooks/useHaptics';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void | Promise<void>;
  padded?: boolean;
  /** Enable pull-to-refresh even if parent only wants default haptic refresh */
  enableRefresh?: boolean;
};

/** Responsive safe-area screen with pull-to-refresh + haptic on complete */
export function Screen({
  children,
  scroll = true,
  refreshing: controlledRefreshing,
  onRefresh,
  padded = true,
  enableRefresh = true,
}: Props) {
  const { horizontalPad, contentMax, isTablet } = useLayout();
  const { refreshComplete } = useHaptics();
  const [internalRefreshing, setInternalRefreshing] = useState(false);

  const refreshing = controlledRefreshing ?? internalRefreshing;

  const handleRefresh = useCallback(async () => {
    if (!onRefresh && !enableRefresh) return;
    if (controlledRefreshing === undefined) setInternalRefreshing(true);
    try {
      if (onRefresh) await onRefresh();
      else await new Promise((r) => setTimeout(r, 500));
    } finally {
      if (controlledRefreshing === undefined) setInternalRefreshing(false);
      refreshComplete();
    }
  }, [onRefresh, enableRefresh, controlledRefreshing, refreshComplete]);

  const showRefresh = enableRefresh || !!onRefresh;

  const body = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.grow,
        padded && { paddingHorizontal: horizontalPad, paddingBottom: 32 },
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
      <View style={isTablet ? { width: '100%', maxWidth: contentMax } : undefined}>
        {children}
      </View>
    </ScrollView>
  ) : (
    <View style={[styles.flex, padded && { paddingHorizontal: horizontalPad }]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <OfflineBanner />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {body}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  grow: { flexGrow: 1 },
});
