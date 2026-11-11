/** Ask for a Higher Limit (mock 09)
 * Monthly limit card from the real GET /api/limits (monthly cap +
 * spent this month, resets on the 1st of next month). Request chips
 * and an optional note to the guardian. There is no limit-request
 * endpoint on the backend yet, so Send request stores the request on
 * this device and says so honestly.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const TEAL = '#34D399';

const CHOICES = [7500, 10000, 15000];

function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

function resetLabel(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return '1 ' + next.toLocaleString('en-US', { month: 'long' });
}

export default function HigherLimitScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();

  const [cap, setCap] = useState(5000);
  const [spent, setSpent] = useState(0);
  const [guardian, setGuardian] = useState('Your parent');
  const [choice, setChoice] = useState<number | null>(10000);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!getToken()) return;
    try {
      const l = await api<any>('/api/limits');
      if (l.monthlySpendCap != null) setCap(Number(l.monthlySpendCap));
      setSpent(Number(l.spentThisMonth || 0));
    } catch { /* offline */ }
    try {
      const j = await api<any>('/api/junior/me');
      if (j.application && j.application.guardianName) setGuardian(j.application.guardianName);
    } catch { /* no application */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function send() {
    if (choice == null || sending) return;
    setSending(true);
    impact('medium');
    try {
      const raw = await AsyncStorage.getItem('rally.limitRequests');
      const list = raw ? JSON.parse(raw) : [];
      list.push({ amount: choice, message: message, at: new Date().toISOString(), status: 'pending' });
      await AsyncStorage.setItem('rally.limitRequests', JSON.stringify(list));
      impact('success');
      Alert.alert(
        'Request saved',
        guardian + ' will decide. Gifts you have already sent stay sent. The parent approval endpoint is not live yet, so this request is stored on this phone for now.'
      );
      router.back();
    } catch {
      Alert.alert('Higher limit', 'Could not save the request on this phone.');
    } finally {
      setSending(false);
    }
  }

  const pct = cap > 0 ? Math.min(1, spent / cap) : 0;

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Spending limit</Text>
          <View style={{ width: 26 }} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={{ color: colors.muted, fontSize: 16 }}>Your monthly limit</Text>
          <Text style={{ color: colors.text, fontWeight: '900', fontSize: 34, marginTop: 4 }}>{'₦' + fmt(cap)}</Text>
          <View style={[styles.bar, { backgroundColor: colors.border }]}>
            <View style={{ width: Math.round(pct * 100) + '%', height: '100%', borderRadius: 4, backgroundColor: GOLD }} />
          </View>
          <Text style={{ color: colors.muted, fontSize: 15, marginTop: 10 }}>
            {'You have used ₦' + fmt(spent) + '. It resets on ' + resetLabel() + '.'}
          </Text>
        </View>

        <Text style={[styles.section, { color: colors.muted }]}>Ask for a higher limit</Text>
        <View style={styles.chipRow}>
          {CHOICES.map((c) => (
            <Pressable
              key={c}
              onPress={() => { impact('light'); setChoice(c); }}
              style={[styles.chip, { borderColor: choice === c ? GOLD : colors.border, backgroundColor: choice === c ? GOLD + '1a' : colors.surface }]}
              accessibilityLabel={'Ask for ' + fmt(c)}
            >
              <Text style={{ color: choice === c ? GOLD : colors.text, fontWeight: '800', fontSize: 15 }}>{'₦' + fmt(c)}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.section, { color: colors.muted }]}>Message to your parent (optional)</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          multiline
          placeholder="It is for the anniversary giveaway week."
          placeholderTextColor={colors.muted}
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
        />

        <View style={[styles.note, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="shield-checkmark-outline" size={20} color={TEAL} />
          <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 21, flex: 1, marginLeft: 12 }}>
            {guardian + ' decides. Gifts you have already sent stay sent.'}
          </Text>
        </View>

        <LinearGradient
          colors={[GOLD, '#FF8A3D']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.sendBtn}
        >
          <Pressable onPress={send} disabled={sending} style={styles.sendInner} accessibilityLabel="Send request">
            <Text style={{ color: '#1A1206', fontWeight: '900', fontSize: 18 }}>Send request</Text>
          </Pressable>
        </LinearGradient>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 17, fontWeight: '900', flex: 1, textAlign: 'center' },
  card: { borderWidth: 1, borderRadius: radii.lg, padding: 16 },
  bar: { height: 6, borderRadius: 4, marginTop: 12, overflow: 'hidden' },
  section: { fontWeight: '800', fontSize: 15, marginTop: spacing.lg, marginBottom: 10 },
  chipRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  chip: { borderWidth: 1.5, borderRadius: radii.full, paddingHorizontal: 18, paddingVertical: 12 },
  input: { borderWidth: 1, borderRadius: radii.lg, padding: 16, minHeight: 110, textAlignVertical: 'top', fontSize: 16, lineHeight: 22 },
  note: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radii.lg, padding: 16, marginTop: spacing.lg },
  sendBtn: { borderRadius: radii.full, marginTop: spacing.xl },
  sendInner: { width: '100%', alignItems: 'center', paddingVertical: 18, borderRadius: radii.full },
});
