/** Call-Out Card (UX) - Rally design
 * A kind, public prompt to a Favorite: challenge, question or cover
 * request. Messages that name or attack a person are held. The Favorite
 * can reply with a Moment, a poll or text - or ignore it.
 */
import { useState } from 'react';
import { Text, StyleSheet, View, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const PURPLE = '#7C3AED';
const RED = '#ef5350';
const GREEN = '#34D399';
const MAX = 140;

const KINDS: { id: 'challenge' | 'question' | 'cover_request'; label: string }[] = [
  { id: 'challenge', label: 'Challenge' },
  { id: 'question', label: 'Question' },
  { id: 'cover_request', label: 'Cover request' },
];
const KIND_TITLE: Record<string, string> = {
  challenge: 'CHALLENGE',
  question: 'QUESTION',
  cover_request: 'COVER REQUEST',
};

export default function CallOutScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const params = useLocalSearchParams<{ handle?: string; name?: string }>();
  const [kind, setKind] = useState<'challenge' | 'question' | 'cover_request'>('challenge');
  const [text, setText] = useState('');
  const [editing, setEditing] = useState(true);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const name = params.name || params.handle || 'your Favorite';
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const valid = text.trim().length >= 5 && text.trim().length <= MAX;
  const kindLabel = KINDS.find((k) => k.id === kind)!.label;

  async function send() {
    if (!valid || !params.handle || sending) return;
    setSending(true);
    setMsg(null);
    impact('medium');
    try {
      const res = await api<{ held: boolean; note: string }>('/api/callouts', {
        method: 'POST',
        body: JSON.stringify({ handle: params.handle, kind, body: text.trim() }),
      });
      impact('success');
      setMsg({
        ok: true,
        text: res.held
          ? 'This call-out is held for review because of how it reads. Nothing was sent.'
          : 'Call-out sent. ' + (res.note || ''),
      });
      setText('');
    } catch (e: any) {
      setMsg({ ok: false, text: e && e.message ? e.message : 'Could not send. Try again.' });
    } finally {
      setSending(false);
    }
  }

  return (
    <SwipeBack>
      <Screen>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Call-Out Card</Text>
        </View>

        {/* To */}
        <View style={[styles.toCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '800' }}>TO</Text>
          <View style={styles.toRow}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>{name}</Text>
          </View>
        </View>

        {/* Kind */}
        <Text style={[styles.section, { color: colors.muted }]}>KIND OF CALL-OUT</Text>
        <View style={styles.kindRow}>
          {KINDS.map((k) => (
            <Pressable
              key={k.id}
              onPress={() => { impact('light'); setKind(k.id); }}
              style={[styles.kindChip, kind === k.id ? { backgroundColor: GOLD, borderColor: GOLD } : { borderColor: colors.border }]}
              accessibilityLabel={k.label}
            >
              <Text style={{ color: kind === k.id ? '#111' : colors.muted, fontWeight: '800', fontSize: 13 }}>{k.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Preview */}
        <Text style={[styles.section, { color: colors.muted }]}>YOUR CARD</Text>
        <LinearGradient
          colors={[PURPLE, GOLD_DEEP] as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.previewCard}
        >
          <Text style={styles.previewKind}>{KIND_TITLE[kind] + ' FROM YOU'}</Text>
          <Text style={styles.previewBody}>{text.trim() || 'Write your ' + kindLabel.toLowerCase() + ' below'}</Text>
        </LinearGradient>
        <Text style={{ color: colors.muted, fontSize: 11, marginTop: 8, lineHeight: 16 }}>
          {name + ' can reply with a Moment, a poll or text. Or ignore it.'}
        </Text>

        {/* Editor */}
        {editing ? (
          <View style={{ marginTop: 10 }}>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder={'Write your ' + kindLabel.toLowerCase() + ' (5-140 characters)'}
              placeholderTextColor={colors.muted}
              value={text}
              onChangeText={(t) => setText(t.slice(0, MAX))}
              multiline
              autoFocus={false}
            />
            <Text style={[styles.counter, { color: text.length > MAX - 20 ? RED : colors.muted }]}>
              {text.length + '/' + MAX}
            </Text>
          </View>
        ) : (
          <Pressable style={[styles.editBtn, { borderColor: colors.border }]} onPress={() => setEditing(true)}>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>{'Edit your ' + kindLabel.toLowerCase()}</Text>
          </Pressable>
        )}

        {/* Warning */}
        <View style={[styles.warnBox, { borderColor: GOLD + '66' }]}>
          <Ionicons name="warning-outline" size={16} color={GOLD} />
          <Text style={[styles.warnText, { color: colors.muted }]}>
            Messages that name or attack a person are held. Keep it kind and about the music.
          </Text>
        </View>
        <View style={[styles.infoBox, { borderColor: colors.border }]}>
          <Ionicons name="notifications-outline" size={16} color={colors.muted} />
          <Text style={[styles.warnText, { color: colors.muted }]}>
            {'You get a notification if ' + name + ' replies. They are never required to.'}
          </Text>
        </View>

        {msg ? (
          <Text style={{ color: msg.ok ? GREEN : RED, fontSize: 13, fontWeight: '700', lineHeight: 19, marginTop: 10 }}>
            {msg.text}
          </Text>
        ) : null}

        <Pressable
          style={({ pressed }) => [styles.sendBtn, pressed && { opacity: 0.85 }]}
          onPress={send}
          disabled={!valid || !getToken() || sending}
          accessibilityLabel="Send Call-Out"
        >
          <LinearGradient
            colors={[GOLD, GOLD_DEEP] as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.sendGradient, (!valid || !getToken()) && { opacity: 0.4 }]}
          >
            <Text style={styles.sendText}>{sending ? 'Sending\u2026' : 'Send Call-Out'}</Text>
          </LinearGradient>
        </Pressable>
        </KeyboardAvoidingView>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.sm },
  h1: { fontSize: 24, fontWeight: '900' },
  toCard: { borderWidth: 1, borderRadius: radii.lg, padding: 14, marginTop: spacing.sm },
  toRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#111', fontWeight: '900', fontSize: 14 },
  section: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: spacing.md, marginBottom: 8 },
  kindRow: { flexDirection: 'row', gap: 8 },
  kindChip: { flex: 1, borderWidth: 1, borderRadius: radii.full, alignItems: 'center', paddingVertical: 9 },
  previewCard: { borderRadius: radii.lg, padding: 18 },
  previewKind: { color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  previewBody: { color: '#fff', fontSize: 17, fontWeight: '700', lineHeight: 24, marginTop: 8 },
  input: { borderWidth: 1, borderRadius: radii.md, padding: 14, fontSize: 14, minHeight: 80, textAlignVertical: 'top' },
  counter: { fontSize: 11, textAlign: 'right', marginTop: 4 },
  editBtn: { borderWidth: 1, borderRadius: radii.full, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 14 },
  warnBox: { flexDirection: 'row', borderWidth: 1, borderRadius: radii.md, padding: 12, marginTop: 14, gap: 8, alignItems: 'flex-start' },
  infoBox: { flexDirection: 'row', borderWidth: 1, borderRadius: radii.md, padding: 12, marginTop: 10, gap: 8, alignItems: 'flex-start' },
  warnText: { flex: 1, fontSize: 12, lineHeight: 18 },
  sendBtn: { borderRadius: radii.full, marginTop: 16, overflow: 'hidden' },
  sendGradient: { alignItems: 'center', justifyContent: 'center', paddingVertical: 15 },
  sendText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
