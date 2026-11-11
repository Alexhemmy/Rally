/** Safe Mode Settings (mock 07)
 * Safe mode banner (real state), locked-by-age rows that explain why
 * when tapped, and live links: Spending limit opens the real limits
 * screen, Break reminders cycles a persisted interval. Messages from
 * strangers mirrors Safe mode; sensitive content is strictest for
 * minors and says so.
 */
import { useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';

const GOLD = '#FFA726';
const TEAL = '#34D399';

const BREAK_STEPS = [15, 30, 60];

export default function SafeModeSettingsScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();
  const router = useRouter();

  const [safeMode, setSafeMode] = useState(true);
  const [breakMin, setBreakMin] = useState(30);

  useEffect(() => {
    AsyncStorage.multiGet(['rally.safeMode', 'rally.breakPrefs'])
      .then((v: [string, string | null][]) => {
        if (v[0] && v[0][1]) setSafeMode(JSON.parse(v[0][1]));
        if (v[1] && v[1][1]) {
          try { const p = JSON.parse(v[1][1]); if (p.intervalMin) setBreakMin(p.intervalMin); } catch { /* keep */ }
        }
      })
      .catch(() => undefined);
  }, []);

  function why(title: string, body: string) {
    impact('light');
    Alert.alert(title, body);
  }

  function cycleBreak() {
    impact('light');
    const next = BREAK_STEPS[(BREAK_STEPS.indexOf(breakMin) + 1) % BREAK_STEPS.length];
    setBreakMin(next);
    AsyncStorage.setItem('rally.breakPrefs', JSON.stringify({ reminders: true, intervalMin: next })).catch(() => undefined);
  }

  const rows: { icon: string; label: string; value: string; onPress: () => void; dim: boolean }[] = [
    {
      icon: 'navigate-outline', label: 'Messages from strangers', value: safeMode ? 'Off' : 'On',
      dim: safeMode,
      onPress: () => why('Messages from strangers', safeMode ? 'Safe mode keeps messages to people you follow. It turns off automatically on your 18th birthday.' : 'Safe mode is off, so anyone can message you. Turn Safe mode on in Your protections.'),
    },
    {
      icon: 'flame', label: 'Rivalry and Call-Outs', value: 'Unlocks at 18', dim: true,
      onPress: () => why('Rivalry and Call-Outs', 'These unlock at 18. They are competitive features, so minors stay out of them.'),
    },
    {
      icon: 'library-outline', label: 'Cash gifting and payouts', value: 'Unlocks at 18', dim: true,
      onPress: () => why('Cash gifting and payouts', 'These unlock at 18. Junior Favorites 16-17 can apply for Favorite status with guardian consent, but never payouts.'),
    },
    {
      icon: 'card-outline', label: 'Spending limit', value: 'Set by parent', dim: false,
      onPress: () => { impact('light'); router.push('/spending-limits'); },
    },
    {
      icon: 'time-outline', label: 'Break reminders', value: 'Every ' + breakMin + ' min', dim: false,
      onPress: cycleBreak,
    },
    {
      icon: 'eye-outline', label: 'Sensitive content', value: 'Strictest', dim: false,
      onPress: () => why('Sensitive content', 'Strictest is the default for fans under 18. It can only be relaxed at 18.'),
    },
  ];

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Safe mode</Text>
          <View style={{ width: 26 }} />
        </View>

        <View style={[styles.banner, { backgroundColor: safeMode ? TEAL + '14' : colors.surface, borderColor: safeMode ? TEAL : colors.border }]}>
          <View style={[styles.bannerIcon, { backgroundColor: safeMode ? TEAL : colors.border }]}>
            <Ionicons name={safeMode ? 'shield-checkmark' : 'shield-outline'} size={22} color={safeMode ? '#0B3B2E' : colors.muted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 18 }}>
              {safeMode ? 'Safe mode is on' : 'Safe mode is off'}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 14, marginTop: 2 }}>Turns off on your 18th birthday</Text>
          </View>
        </View>

        {rows.map((r, i) => (
          <Pressable
            key={r.label}
            onPress={r.onPress}
            style={[styles.row, i < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            accessibilityLabel={r.label}
          >
            <View style={[styles.iconTile, { backgroundColor: colors.surfaceElevated || colors.bg }]}>
              <Ionicons name={r.icon as any} size={20} color={GOLD} />
            </View>
            <Text style={[styles.rowLabel, { color: r.dim ? colors.muted : colors.text }]}>{r.label}</Text>
            <Text style={{ color: colors.muted, fontSize: 16, fontWeight: '700' }}>{r.value}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        ))}

        <View style={[styles.note, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="help-circle-outline" size={20} color={TEAL} />
          <Text style={{ color: colors.muted, fontSize: 16, lineHeight: 23, flex: 1, marginLeft: 12 }}>
            Locked items are controlled by your parent or by your age. Tap one to see why.
          </Text>
        </View>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  h1: { fontSize: 17, fontWeight: '900', flex: 1, textAlign: 'center' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1.5, borderRadius: radii.lg, padding: 16 },
  bannerIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16 },
  iconTile: { width: 44, height: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 17, fontWeight: '800' },
  note: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radii.lg, padding: 16, marginTop: spacing.lg },
});
