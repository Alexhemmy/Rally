/** Rally premium UI kit — gradients, glass cards, pills, stats & more
 * Shared building blocks so every screen stays consistent, friendly & polished.
 */
import { ReactNode } from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  Image,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeProvider';
import { radii, type as typo, spacing, shadows } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';

/* ------------------------------------------------------------------ */
/*  GradientButton                                                     */
/* ------------------------------------------------------------------ */
type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'ghost' | 'danger' | 'outline';
  icon?: keyof typeof Ionicons.glyphMap;
  size?: 'md' | 'sm' | 'lg';
  fullWidth?: boolean;
  style?: ViewStyle;
};

export function GradientButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  icon,
  size = 'md',
  fullWidth = false,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const { impact } = useHaptics();

  const height = size === 'sm' ? 40 : size === 'lg' ? 56 : 50;
  const radius = size === 'sm' ? radii.md : radii.lg;
  const horizontalPad = size === 'sm' ? 14 : 20;
  const iconSize = size === 'sm' ? 15 : 18;

  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';
  const isDanger = variant === 'danger';
  const isOutline = variant === 'outline';

  const textColor = isPrimary || isDanger ? '#fff' : isGhost || isOutline ? colors.primary : colors.text;
  const iconColor = textColor;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={() => {
        impact('light');
        onPress();
      }}
      style={({ pressed }) => [
        styles.btn,
        {
          height,
          borderRadius: radius,
          paddingHorizontal: horizontalPad,
          alignSelf: fullWidth ? 'stretch' : 'auto',
        },
        isPrimary && styles.primaryShadow,
        isGhost && {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        },
        isOutline && {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.primary,
        },
        isDanger && { backgroundColor: colors.danger },
        (disabled || loading) && { opacity: 0.45 },
        pressed && !disabled && !loading && { transform: [{ scale: 0.975 }], opacity: 0.92 },
        style,
      ]}
    >
      {isPrimary && (
        <LinearGradient
          colors={[...colors.gradient] as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: radius }]}
        />
      )}

      {loading ? (
        <ActivityIndicator color={isPrimary || isDanger ? '#fff' : colors.primary} />
      ) : (
        <View style={styles.row}>
          {icon && (
            <Ionicons
              name={icon}
              size={iconSize}
              color={iconColor}
              style={{ marginRight: 7 }}
            />
          )}
          <Text
            style={[
              size === 'sm' ? typo.h3 : typo.button,
              { color: textColor },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/*  GlassCard                                                          */
/* ------------------------------------------------------------------ */
type GlassCardProps = {
  children: ReactNode;
  style?: ViewStyle;
  padded?: boolean;
  elevated?: boolean;
  onPress?: () => void;
};

export function GlassCard({
  children,
  style,
  padded = true,
  elevated = false,
  onPress,
}: GlassCardProps) {
  const { colors } = useTheme();

  const content = (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
        },
        elevated && shadows.md,
        padded && { padding: spacing.md },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

/* ------------------------------------------------------------------ */
/*  Avatar (gradient ring)                                             */
/* ------------------------------------------------------------------ */
type AvatarProps = {
  uri?: string | null;
  name?: string;
  size?: number;
  ring?: boolean;
};

export function Avatar({ uri, name = '?', size = 44, ring = true }: AvatarProps) {
  const { colors } = useTheme();
  const initials = (name || '?').trim().slice(0, 1).toUpperCase();
  const ringWidth = ring ? 2.5 : 0;
  const innerSize = size - ringWidth * 2;

  return (
    <View style={{ width: size, height: size, borderRadius: size / 2 }}>
      {ring && (
        <LinearGradient
          colors={[...colors.gradient] as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            StyleSheet.absoluteFillObject,
            { borderRadius: size / 2, padding: ringWidth },
          ]}
        >
          <View
            style={{
              flex: 1,
              borderRadius: innerSize / 2,
              backgroundColor: colors.surfaceElevated,
            }}
          />
        </LinearGradient>
      )}

      {uri ? (
        <Image
          source={{ uri }}
          style={{
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            position: 'absolute',
            top: ringWidth,
            left: ringWidth,
          }}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: size / 2,
              top: ringWidth,
              left: ringWidth,
              width: innerSize,
              height: innerSize,
            },
          ]}
        >
          <Text
            style={{
              color: colors.primary,
              fontWeight: '800',
              fontSize: size * 0.4,
            }}
          >
            {initials}
          </Text>
        </View>
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Chip / Pill                                                        */
/* ------------------------------------------------------------------ */
type ChipProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function Chip({ label, active = false, onPress, icon }: ChipProps) {
  const { colors } = useTheme();
  const { impact } = useHaptics();

  return (
    <Pressable
      onPress={() => {
        if (onPress) {
          impact('light');
          onPress();
        }
      }}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? 'transparent' : colors.surface,
          borderColor: active ? 'transparent' : colors.border,
        },
        pressed && onPress && { opacity: 0.85, transform: [{ scale: 0.97 }] },
      ]}
    >
      {active && (
        <LinearGradient
          colors={[...colors.gradient] as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: radii.full }]}
        />
      )}

      <View style={styles.row}>
        {icon && (
          <Ionicons
            name={icon}
            size={13}
            color={active ? '#fff' : colors.muted}
            style={{ marginRight: 5 }}
          />
        )}
        <Text
          style={{
            color: active ? '#fff' : colors.muted,
            fontWeight: '700',
            fontSize: 12,
            letterSpacing: 0.2,
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/*  StatTile                                                           */
/* ------------------------------------------------------------------ */
type StatTileProps = {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: 'primary' | 'success' | 'accent';
  style?: ViewStyle;
};

export function StatTile({
  label,
  value,
  icon,
  tone = 'primary',
  style,
}: StatTileProps) {
  const { colors } = useTheme();
  const tint =
    tone === 'success'
      ? colors.success
      : tone === 'accent'
      ? colors.accent
      : colors.primary;

  return (
    <View
      style={[
        styles.tile,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <View style={[styles.tileIcon, { backgroundColor: tint + '20' }]}>
        {icon && <Ionicons name={icon} size={15} color={tint} />}
      </View>
      <Text style={[typo.stat, { color: colors.text }]} numberOfLines={1}>
        {value}
      </Text>
      <Text
        style={[
          typo.micro,
          {
            color: colors.muted,
            textTransform: 'uppercase',
            letterSpacing: 0.6,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  EmptyState                                                         */
/* ------------------------------------------------------------------ */
type EmptyStateProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  body?: string;
  action?: ReactNode;
};

export function EmptyState({
  icon = 'sparkles',
  title,
  body,
  action,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.empty}>
      <LinearGradient
        colors={[...colors.gradient] as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.emptyIcon}
      >
        <Ionicons name={icon} size={26} color="#fff" />
      </LinearGradient>

      <Text style={[typo.h2, { color: colors.text, textAlign: 'center' }]}>
        {title}
      </Text>

      {body ? (
        <Text
          style={[
            typo.caption,
            {
              color: colors.muted,
              textAlign: 'center',
              marginTop: 6,
              lineHeight: 18,
            },
          ]}
        >
          {body}
        </Text>
      ) : null}

      {action && <View style={{ marginTop: spacing.md }}>{action}</View>}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  SectionHeader                                                      */
/* ------------------------------------------------------------------ */
type SectionHeaderProps = {
  title: string;
  action?: string;
  onAction?: () => void;
  style?: ViewStyle;
};

export function SectionHeader({
  title,
  action,
  onAction,
  style,
}: SectionHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.section, style]}>
      <Text style={[typo.h2, { color: colors.text }]}>{title}</Text>
      {action && onAction && (
        <Pressable onPress={onAction} hitSlop={12}>
          <Text
            style={{
              color: colors.primary,
              fontWeight: '700',
              fontSize: 13,
            }}
          >
            {action}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  primaryShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#7C5CFC',
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        elevation: 6,
      },
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.full,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tile: {
    flex: 1,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  tileIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
});
