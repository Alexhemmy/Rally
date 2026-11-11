/** BreakPrompt - Rally design (screen 53)
 * A centered card after 45 minutes. Take a break closes the app view,
 * Keep watching dismisses it, and a toggle controls the 45-minute reminder.
 */
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/components/ThemeProvider';
import { radii } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';

const GOLD = '#FFA726';
const INTERVAL_MINUTES = 45;

type BreakListener = () => void;
let breakListener: BreakListener | null = null;

/** Ask the global BreakPrompt (mounted in the tabs layout) to show. */
export function requestBreakPrompt() {
  if (breakListener) breakListener();
}

export function BreakPrompt() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const [visible, setVisible] = useState(false);
  const [remindersOn, setRemindersOn] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('rally.breakPrefs')
      .then((v) => {
        if (v) {
          const p = JSON.parse(v);
          setRemindersOn(p.reminders !== false);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    breakListener = () => setVisible(true);
    return () => { breakListener = null; };
  }, []);

  useEffect(() => {
    if (!remindersOn || visible) return;
    const timer = setTimeout(() => setVisible(true), INTERVAL_MINUTES * 60 * 1000);
    return () => clearTimeout(timer);
  }, [remindersOn, visible]);

  function keepWatching() {
    impact('light');
    setVisible(false);
  }

  function takeBreak() {
    impact('medium');
    setVisible(false);
    router.push('/' as any);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={keepWatching}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.iconWrap}>
            <Ionicons name="moon" size={30} color="#A78BFA" />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Time for a breather?</Text>
          <Text style={[styles.body, { color: colors.muted }]}>
            {'You have been on Rally for ' + INTERVAL_MINUTES + ' minutes. Everything will be right here when you get back.'}
          </Text>
          <Pressable style={styles.primaryBtn} onPress={takeBreak} accessibilityLabel="Take a break">
            <Text style={styles.primaryText}>Take a break</Text>
          </Pressable>
          <Pressable
            style={[styles.secondaryBtn, { backgroundColor: isDark ? '#1C1C28' : '#EDEDF2' }]}
            onPress={keepWatching}
            accessibilityLabel="Keep watching"
          >
            <Text style={[styles.secondaryText, { color: colors.text }]}>Keep watching</Text>
          </Pressable>
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: colors.muted }]}>
              {'Remind me every ' + INTERVAL_MINUTES + ' minutes'}
            </Text>
            <Switch
              value={remindersOn}
              onValueChange={(v) => { impact('light'); setRemindersOn(v); }}
              trackColor={{ false: '#3A3A4A', true: '#34D399' }}
              thumbColor="#fff"
              accessibilityLabel="Break reminders"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  card: { borderRadius: radii.lg, padding: 22, width: '100%', alignItems: 'center' },
  iconWrap: { width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(124,77,255,0.22)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 19, fontWeight: '900', marginBottom: 8 },
  body: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 18 },
  primaryBtn: { backgroundColor: GOLD, borderRadius: radii.full, paddingVertical: 13, paddingHorizontal: 28, width: '100%', alignItems: 'center' },
  primaryText: { color: '#111', fontWeight: '900', fontSize: 15 },
  secondaryBtn: { borderRadius: radii.full, paddingVertical: 13, width: '100%', alignItems: 'center', marginTop: 8 },
  secondaryText: { fontWeight: '800', fontSize: 15 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 18 },
  toggleLabel: { fontSize: 13, flex: 1, marginRight: 10 },
});
