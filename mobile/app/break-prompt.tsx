/** Break Prompt (mock 10) - modal.
 * Reminder nudge shown on the persisted break interval (Safe mode /
 * Spending limits). Take a break records the break and closes; Keep
 * watching just closes. The toggle persists whether reminders are on.
 */
import { useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { radii } from '@/constants/theme';

const GOLD = '#FFA726';
const TEAL = '#34D399';

export default function BreakPromptScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const [minutes, setMinutes] = useState(45);
  const [reminders, setReminders] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('rally.breakPrefs')
      .then((raw) => {
        if (raw) {
          const p = JSON.parse(raw);
          if (p.intervalMin) setMinutes(p.intervalMin);
          setReminders(p.reminders !== false);
        }
      })
      .catch(() => undefined);
  }, []);

  function persistReminders(v: boolean) {
    AsyncStorage.getItem('rally.breakPrefs')
      .then((raw) => {
        const p = raw ? JSON.parse(raw) : {};
        p.reminders = v;
        return AsyncStorage.setItem('rally.breakPrefs', JSON.stringify(p));
      })
      .catch(() => undefined);
  }

  function takeBreak() {
    impact('success');
    AsyncStorage.setItem('rally.lastBreakAt', JSON.stringify(Date.now())).catch(() => undefined);
    router.back();
  }

  return (
    <View style={[styles.fill, { backgroundColor: 'rgba(6,8,14,0.92)' }]}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.moonTile, { backgroundColor: '#312E81' }]}>
          <Ionicons name="moon-outline" size={32} color="#A5B4FC" />
        </View>
        <Text style={{ color: colors.text, fontWeight: '900', fontSize: 26, textAlign: 'center', marginTop: 18 }}>
          Time for a breather?
        </Text>
        <Text style={{ color: colors.muted, fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 10 }}>
          {'You have been on Rally for ' + minutes + ' minutes. Everything will be right here when you get back.'}
        </Text>

        <LinearGradient colors={[GOLD, '#FF8A3D']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.primaryBtn}>
          <Pressable onPress={takeBreak} style={styles.btnInner} accessibilityLabel="Take a break">
            <Text style={{ color: '#1A1206', fontWeight: '900', fontSize: 17 }}>Take a break</Text>
          </Pressable>
        </LinearGradient>

        <Pressable
          onPress={() => { impact('light'); router.back(); }}
          style={[styles.secondaryBtn, { backgroundColor: colors.surfaceElevated || colors.bg }]}
          accessibilityLabel="Keep watching"
        >
          <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 }}>Keep watching</Text>
        </Pressable>

        <View style={styles.remindRow}>
          <Text style={{ color: colors.muted, fontWeight: '700', fontSize: 15 }}>
            {'Remind me every ' + minutes + ' minutes'}
          </Text>
          <Switch
            value={reminders}
            onValueChange={(v) => { impact('light'); setReminders(v); persistReminders(v); }}
            trackColor={{ true: TEAL, false: colors.border }}
            thumbColor="#fff"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'center', padding: 24 },
  card: { width: '100%', borderWidth: 1, borderRadius: 28, padding: 24 },
  moonTile: { width: 76, height: 76, borderRadius: 22, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  primaryBtn: { borderRadius: radii.full, marginTop: 24 },
  btnInner: { width: '100%', alignItems: 'center', paddingVertical: 18, borderRadius: radii.full },
  secondaryBtn: { borderRadius: radii.full, paddingVertical: 18, alignItems: 'center', marginTop: 12 },
  remindRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 },
});
