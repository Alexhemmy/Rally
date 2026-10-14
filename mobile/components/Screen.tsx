import { ReactNode } from 'react';
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

type Props = {
  children: ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  padded?: boolean;
};

/** Responsive safe-area screen shell (mobile-only chrome) */
export function Screen({
  children,
  scroll = true,
  refreshing = false,
  onRefresh,
  padded = true,
}: Props) {
  const { horizontalPad, contentMax, isTablet } = useLayout();

  const body = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.grow,
        padded && { paddingHorizontal: horizontalPad, paddingBottom: 32 },
        isTablet && { alignItems: 'center' },
      ]}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
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
