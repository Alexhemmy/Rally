/** Held comments (mock 25) - creator moderation queue.
 * Honest build: the backend has no held-comment or report queue yet
 * (comments only carry is_hidden, and reports are write-only), so the
 * Held and Reported tabs show clear empty notes. Blocked words is a
 * real, working on-device list (rally.blockedWords) that will feed the
 * auto-hold filter once the comments backend ships.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#FFA726';
const TEAL = '#34D399';
const RED = '#E9355B';

type Tab = 'held' | 'reported' | 'words';

export default function HeldCommentsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();

  const [tab, setTab] = useState<Tab>('held');
  const [words, setWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState('');

  const loadWords = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem('rally.blockedWords');
      if (raw) setWords(JSON.parse(raw));
    } catch { /* fresh */ }
  }, []);

  useEffect(() => { loadWords(); }, [loadWords]);

  function addWord() {
    const w = newWord.trim().toLowerCase();
    if (!w) return;
    if (words.includes(w)) {
      Alert.alert('Blocked words', 'Already on your list.');
      return;
    }
    impact('light');
    const next = [...words, w].slice(0, 100);
    setWords(next);
    setNewWord('');
    AsyncStorage.setItem('rally.blockedWords', JSON.stringify(next)).catch(() => {});
  }

  function removeWord(w: string) {
    impact('light');
    const next = words.filter((x) => x !== w);
    setWords(next);
    AsyncStorage.setItem('rally.blockedWords', JSON.stringify(next)).catch(() => {});
  }

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Moderation</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {([
            ['held', 'Held 0'],
            ['reported', 'Reported'],
            ['words', 'Blocked words'],
          ] as const).map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => { impact('light'); setTab(key); }}
              style={[styles.tabChip, { backgroundColor: colors.surfaceElevated, borderColor: tab === key ? GOLD : 'transparent' }, tab === key && { borderWidth: 1.5 }]}
              accessibilityLabel={label}
            >
              <Text style={{ color: tab === key ? GOLD : colors.text, fontWeight: '900', fontSize: 16 }}>{label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {tab === 'held' ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color={GOLD} />
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16, marginTop: 10 }}>Nothing held right now</Text>
            <Text style={{ color: colors.muted, fontSize: 14, marginTop: 6, lineHeight: 20, textAlign: 'center' }}>
              Comments flagged as harassment or spam will wait here for your call: approve, delete or block. The hold queue arrives with the comments moderation backend.
            </Text>
          </View>
        ) : null}

        {tab === 'reported' ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="flag-outline" size={24} color={GOLD} />
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16, marginTop: 10 }}>No reports to review</Text>
            <Text style={{ color: colors.muted, fontSize: 14, marginTop: 6, lineHeight: 20, textAlign: 'center' }}>
              Fans can already report posts, comments and Moments. A creator-facing report queue is on the roadmap - Rally reviews serious reports directly in the meantime.
            </Text>
          </View>
        ) : null}

        {tab === 'words' ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.addRow}>
              <TextInput
                style={[styles.addInput, { borderColor: colors.border, color: colors.text }]}
                placeholder="Add a word or phrase"
                placeholderTextColor={colors.muted}
                value={newWord}
                onChangeText={setNewWord}
                autoCapitalize="none"
                onSubmitEditing={addWord}
              />
              <Pressable onPress={addWord} style={styles.addBtn} accessibilityLabel="Add word">
                <Ionicons name="add" size={22} color="#111" />
              </Pressable>
            </View>

            {words.length === 0 ? (
              <Text style={{ color: colors.muted, fontSize: 14, marginTop: 12, lineHeight: 20 }}>
                Comments containing these words are held for your review instead of posting. Your list lives on this phone until the filter backend ships.
              </Text>
            ) : (
              <View style={[styles.wordsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {words.map((w) => (
                  <View key={w} style={styles.wordRow}>
                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700', flex: 1 }}>{w}</Text>
                    <Pressable onPress={() => removeWord(w)} hitSlop={8} accessibilityLabel={'Remove ' + w}>
                      <Ionicons name="close-circle-outline" size={22} color={RED} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Ionicons name="shield-checkmark-outline" size={16} color={TEAL} />
              <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                Held comments are only visible to their author and you. Rally also reviews serious reports.
              </Text>
            </View>
          </ScrollView>
        ) : null}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  chipRow: { flexDirection: 'row', gap: 10, paddingVertical: 6, marginBottom: spacing.sm },
  tabChip: { borderRadius: radii.full, paddingHorizontal: 20, paddingVertical: 12 },
  emptyCard: { borderWidth: 1, borderRadius: radii.lg, padding: 22, alignItems: 'center', marginTop: spacing.md },
  addRow: { flexDirection: 'row', gap: 10, marginTop: spacing.sm },
  addInput: { flex: 1, borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 14, minHeight: 50, fontSize: 16 },
  addBtn: { backgroundColor: GOLD, borderRadius: radii.md, width: 50, alignItems: 'center', justifyContent: 'center' },
  wordsCard: { borderWidth: 1, borderRadius: radii.lg, marginTop: 12 },
  wordRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.15)' },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 14,
    marginTop: spacing.md,
  },
  noteText: { flex: 1, fontSize: 14, lineHeight: 20 },
});
