/** New Face-Off (mock 06)
 * Real creation via POST /api/rivalries/:id/faceoffs - only the two
 * rivals (or an admin) can send one, and both Favorites must have opted
 * in; the server enforces this and the error is shown honestly. Heat is
 * set by rivals and moderators via PATCH /:id/heat. Face-Offs start as
 * soon as a rival sends one; accept/decline invites arrive with the
 * invites backend, so Send goes to the invite screen with the real
 * face-off id.
 */
import { useState } from 'react';
import { Text, StyleSheet, View, Pressable, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { api } from '@/lib/api';
import { spacing, radii } from '@/constants/theme';

const GOLD = '#FFA726';
const TEAL = '#34D399';

const DURATIONS = [
  { label: '24 hours', hours: 24 },
  { label: '3 days', hours: 72 },
  { label: '7 days', hours: 168 },
];
const HEATS = ['Friendly', 'Spicy', 'Fierce'];

function initials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function NewFaceOffScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();
  const { click, success: okSound } = useSounds();
  const router = useRouter();
  const p = useLocalSearchParams<{ id?: string; nameA?: string; nameB?: string }>();

  const [topic, setTopic] = useState('');
  const [hours, setHours] = useState(72);
  const [heat, setHeat] = useState('Spicy');
  const [sending, setSending] = useState(false);

  const nameA = p.nameA || 'Side A';
  const nameB = p.nameB || 'Side B';

  async function send() {
    if (!p.id || sending) return;
    if (topic.trim().length < 5) {
      Alert.alert('Topic', 'Give the Face-Off a topic of at least 5 characters.');
      return;
    }
    setSending(true);
    impact('medium');
    try {
      const r = await api<{ faceOff: { id: string; closesAt: string } }>('/api/rivalries/' + p.id + '/faceoffs', {
        method: 'POST',
        body: JSON.stringify({ question: topic.trim(), closesInHours: hours }),
      });
      try {
        await api('/api/rivalries/' + p.id + '/heat', {
          method: 'PATCH',
          body: JSON.stringify({ heatLevel: HEATS.indexOf(heat) + 1 }),
        });
      } catch { /* heat is rival/admin only; the face-off still stands */ }
      okSound();
      impact('success');
      router.replace({
        pathname: '/rivalries/invite',
        params: { faceOffId: r.faceOff.id, topic: topic.trim(), hours: String(hours), heat, nameA, nameB, closesAt: r.faceOff.closesAt },
      });
    } catch (e: any) {
      impact('error');
      Alert.alert('Face-Off', e.message || 'Could not send the challenge.');
    } finally {
      setSending(false);
    }
  }

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel={'Back'}>
            <Ionicons name={'chevron-back'} size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>New Face-Off</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* VS header */}
        <View style={styles.vsRow}>
          <View style={styles.side}>
            <LinearGradient colors={['#F59E0B', '#F0663F'] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 28 }}>{initials(nameA)}</Text>
            </LinearGradient>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15, marginTop: 10 }} numberOfLines={1}>{nameA}</Text>
          </View>
          <Text style={{ color: GOLD, fontWeight: '900', fontSize: 24 }}>VS</Text>
          <View style={styles.side}>
            <LinearGradient colors={['#4F46E5', '#818CF8'] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 28 }}>{initials(nameB)}</Text>
            </LinearGradient>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15, marginTop: 10 }} numberOfLines={1}>{nameB}</Text>
          </View>
        </View>

        <Text style={[styles.label, { color: colors.muted }]}>Topic</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder={'Best Sunday choir harmony'}
          placeholderTextColor={colors.muted}
          value={topic}
          onChangeText={setTopic}
          maxLength={200}
        />

        <Text style={[styles.label, { color: colors.muted }]}>How long?</Text>
        <View style={styles.chipRow}>
          {DURATIONS.map((d) => {
            const on = hours === d.hours;
            return (
              <Pressable key={d.label} onPress={() => { impact('light'); setHours(d.hours); }} style={[styles.chip, { borderColor: on ? GOLD : colors.border, backgroundColor: on ? GOLD + '14' : colors.surface }]}>
                <Text style={{ color: on ? GOLD : colors.text, fontWeight: '800', fontSize: 15 }}>{d.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.label, { color: colors.muted }]}>Heat</Text>
        <View style={styles.chipRow}>
          {HEATS.map((h) => {
            const on = heat === h;
            return (
              <Pressable key={h} onPress={() => { impact('light'); setHeat(h); }} style={[styles.chip, { borderColor: on ? GOLD : colors.border, backgroundColor: on ? GOLD + '14' : colors.surface }]}>
                <Text style={{ color: on ? GOLD : colors.text, fontWeight: '800', fontSize: 15 }}>{h}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.note, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name={'shield-checkmark-outline'} size={18} color={TEAL} />
          <Text style={[styles.noteText, { color: colors.muted }]}>
            Fans vote for free. Gifts never count as votes.
          </Text>
        </View>
        <Text style={[styles.honest, { color: colors.muted }]}>
          Face-Offs start as soon as a rival sends one, and only the two rivals (or a moderator) can send. Accept and decline invites arrive with the invites backend.
        </Text>

        <View style={{ marginTop: 'auto', marginBottom: spacing.lg }}>
          <Pressable onPress={send} disabled={sending} style={[styles.sendBtn, sending && { opacity: 0.6 }]} accessibilityLabel="Send challenge">
            <Text style={{ color: '#111', fontWeight: '900', fontSize: 18 }}>{sending ? 'Sending...' : 'Send challenge'}</Text>
          </Pressable>
        </View>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  h1: { fontSize: 20, fontWeight: '900' },
  vsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: spacing.md },
  side: { alignItems: 'center', flex: 1 },
  avatar: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 15, fontWeight: '800', marginTop: spacing.md, marginBottom: 10 },
  input: { borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  chipRow: { flexDirection: 'row', gap: 10 },
  chip: { borderWidth: 1.5, borderRadius: radii.full, paddingHorizontal: 20, paddingVertical: 12 },
  note: { flexDirection: 'row', gap: 10, alignItems: 'center', borderWidth: 1, borderRadius: radii.md, padding: 14, marginTop: spacing.lg },
  noteText: { flex: 1, fontSize: 14, lineHeight: 20 },
  honest: { fontSize: 12, lineHeight: 18, marginTop: spacing.md },
  sendBtn: { backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: radii.full },
});
