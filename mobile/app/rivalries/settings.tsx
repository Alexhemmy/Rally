/** Rivalry Settings (mock 01)
 * Take part toggle, heat preference, alerts, feed visibility and
 * fandom mutes. Show in feed drives the real feed filter
 * (rally.feedPrefs.hideRivalry); the rest persists on this device and
 * says honestly what arrives with a backend.
 */
import { useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { spacing, radii } from '@/constants/theme';

const GOLD = '#FFA726';
const TEAL = '#34D399';

const HEATS = [
  { key: 'friendly', label: 'Friendly', sub: 'Light banter' },
  { key: 'spicy', label: 'Spicy', sub: 'Cheeky jabs' },
  { key: 'fierce', label: 'Fierce', sub: 'Full contest' },
];

export default function RivalrySettingsScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();
  const { click } = useSounds();
  const router = useRouter();

  const [participate, setParticipate] = useState(true);
  const [heat, setHeat] = useState('friendly');
  const [alerts, setAlerts] = useState(false);
  const [inFeed, setInFeed] = useState(true);
  const [mutedFandom, setMutedFandom] = useState('None');

  useEffect(() => {
    AsyncStorage.multiGet(['rally.rivalryParticipate', 'rally.rivalryHeat', 'rally.rivalryAlerts', 'rally.feedPrefs', 'rally.rivalryMutedFandom'])
      .then((v: [string, string | null][]) => {
        if (v[0] && v[0][1]) setParticipate(v[0][1] === '1');
        if (v[1] && v[1][1]) setHeat(v[1][1]);
        if (v[2] && v[2][1]) setAlerts(v[2][1] === '1');
        if (v[3] && v[3][1]) {
          try { setInFeed(!(JSON.parse(v[3][1]).hideRivalry)); } catch { /* keep */ }
        }
        if (v[4] && v[4][1]) setMutedFandom(v[4][1]);
      })
      .catch(() => {});
  }, []);

  async function saveParticipate(v: boolean) {
    setParticipate(v);
    impact('medium');
    await AsyncStorage.multiSet([['rally.rivalryParticipate', v ? '1' : '0']]).catch(() => {});
  }

  async function setFeed(v: boolean) {
    setInFeed(v);
    impact('light');
    click();
    let prefs: any = {};
    try { prefs = JSON.parse((await AsyncStorage.getItem('rally.feedPrefs')) || '{}'); } catch { /* keep */ }
    prefs.hideRivalry = !v;
    await AsyncStorage.setItem('rally.feedPrefs', JSON.stringify(prefs)).catch(() => {});
  }

  async function pickHeat(k: string) {
    setHeat(k);
    impact('light');
    await AsyncStorage.setItem('rally.rivalryHeat', k).catch(() => {});
  }

  async function saveAlerts(v: boolean) {
    setAlerts(v);
    impact('light');
    await AsyncStorage.setItem('rally.rivalryAlerts', v ? '1' : '0').catch(() => {});
  }

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel={'Back'}>
            <Ionicons name={'chevron-back'} size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Rivalry</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <View style={[styles.iconTile, { backgroundColor: colors.surfaceElevated || colors.bg }]}>
              <Ionicons name={'flame'} size={20} color={GOLD} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Take part in Rivalry</Text>
            <Switch value={participate} onValueChange={saveParticipate} trackColor={{ false: colors.border, true: TEAL }} thumbColor={'#fff'} />
          </View>

          {participate ? (
            <>
              <Text style={[styles.label, { color: colors.muted }]}>How heated?</Text>
              <View style={styles.heatRow}>
                {HEATS.map((h) => {
                  const on = heat === h.key;
                  return (
                    <Pressable key={h.key} onPress={() => pickHeat(h.key)} style={[styles.heatCard, { borderColor: on ? GOLD : colors.border, backgroundColor: on ? GOLD + '14' : colors.surface }]}>
                      <Text style={{ color: on ? GOLD : colors.text, fontWeight: '900', fontSize: 17 }}>{h.label}</Text>
                      <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>{h.sub}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}

          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <View style={[styles.iconTile, { backgroundColor: colors.surfaceElevated || colors.bg }]}>
              <Ionicons name={'notifications-outline'} size={20} color={GOLD} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Rivalry alerts</Text>
            <Switch value={alerts} onValueChange={saveAlerts} trackColor={{ false: colors.border, true: TEAL }} thumbColor={'#fff'} />
          </View>

          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <View style={[styles.iconTile, { backgroundColor: colors.surfaceElevated || colors.bg }]}>
              <Ionicons name={'eye-outline'} size={20} color={GOLD} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Show Rivalry in my feed</Text>
            <Switch value={inFeed} onValueChange={setFeed} trackColor={{ false: colors.border, true: TEAL }} thumbColor={'#fff'} />
          </View>

          <Pressable
            style={[styles.row, { borderBottomColor: colors.border }]}
            onPress={() => {
              impact('light');
              router.push('/blocked-muted');
            }}
          >
            <View style={[styles.iconTile, { backgroundColor: colors.surfaceElevated || colors.bg }]}>
              <Ionicons name={'ban-outline'} size={20} color={GOLD} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Mute a fandom</Text>
            <Text style={{ color: colors.muted, fontSize: 16, fontWeight: '600' }}>{mutedFandom}</Text>
            <Ionicons name={'chevron-forward'} size={18} color={colors.muted} />
          </Pressable>

          <View style={[styles.note, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name={'shield-checkmark-outline'} size={18} color={TEAL} />
            <Text style={[styles.noteText, { color: colors.muted }]}>
              Turn Rivalry off any time and it disappears from your feed. Under 18s cannot take part.
            </Text>
          </View>
          <Text style={[styles.honest, { color: colors.muted }]}>
            Rivalry alerts arrive with the notifications backend. Heat and participation are saved on this device for now.
          </Text>
        </ScrollView>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  h1: { fontSize: 20, fontWeight: '900' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, borderBottomWidth: 1 },
  iconTile: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 17, fontWeight: '800' },
  label: { fontSize: 15, fontWeight: '800', marginTop: spacing.md, marginBottom: 10 },
  heatRow: { flexDirection: 'row', gap: 10 },
  heatCard: { flex: 1, borderWidth: 1.5, borderRadius: radii.lg, padding: 14, alignItems: 'center' },
  note: { flexDirection: 'row', gap: 10, alignItems: 'center', borderWidth: 1, borderRadius: radii.md, padding: 14, marginTop: spacing.lg },
  noteText: { flex: 1, fontSize: 14, lineHeight: 20 },
  honest: { fontSize: 12, lineHeight: 18, marginTop: spacing.md },
});
