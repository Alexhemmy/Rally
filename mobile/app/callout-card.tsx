/** Call-Out Card (mock 11)
 * The shareable card preview before sending. Honest deviation: there is
 * no call-outs backend yet, so Send Call-Out saves the card on this
 * device and says so. Kind of call-out and the edit field shape the
 * card; the held-messages and reply-notification rules arrive with the
 * callouts backend.
 */
import { useState } from 'react';
import { Text, StyleSheet, View, Pressable, TextInput, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { spacing, radii } from '@/constants/theme';

const GOLD = '#FFA726';
const TEAL = '#34D399';
const AMBER = '#FBBF24';

const KINDS = ['Challenge', 'Question', 'Cover request'];

export default function CallOutCardScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();
  const { click, success: okSound } = useSounds();
  const router = useRouter();
  const p = useLocalSearchParams<{ to?: string; handle?: string; fromName?: string; kind?: string; text?: string; heat?: string }>();

  const [kind, setKind] = useState(p.kind && KINDS.indexOf(p.kind) > -1 ? p.kind : 'Challenge');
  const [text, setText] = useState(p.text || '');

  const to = p.to || 'Mia Adebayo';
  const from = p.fromName || 'You';

  async function send() {
    if (text.trim().length < 5) return;
    setSendingGuard();
    try {
      const raw = await AsyncStorage.getItem('rally.callouts');
      const list = raw ? JSON.parse(raw) : [];
      list.push({ to, handle: p.handle || '', kind, text: text.trim(), heat: p.heat || 'Friendly', at: new Date().toISOString() });
      await AsyncStorage.setItem('rally.callouts', JSON.stringify(list));
      okSound();
      impact('success');
      Alert.alert(
        'Call-Out saved',
        'There is no call-outs backend yet, so your card is saved on this device. Publishing, held messages and reply notifications arrive with the callouts backend.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch {
      impact('error');
      Alert.alert('Call-Out', 'Could not save the card. Try again.');
    }
  }

  function setSendingGuard() { click(); }

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Call-Out Card</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
          {/* To */}
          <View style={styles.toRow}>
            <LinearGradient colors={['#F59E0B', '#F0663F'] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18 }}>{to.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</Text>
            </LinearGradient>
            <View style={{ marginLeft: 14 }}>
              <Text style={{ color: colors.muted, fontSize: 14 }}>To</Text>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 18 }} numberOfLines={1}>{to}</Text>
            </View>
          </View>

          <Text style={[styles.label, { color: colors.muted }]}>Kind of call-out</Text>
          <View style={styles.kindRow}>
            {KINDS.map((k) => {
              const on = kind === k;
              return (
                <Pressable key={k} onPress={() => { impact('light'); setKind(k); }} style={[styles.kindChip, { borderColor: on ? GOLD : colors.border, backgroundColor: on ? GOLD + '14' : colors.surface }]}>
                  <Text style={{ color: on ? GOLD : colors.text, fontWeight: '900', fontSize: 15 }}>{k}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.label, { color: colors.muted }]}>Your card</Text>
          <LinearGradient colors={['#B0347C', '#E9703C', GOLD] as [string, string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bigCard}>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontWeight: '900', fontSize: 13, letterSpacing: 1.5 }}>
              {kind.toUpperCase() + ' FROM ' + from.toUpperCase()}
            </Text>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 27, lineHeight: 36, marginTop: 14 }}>
              {text.trim() || 'Say it with the music.'}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, marginTop: 16 }}>
              {to.split(' ')[0] + ' can reply with a Moment, a poll or text. Or ignore it.'}
            </Text>
          </LinearGradient>

          <View style={[styles.editCard, { backgroundColor: colors.surface }]}>
            <TextInput
              style={{ color: colors.text, fontSize: 17, flex: 1, padding: 0 }}
              placeholder="Edit your challenge"
              placeholderTextColor={colors.muted}
              value={text}
              onChangeText={setText}
              maxLength={140}
              multiline
            />
            <Text style={{ color: colors.muted, fontSize: 15 }}>{text.length + '/140'}</Text>
          </View>

          <View style={[styles.noteRow, { backgroundColor: AMBER + '0F', borderColor: AMBER + '44' }]}>
            <Ionicons name="warning-outline" size={18} color={AMBER} />
            <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20, flex: 1, marginLeft: 10 }}>
              Messages that name or attack a person are held. Keep it kind and about the music.
            </Text>
          </View>

          <View style={[styles.noteRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="notifications-outline" size={18} color={TEAL} />
            <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20, flex: 1, marginLeft: 10 }}>
              You get a notification if {to.split(' ')[0]} replies. {to.split(' ')[0]} is never required to.
            </Text>
          </View>
        </ScrollView>

        <View style={{ marginBottom: spacing.lg }}>
          <Pressable onPress={send} style={styles.sendBtn} accessibilityLabel="Send Call-Out">
            <Text style={{ color: '#111', fontWeight: '900', fontSize: 18 }}>Send Call-Out</Text>
          </Pressable>
        </View>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  h1: { fontSize: 20, fontWeight: '900' },
  toRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 15, fontWeight: '900', marginBottom: 10, marginTop: spacing.sm },
  kindRow: { flexDirection: 'row', gap: 10 },
  kindChip: { borderWidth: 1.5, borderRadius: radii.full, paddingHorizontal: 18, paddingVertical: 12 },
  bigCard: { borderRadius: radii.xl, padding: 22 },
  editCard: { flexDirection: 'row', alignItems: 'center', borderRadius: radii.lg, padding: 16, marginTop: spacing.md, gap: 10, minHeight: 64 },
  noteRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radii.lg, padding: 14, marginTop: spacing.md },
  sendBtn: { backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: radii.full },
});
