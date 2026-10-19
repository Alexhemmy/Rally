import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { useTheme } from '@/components/ThemeProvider';
import { radii } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'ghost' | 'danger';
  style?: ViewStyle;
};

/** Premium CTA — sky-blue fill, soft glow shadow, haptic + sound feedback. */
export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  style,
}: Props) {
  const { colors } = useTheme();
  const { impact } = useHaptics();
  const { click } = useSounds();

  const bg =
    variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : colors.surface;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={() => {
        click();
        impact(variant === 'danger' ? 'error' : 'light');
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg },
        variant === 'ghost' && { borderWidth: 1, borderColor: colors.border },
        variant === 'primary' && styles.shadow,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.onPrimary : colors.primary} />
      ) : (
        <Text
          style={[
            styles.label,
            { color: variant === 'ghost' ? colors.text : colors.onPrimary },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  shadow: {
    shadowColor: '#0EA5E9',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  label: { fontWeight: '700', fontSize: 16, letterSpacing: 0.2 },
});
