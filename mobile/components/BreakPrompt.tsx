/** BreakPrompt - Rally design (screen 53)
 * A centered card after a long session. Take a break returns to Home,
 * Keep watching dismisses it and restarts the timer. The reminder can
 * be switched off for this app session (calm by default).
 */
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/components/ThemeProvider';
import { radii } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';

const GOLD = '#FFA726';
const INTERVAL_MINUTES = 45;

export function BreakPrompt() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const [visible, setVisible] = useState(false);
  const [off, setOff] = useState(false);

  useEffect(() => {
    if (off) return;
    const timer = setTimeout(() => setVisible(true), INTERVAL_MINUTES * 60 * 1000);
    return () => clearTimeout(timer);
  }, [off, visible]);

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
      <Pressable style={styles.overlay} onPress={keepWatching}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.iconWrap}>
            <Ionicons name={'moon'} size={30} color={GOLD} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Time for a break?</Text>
          <Text style={[styles.body, { color: colors.muted }]}>
            You have been here a while. Rally will be right here when you get back.
          </Text>
          <Pressable style={styles.primaryBtn} onPress={takeBreak} accessibilityLabel={'Take a break'}>
            <Text style={styles.primaryText}>Take a break</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={keepWatching} accessibilityLabel={'Keep watching'}>
            <Text style={[styles.secondaryText, { color: colors.text }]}>Keep watching</Text>
          </Pressable>
          <Pressable onPress={() => { setOff(true); setVisible(false); }} hitSlop={8} accessibilityLabel={'Turn off break reminders'}>
            <Text style={[styles.offText, { color: colors.muted }]}>Do not remind me again</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  card: { borderRadius: radii.lg, padding: 22, width: '100%', alignItems: 'center' },
  iconWrap: { width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(255,167,38,0.14)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 19, fontWeight: '900', marginBottom: 8 },
  body: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 18 },
  primaryBtn: { backgroundColor: GOLD, borderRadius: radii.full, paddingVertical: 13, paddingHorizontal: 28, width: '100%', alignItems: 'center' },
  primaryText: { color: '#111', fontWeight: '900', fontSize: 15 },
  secondaryBtn: { borderRadius: radii.full, paddingVertical: 13, width: '100%', alignItems: 'center', marginTop: 8 },
  secondaryText: { fontWeight: '800', fontSize: 15 },
  offText: { fontSize: 12, marginTop: 14 },
});
