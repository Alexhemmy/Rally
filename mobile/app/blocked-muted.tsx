/** Blocked and Muted (UX 47) - Rally design
 * Accounts you blocked or muted, and muted words. Blocking calls the
 * real POST /api/moderation/block; the list itself is kept on this
 * device until the blocking backend ships - the note says so.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#FFA726';
const TEAL = '#34D399';

type Entry = { handle: string; kind: 'blocked' | 'muted'; when: string };

const KEY_ACCOUNTS = 'rally.blockedAccounts';
const KEY_WORDS = 'rally.mutedWords';

function today(): string {
  const d = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return d.getDate() + ' ' + months[d.getMonth()];
}

export default function BlockedMutedScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();

  const [tab, setTab] = useState<'accounts' | 'words'>('accounts');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [words, setWords] = useState<string[]>([]);
  const [handle, setHandle] = useState('');
  const [word, setWord] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const a = await AsyncStorage.getItem(KEY_ACCOUNTS);
      if (a) setEntries(JSON.parse(a) || []);
      const w = await AsyncStorage.getItem(KEY_WORDS);
      if (w) setWords(JSON.parse(w) || []);
    } catch { /* local only */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  function saveEntries(next: Entry[]) {
    setEntries(next);
    AsyncStorage.setItem(KEY_ACCOUNTS, JSON.stringify(next)).catch(() => undefined);
  }

  function saveWords(next: string[]) {
    setWords(next);
    AsyncStorage.setItem(KEY_WORDS, JSON.stringify(next)).catch(() => undefined);
  }

  async function block() {
    const h = handle.trim().replace(/^@/, '').toLowerCase();
    if (!h) return;
    setBusy(true);
    impact('medium');
    try {
      await api('/api/moderation/block', { method: 'POST', body: JSON.stringify({ handle: h }) });
      saveEntries([{ handle: h, kind: 'blocked', when: 'Blocked ' + today() }, ...entries.filter((e) => e.handle !== h)]);
      setHandle('');
    } catch (e: any) {
      Alert.alert('Could not block', e.message || 'Try again in a moment.');
    } finally {
      setBusy(false);
    }
  }

  function addWord() {
    const w = word.trim().toLowerCase();
    if (!w || words.indexOf(w) >= 0) return;
    impact('light');
    saveWords([w, ...words]);
    setWord('');
  }

  function removeEntry(e: Entry) {
    impact('light');
    saveEntries(entries.filter((x) => x.handle !== e.handle));
  }

  return (
    <SwipeBack>
      <Screen>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Blocked and muted</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* Tabs */}
        <View style={[styles.tabs, { backgroundColor: colors.surfaceElevated }]}>
          {(['accounts', 'words'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => { impact('light'); setTab(t); }}
              style={[styles.tabBtn, tab === t ? { backgroundColor: colors.surface } : null]}
              accessibilityLabel={t === 'accounts' ? 'Accounts' : 'Words'}
            >
              <Text style={{ color: tab === t ? colors.text : colors.muted, fontWeight: '800', fontSize: 15 }}>
                {t === 'accounts' ? 'Accounts' : 'Words'}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {tab === 'accounts' ? (
            <>
              {/* Block a handle */}
              <View style={[styles.blockInputRow, { borderColor: colors.border }]}>
                <TextInput
                  style={[styles.blockInput, { color: colors.text }]}
                  placeholder="@handle to block"
                  placeholderTextColor={colors.muted}
                  value={handle}
                  onChangeText={setHandle}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable onPress={block} disabled={busy || !handle.trim()} style={[styles.blockBtn, { opacity: busy || !handle.trim() ? 0.5 : 1 }]} accessibilityLabel="Block">
                  <Text style={{ color: '#111', fontWeight: '900', fontSize: 14 }}>Block</Text>
                </Pressable>
              </View>

              {entries.length === 0 ? (
                <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: spacing.md }}>
                  Nobody blocked or muted yet.
                </Text>
              ) : (
                entries.map((e, i) => (
                  <View
                    key={e.handle}
                    style={[styles.row, i < entries.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
                  >
                    <View style={[styles.avatar, { backgroundColor: colors.surfaceElevated }]}>
                      <Text style={[styles.avatarText, { color: colors.muted }]}>
                        {e.kind === 'blocked' ? '?' : e.handle.slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16 }}>@{e.handle}</Text>
                      <Text style={{ color: colors.muted, fontSize: 13, marginTop: 1 }}>
                        {e.kind === 'blocked' ? e.when : 'Muted ' + e.when}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => removeEntry(e)}
                      style={[styles.pill, { backgroundColor: colors.surfaceElevated }]}
                      accessibilityLabel={e.kind === 'blocked' ? 'Unblock' : 'Unmute'}
                    >
                      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13 }}>
                        {e.kind === 'blocked' ? 'Unblock' : 'Unmute'}
                      </Text>
                    </Pressable>
                  </View>
                ))
              )}
            </>
          ) : (
            <>
              <View style={[styles.blockInputRow, { borderColor: colors.border }]}>
                <TextInput
                  style={[styles.blockInput, { color: colors.text }]}
                  placeholder="Word or phrase to mute"
                  placeholderTextColor={colors.muted}
                  value={word}
                  onChangeText={setWord}
                  autoCapitalize="none"
                  onSubmitEditing={addWord}
                  returnKeyType="done"
                />
                <Pressable onPress={addWord} disabled={!word.trim()} style={[styles.blockBtn, { opacity: word.trim() ? 1 : 0.5 }]} accessibilityLabel="Mute word">
                  <Text style={{ color: '#111', fontWeight: '900', fontSize: 14 }}>Mute</Text>
                </Pressable>
              </View>

              {words.length === 0 ? (
                <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: spacing.md }}>
                  No muted words. Posts containing them are hidden from your feeds.
                </Text>
              ) : (
                <View style={styles.wordWrap}>
                  {words.map((w) => (
                    <Pressable key={w} onPress={() => saveWords(words.filter((x) => x !== w))} style={[styles.wordPill, { backgroundColor: colors.surfaceElevated }]} accessibilityLabel={'Unmute ' + w}>
                      <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>{w}</Text>
                      <Ionicons name="close" size={15} color={colors.muted} />
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          )}

          <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, marginTop: spacing.md }]}>
            <Ionicons name="ban-outline" size={16} color={TEAL} />
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              Blocked accounts cannot see your profile, message you or reply to you. They are not told.
              The block list syncs to your account when the blocking backend ships.
            </Text>
          </View>
        </ScrollView>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  tabs: { flexDirection: 'row', borderRadius: radii.lg, padding: 4, marginBottom: spacing.md },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: radii.md },
  blockInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: radii.full, paddingLeft: 16, paddingRight: 4, paddingVertical: 4 },
  blockInput: { flex: 1, fontSize: 15, paddingVertical: 10 },
  blockBtn: { backgroundColor: GOLD, borderRadius: radii.full, paddingHorizontal: 20, paddingVertical: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '900', fontSize: 15 },
  pill: { borderRadius: radii.full, paddingHorizontal: 18, paddingVertical: 10 },
  wordWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: spacing.sm },
  wordPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radii.full, paddingHorizontal: 14, paddingVertical: 9 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: radii.lg, padding: 14 },
  noteText: { flex: 1, fontSize: 13, lineHeight: 19 },
});
