/** Parent view (mock 11) - preview of the guardian dashboard.
 * Honest scope: parent-account linking is not on the backend yet, so
 * this preview shows this device's data. Spent this month and the
 * monthly cap come from the real GET /api/limits; time today is
 * tracked locally. The privacy row reflects what the real product
 * will enforce: no message or follow access for guardians.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const TEAL = '#34D399';

const TIME_STEPS = [60, 90, 120];

function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

function minsLabel(m: number): string {
  return m >= 60 ? Math.floor(m / 60) + 'h ' + (m % 60) + 'm' : m + 'm';
}

export default function ParentDashboardScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();

  const [name, setName] = useState('Tola');
  const [age, setAge] = useState(16);
  const [minutes, setMinutes] = useState(0);
  const [spent, setSpent] = useState(0);
  const [monthlyCap, setMonthlyCap] = useState<number | null>(5000);
  const [timeLimit, setTimeLimit] = useState(90);
  const [safeMode, setSafeMode] = useState(true);

  const load = useCallback(async () => {
    try {
      const p = await AsyncStorage.getItem('rally.profile');
      if (p) {
        const prof = JSON.parse(p);
        if (prof.name) setName(prof.name);
        if (prof.age) setAge(prof.age);
      }
    } catch { /* defaults */ }
    try {
      const u = await AsyncStorage.getItem('rally.usageToday');
      if (u) {
        const rec = JSON.parse(u);
        const today = new Date().toDateString();
        if (rec.date === today) setMinutes(rec.minutes || 0);
      }
    } catch { /* fresh */ }
    try {
      const pp = await AsyncStorage.getItem('rally.parentPrefs');
      if (pp) {
        const prefs = JSON.parse(pp);
        if (prefs.timeLimitMin) setTimeLimit(prefs.timeLimitMin);
      }
      const sm = await AsyncStorage.getItem('rally.safeMode');
      if (sm) setSafeMode(JSON.parse(sm));
    } catch { /* defaults */ }
    if (!getToken()) return;
    try {
      const l = await api<any>('/api/limits');
      if (l.monthlySpendCap != null) setMonthlyCap(Number(l.monthlySpendCap));
      setSpent(Number(l.spentThisMonth || 0));
    } catch { /* offline */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  function cycleTimeLimit() {
    impact('light');
    const next = TIME_STEPS[(TIME_STEPS.indexOf(timeLimit) + 1) % TIME_STEPS.length];
    setTimeLimit(next);
    AsyncStorage.getItem('rally.parentPrefs')
      .then((raw) => {
        const prefs = raw ? JSON.parse(raw) : {};
        prefs.timeLimitMin = next;
        return AsyncStorage.setItem('rally.parentPrefs', JSON.stringify(prefs));
      })
      .catch(() => undefined);
  }

  const controls: { icon: string; label: string; value: string; onPress: () => void }[] = [
    { icon: 'time-outline', label: 'Daily time limit', value: minsLabel(timeLimit), onPress: cycleTimeLimit },
    { icon: 'card-outline', label: 'Monthly spending limit', value: monthlyCap == null ? 'No limit' : '₦' + fmt(monthlyCap), onPress: () => { impact('light'); router.push('/spending-limits'); } },
    { icon: 'navigate-outline', label: 'Who can message', value: safeMode ? 'Followers' : 'Everyone', onPress: () => { impact('light'); router.push('/safe-mode'); } },
    { icon: 'moon-outline', label: 'Quiet hours', value: '9pm to 7am', onPress: () => Alert.alert('Quiet hours', 'Quiet hours mute notifications from 9pm to 7am. The schedule is kept on this phone for now.') },
  ];

  const initials = name.slice(0, 2).toUpperCase();

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Parent view</Text>
          <View style={{ width: 26 }} />
        </View>

        <Text style={{ color: colors.muted, fontSize: 13, marginBottom: spacing.md }}>
          Preview with this device's data. Parent accounts are not linked yet.
        </Text>

        <View style={styles.teenRow}>
          <View style={[styles.avatar, { backgroundColor: GOLD }]}>
            <Text style={{ color: '#1A1206', fontWeight: '900', fontSize: 18 }}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 20 }}>{name + ', ' + age}</Text>
            <Text style={{ color: colors.muted, fontSize: 15 }}>{'Safe mode ' + (safeMode ? 'on' : 'off')}</Text>
          </View>
          <View style={[styles.protectedChip, { backgroundColor: TEAL + '1a' }]}>
            <Text style={{ color: TEAL, fontWeight: '900', fontSize: 12, letterSpacing: 0.5 }}>PROTECTED</Text>
          </View>
        </View>

        <View style={styles.statRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={{ color: colors.muted, fontSize: 15 }}>Time today</Text>
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 28, marginTop: 4 }}>{minsLabel(minutes)}</Text>
            <Text style={{ color: TEAL, fontWeight: '800', fontSize: 14, marginTop: 6 }}>{'Limit ' + minsLabel(timeLimit)}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={{ color: colors.muted, fontSize: 15 }}>Spent this month</Text>
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 28, marginTop: 4 }}>{'₦' + fmt(spent)}</Text>
            <Text style={{ color: TEAL, fontWeight: '800', fontSize: 14, marginTop: 6 }}>
              {'Limit ' + (monthlyCap == null ? 'none' : '₦' + fmt(monthlyCap))}
            </Text>
          </View>
        </View>

        <Text style={[styles.section, { color: colors.muted }]}>CONTROLS</Text>
        <View style={[styles.list, { borderColor: colors.border }]}>
          {controls.map((c, i) => (
            <Pressable
              key={c.label}
              onPress={c.onPress}
              style={[styles.cRow, i < controls.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              accessibilityLabel={c.label}
            >
              <View style={[styles.iconTile, { backgroundColor: colors.surfaceElevated || colors.bg }]}>
                <Ionicons name={c.icon as any} size={20} color={GOLD} />
              </View>
              <Text style={{ flex: 1, color: colors.text, fontWeight: '800', fontSize: 17 }}>{c.label}</Text>
              <Text style={{ color: colors.muted, fontSize: 16, fontWeight: '700' }}>{c.value}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          ))}
        </View>

        <View style={[styles.note, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="lock-closed-outline" size={20} color={TEAL} />
          <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 21, flex: 1, marginLeft: 12 }}>
            {'You can see time and spending. You cannot read messages or see who ' + name + ' follows.'}
          </Text>
        </View>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.sm },
  h1: { fontSize: 17, fontWeight: '900', flex: 1, textAlign: 'center' },
  teenRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: spacing.md },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  protectedChip: { borderRadius: radii.full, paddingHorizontal: 12, paddingVertical: 6 },
  statRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, borderWidth: 1, borderRadius: radii.lg, padding: 16 },
  section: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5, marginTop: spacing.lg, marginBottom: 8 },
  list: { borderWidth: 1, borderRadius: radii.lg },
  cRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, paddingHorizontal: 14 },
  iconTile: { width: 44, height: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  note: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radii.lg, padding: 16, marginTop: spacing.lg },
});
