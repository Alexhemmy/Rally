/** Privacy and Safety (UX 46) - Rally design
 * Who can reach you, giving visibility, and safety links. Gift
 * anonymity is real (PUT /api/limits anonymityDefault). Reach and
 * wall choices are saved on this device until the backend ships.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#FFA726';
const TEAL = '#34D399';

const REACH_OPTIONS = ['Everyone', 'Followers', 'Nobody'];

export default function PrivacySafetyScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();

  const [messages, setMessages] = useState('Followers');
  const [replies, setReplies] = useState('Everyone');
  const [anon, setAnon] = useState(false);
  const [onWalls, setOnWalls] = useState(true);
  const [blockedCount, setBlockedCount] = useState(0);
  const [rivalry, setRivalry] = useState('Opted out');

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem('rally.privacyPrefs');
      if (raw) {
        const p = JSON.parse(raw);
        if (p.messages) setMessages(p.messages);
        if (p.replies) setReplies(p.replies);
      }
      const blocked = await AsyncStorage.getItem('rally.blockedAccounts');
      if (blocked) setBlockedCount((JSON.parse(blocked) || []).length);
      const heat = await AsyncStorage.getItem('rally.rivalryHeat');
      setRivalry(heat ? 'Heat: ' + heat : 'Opted out');
    } catch { /* local only */ }
    if (getToken()) {
      try {
        const r: any = await api('/api/limits');
        setAnon(Boolean(r.anonymityDefault));
        setOnWalls(!r.anonymityDefault);
      } catch { /* offline */ }
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveAnon(v: boolean) {
    setAnon(v);
    setOnWalls(!v);
    impact('light');
    try {
      await api('/api/limits', { method: 'PUT', body: JSON.stringify({ anonymityDefault: v }) });
    } catch {
      setAnon(!v);
      setOnWalls(v);
    }
  }

  async function toggleWalls(v: boolean) {
    setOnWalls(v);
    setAnon(!v);
    impact('light');
    try {
      await api('/api/limits', { method: 'PUT', body: JSON.stringify({ anonymityDefault: !v }) });
    } catch {
      setOnWalls(!v);
      setAnon(v);
    }
  }

  function pickReach(kind: 'messages' | 'replies', current: string) {
    Alert.alert(
      kind === 'messages' ? 'Who can message you' : 'Who can reply to your comments',
      'Choose who can reach you.',
      REACH_OPTIONS.map((opt) => ({
        text: opt + (opt === current ? ' (current)' : ''),
        onPress: () => {
          impact('light');
          if (kind === 'messages') setMessages(opt); else setReplies(opt);
          AsyncStorage.setItem('rally.privacyPrefs', JSON.stringify({
            messages: kind === 'messages' ? opt : messages,
            replies: kind === 'replies' ? opt : replies,
          })).catch(() => undefined);
        },
      })).concat([{ text: 'Cancel', style: 'cancel' as const }]) as any
    );
  }

  function row(icon: string, label: string, value: string | null, onPress: () => void, accent?: string) {
    return (
      <Pressable style={styles.row} onPress={onPress} accessibilityLabel={label}>
        <View style={[styles.iconBubble, { backgroundColor: colors.surfaceElevated }]}>
          <Ionicons name={icon as any} size={19} color={accent || GOLD} />
        </View>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        {value ? <Text style={{ color: colors.muted, fontSize: 15 }}>{value}</Text> : null}
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </Pressable>
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
          <Text style={[styles.h1, { color: colors.text }]}>Privacy and safety</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={[styles.section, { color: colors.muted }]}>WHO CAN REACH YOU</Text>
          {row('paper-plane-outline', 'Messages', messages, () => pickReach('messages', messages))}
          {row('chatbubble-outline', 'Replies to my comments', replies, () => pickReach('replies', replies))}

          <Text style={[styles.section, { color: colors.muted }]}>GIVING</Text>
          <View style={styles.row}>
            <View style={[styles.iconBubble, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons name="eye-outline" size={19} color={GOLD} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Gift anonymously by default</Text>
            <Pressable
              onPress={() => saveAnon(!anon)}
              style={[styles.switchTrack, anon ? { backgroundColor: TEAL } : { backgroundColor: colors.border }]}
              accessibilityLabel="Toggle gift anonymity"
            >
              <View style={[styles.switchThumb, anon ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]} />
            </Pressable>
          </View>
          <View style={styles.row}>
            <View style={[styles.iconBubble, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons name="trophy-outline" size={19} color={GOLD} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Show me on supporter walls</Text>
            <Pressable
              onPress={() => toggleWalls(!onWalls)}
              style={[styles.switchTrack, onWalls ? { backgroundColor: TEAL } : { backgroundColor: colors.border }]}
              accessibilityLabel="Toggle supporter walls"
            >
              <View style={[styles.switchThumb, onWalls ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]} />
            </Pressable>
          </View>

          <Text style={[styles.section, { color: colors.muted }]}>SAFETY</Text>
          {row('shield-checkmark-outline', 'Safe mode', 'Off', () => router.push('/safe-mode-welcome'))}
          {row('ban-outline', 'Blocked and muted', blockedCount > 0 ? String(blockedCount) : null, () => router.push('/blocked-muted'))}
          {row('flame-outline', 'Rivalry', rivalry, () => router.push('/rivalries'))}

          <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Ionicons name="shield-checkmark" size={16} color={TEAL} />
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              Safe mode adds limits on messages, Rivalry and spending. It is on by default for under 18s.
            </Text>
          </View>
          <Text style={[styles.hint, { color: colors.muted }]}>
            Reach choices are saved on this device for now — server sync is coming.
          </Text>
        </ScrollView>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.sm },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  section: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginTop: spacing.md, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  iconBubble: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 16, fontWeight: '700' },
  switchTrack: { width: 54, height: 32, borderRadius: 16, padding: 2 },
  switchThumb: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff' },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: radii.lg, padding: 14, marginTop: spacing.md },
  noteText: { flex: 1, fontSize: 13, lineHeight: 19 },
  hint: { fontSize: 12, marginTop: spacing.sm },
});
