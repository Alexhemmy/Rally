/** Rally premium UI kit — gradients, glass cards, pills, stats.
 * Shared building blocks so every screen can look consistent.
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeProvider';
import { radii, type as typo } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';

/* ---------------- GradientButton ---------------- */
type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'ghost' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
  size?: 'md' | 'sm';
  style?: ViewStyle;
};

export function GradientButton({
  label, onPress, disabled, loading,
  variant = 'primary', icon, size = 'md', style,
}: ButtonProps) {
  const { colors } = useTheme();
  const { impact } = useHaptics();
  const h = size === 'sm' ? 40 : 52;

  const inner = (
    <>
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? colors.primary : '#fff'} />
      ) : (
        <View style={styles.row}>
          {icon && (
            <Ionicons
              name={icon}
              size={size === 'sm' ? 15 : 18}
              color={variant === 'ghost' ? colors.primary : '#fff'}
              style={{ marginRight: 7 }}
            />
          )}
          <Text
            style={[
              size === 'sm' ? typo.h3 : { fontSize: 16, fontWeight: '700' as const, letterSpacing: 0.2 },
              { color: variant === 'ghost' ? colors.text : '#fff' },
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </>
  );

  const press = ({ pressed }: { pressed: boolean }) => [
    styles.btn,
    {
      height: h,
      borderRadius: size === 'sm' ? radii.md : radii.lg,
      paddingHorizontal: size === 'sm' ? 14 : 20,
    },
    variant === 'primary' && styles.primaryShadow,
    variant === 'ghost' && { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    variant === 'danger' && { backgroundColor: colors.danger },
    (disabled || loading) && { opacity: 0.45 },
    pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
    style,
  ] as any;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={() => {
        impact('light');
        onPress();
      }}
      style={press}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={[...colors.gradient] as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: size === 'sm' ? radii.md : radii.lg }]}
        />
      ) : null}
      {inner}
    </Pressable>
  );
}

/* ---------------- GlassCard ---------------- */
export function GlassCard({ children, style, padded = true }: { children: ReactNode; style?: ViewStyle; padded?: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: colors.border,
        },
        padded && { padding: 16 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/* ---------------- Avatar (gradient ring) ---------------- */
export function Avatar({ uri, name = '?', size = 44, ring = true }: { uri?: string | null; name?: string; size?: number; ring?: boolean }) {
  const { colors } = useTheme();
  const initials = (name || '?').trim().slice(0, 1).toUpperCase();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
      {ring && (
        <LinearGradient
          colors={[...colors.gradient] as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: size / 2, padding: 2 }]}
        >
          <View style={{ flex: 1, borderRadius: (size - 4) / 2, margin: 2, overflow: 'hidden', backgroundColor: colors.surfaceElevated }} />
        </LinearGradient>
      )}
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size - (ring ? 4 : 0), height: size - (ring ? 4 : 0), borderRadius: (size - (ring ? 4 : 0)) / 2, position: 'absolute', top: ring ? 2 : 0, left: ring ? 2 : 0 }}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', borderRadius: size / 2 }]}>
          <Text style={{ color: colors.primary, fontWeight: '800', fontSize: size * 0.42 }}>{initials}</Text>
        </View>
      )}
    </View>
  );
}

/* ---------------- Chip / pill ---------------- */
export function Chip({ label, active, onPress, icon }: { label: string; active?: boolean; onPress?: () => void; icon?: keyof typeof Ionicons.glyphMap }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? colors.primary : colors.surface,
          borderColor: active ? 'transparent' : colors.border,
        },
        pressed && { opacity: 0.8 },
      ]}
    >
      {active ? (
        <LinearGradient
          colors={[...colors.gradient] as any}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radii.full }]}
        />
      ) : null}
      <View style={styles.row}>
        {icon && <Ionicons name={icon} size={13} color={active ? '#fff' : colors.muted} style={{ marginRight: 5 }} />}
        <Text style={{ color: active ? '#fff' : colors.muted, fontWeight: '700', fontSize: 12 }}>{label}</Text>
      </View>
    </Pressable>
  );
}

/* ---------------- StatTile (wallet/dashboard) ---------------- */
export function StatTile({ label, value, icon, tone = 'primary' }: { label: string; value: string; icon?: keyof typeof Ionicons.glyphMap; tone?: 'primary' | 'success' | 'accent' }) {
  const { colors } = useTheme();
  const tint = tone === 'success' ? colors.success : tone === 'accent' ? colors.accent : colors.primary;
  return (
    <View style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.tileIcon, { backgroundColor: tint + '22' }]}>
        {icon && <Ionicons name={icon} size={15} color={tint} />}
      </View>
      <Text style={[typo.stat, { color: colors.text }]}>{value}</Text>
      <Text style={[typo.micro, { color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6 }]}>{label}</Text>
    </View>
  );
}

/* ---------------- EmptyState ---------------- */
export function EmptyState({ icon = 'sparkles', title, body }: { icon?: keyof typeof Ionicons.glyphMap; title: string; body?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <LinearGradient
        colors={[...colors.gradient] as any}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.emptyIcon]}
      >
        <Ionicons name={icon} size={26} color="#fff" />
      </LinearGradient>
      <Text style={[typo.h2, { color: colors.text, textAlign: 'center' }]}>{title}</Text>
      {body ? <Text style={[typo.caption, { color: colors.muted, textAlign: 'center', marginTop: 6 }]}>{body}</Text> : null}
    </View>
  );
}

/* ---------------- SectionHeader ---------------- */
export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[typo.h2, { color: colors.text }]}>{title}</Text>
      {action && (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 13 }}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  primaryShadow: {
    shadowColor: '#7C5CFC',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radii.full, borderWidth: 1, overflow: 'hidden' },
  tile: { flex: 1, borderRadius: radii.lg, borderWidth: 1, padding: 14, gap: 6 },
  tileIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 48, paddingHorizontal: 24 },
  emptyIcon: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
});
