/** Notification Settings (UX 45) - Rally design
 * Push / Email / In-app matrix for fan and Favorite events, plus
 * quiet hours. No notification-preferences backend yet, so choices
 * are saved on this device - the note says so.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#FFA726';
const TEAL = '#34D399';
const KEY = 'rally.notificationPrefs';

type Channels = { push: boolean; email: boolean; inapp: boolean };
type Prefs = Record<string, Channels>;

const FAN_ROWS = ['Posts and Moments', 'Replies', 'Badges', 'Subscriptions', 'Campaign progress', 'Giveaway results'];
const FAVORITE_ROWS = ['Gifts', 'New subscribers', 'Flagged content', 'Beef Radar changes'];
const DEFAULTS: Channels = { push: true, email: false, inapp: true };

export default function NotificationSettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();

  const [prefs, setPrefs] = useState<Prefs>({});
  const [quiet, setQuiet] = useState(true);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setPrefs(parsed.prefs || {});
        setQuiet(parsed.quietHours !== false);
      }
    } catch { /* local only */ }
    setLoaded(true);
  }, []);

  useEffect(() => { load(); }, [load]);

  function persist(next: Prefs, nextQuiet: boolean) {
    AsyncStorage.setItem(KEY, JSON.stringify({ prefs: next, quietHours: nextQuiet })).catch(() => undefined);
  }

  function channelFor(row: string): Channels {
    return prefs[row] || { ...DEFAULTS };
  }

  function toggle(row: string, ch: keyof Channels) {
    impact('light');
    const next: Prefs = { ...prefs, [row]: { ...channelFor(row), [ch]: !channelFor(row)[ch] } };
    setPrefs(next);
    persist(next, quiet);
  }

  function toggleQuiet() {
    impact('light');
    setQuiet((v) => {
      persist(prefs, !v);
      return !v;
    });
  }

  function box(on: boolean, ch: keyof Channels, row: string) {
    return (
      <Pressable onPress={() => toggle(row, ch)} hitSlop={8} accessibilityLabel={row + ' ' + ch}>
        <View style={[styles.box, on ? { backgroundColor: GOLD, borderColor: GOLD } : { backgroundColor: 'transparent', borderColor: colors.border }]}>
          {on ? <Ionicons name="checkmark" size={16} color="#111" /> : null}
        </View>
      </Pressable>
    );
  }

  function section(label: string, rows: string[]) {
    return (
      <View>
        <Text style={[styles.section, { color: colors.muted }]}>{label}</Text>
        {rows.map((row, i) => (
          <View
            key={row}
            style={[styles.row, i < rows.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
          >
            <Text style={[styles.rowLabel, { color: colors.text }]}>{row}</Text>
            {box(channelFor(row).push, 'push', row)}
            {box(channelFor(row).email, 'email', row)}
            {box(channelFor(row).inapp, 'inapp', row)}
          </View>
        ))}
      </View>
    );
  }

  return (
    <SwipeBack>
      <Screen>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Notifications</Text>
          <View style={{ width: 26 }} />
        </View>

        {loaded ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Column headers */}
            <View style={styles.colHead}>
              <View style={{ flex: 1 }} />
              <Text style={[styles.colLabel, { color: colors.muted }]}>PUSH</Text>
              <Text style={[styles.colLabel, { color: colors.muted }]}>EMAIL</Text>
              <Text style={[styles.colLabel, { color: colors.muted }]}>IN-APP</Text>
            </View>

            {section('AS A FAN', FAN_ROWS)}
            {section('AS A FAVORITE', FAVORITE_ROWS)}

            {/* Quiet hours */}
            <View style={[styles.quietCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <View style={[styles.quietIcon, { backgroundColor: GOLD + '22' }]}>
                <Ionicons name="moon-outline" size={20} color={GOLD} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16 }}>Quiet hours</Text>
                <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2, lineHeight: 18 }}>
                  22:00 to 07:00 · Favorite alerts only wait
                </Text>
              </View>
              <Pressable
                onPress={toggleQuiet}
                style={[styles.quietSwitch, quiet ? { backgroundColor: TEAL } : { backgroundColor: colors.border }]}
                accessibilityLabel="Toggle quiet hours"
              >
                <View style={[styles.quietThumb, quiet ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]} />
              </Pressable>
            </View>

            <Text style={[styles.hint, { color: colors.muted }]}>
              Saved on this device for now — push and email sync arrive with the notifications backend.
            </Text>
          </ScrollView>
        ) : null}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.sm },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  colHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  colLabel: { width: 62, fontSize: 11, fontWeight: '900', letterSpacing: 1, textAlign: 'center' },
  section: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginTop: spacing.md, marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  rowLabel: { flex: 1, fontSize: 16, fontWeight: '700' },
  box: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  quietCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 16,
    marginTop: spacing.lg,
  },
  quietIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  quietSwitch: { width: 54, height: 32, borderRadius: 16, padding: 2 },
  quietThumb: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff' },
  hint: { fontSize: 12, lineHeight: 18, marginTop: spacing.md },
});
