/** WhySheet - Rally design
 * "Why am I seeing this?" sheet: transparent ranking reasons, a shield
 * note that spending never changes reach, and Make-it-yours controls
 * (newest first, hide rivalry, mutes). All client-side preferences.
 */
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeProvider';
import { radii } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';

const GOLD = '#FFA726';
const TEAL = '#34D399';

type IconName = keyof typeof Ionicons.glyphMap;

function Toggle({ on, onPress }: { on: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.toggle, on && { backgroundColor: TEAL }]}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
    >
      <View style={[styles.knob, on && { alignSelf: 'flex-end' }]} />
    </Pressable>
  );
}

export function WhySheet({
  visible,
  onClose,
  authorName,
  categoryLabel,
  alsoSupportsName,
  newestFirst,
  onToggleNewest,
  hideRivalry,
  onToggleRivalry,
  onMuteAuthor,
  onMuteCategory,
  onMuteWord,
}: {
  visible: boolean;
  onClose: () => void;
  authorName: string;
  categoryLabel: string;
  alsoSupportsName?: string;
  newestFirst: boolean;
  onToggleNewest: () => void;
  hideRivalry: boolean;
  onToggleRivalry: () => void;
  onMuteAuthor: () => void;
  onMuteCategory: () => void;
  onMuteWord: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { impact } = useHaptics();
  const [wordMode, setWordMode] = useState(false);
  const [word, setWord] = useState('');

  useEffect(() => {
    if (visible) {
      setWordMode(false);
      setWord('');
    }
  }, [visible]);

  const firstName = authorName.split(' ')[0];

  const reasons: { icon: IconName; text: string[] }[] = [
    { icon: 'person-outline', text: ['You follow ', authorName] },
    { icon: 'radio-button-on-outline', text: ['You watch a lot of ', categoryLabel, ' Moments'] },
  ];
  if (alsoSupportsName) {
    reasons.push({
      icon: 'people-outline',
      text: ['Fans who support ', alsoSupportsName, ' also support ' + firstName],
    });
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: Math.max(20, insets.bottom) }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.grabHandle} />

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Why am I seeing this?</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close">
              <Ionicons name="close" size={22} color={colors.muted} />
            </Pressable>
          </View>

          {reasons.map((r, i) => (
            <View key={i} style={[styles.reasonRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.reasonIcon, { backgroundColor: colors.surfaceElevated }]}>
                <Ionicons name={r.icon} size={18} color={GOLD} />
              </View>
              <Text style={[styles.reasonText, { color: colors.text }]}>
                {r.text.map((part, j) =>
                  j % 2 === 1 ? (
                    <Text key={j} style={{ fontWeight: '900' }}>{part}</Text>
                  ) : (
                    <Text key={j}>{part}</Text>
                  )
                )}
              </Text>
            </View>
          ))}

          <View style={[styles.shieldNote, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Ionicons name="shield-checkmark" size={16} color={TEAL} />
            <Text style={[styles.shieldText, { color: colors.textSecondary }]}>
              This is not a paid boost. Spending never changes who sees a Moment.
            </Text>
          </View>

          <Text style={[styles.section, { color: colors.muted }]}>MAKE IT YOURS</Text>

          <View style={[styles.prefRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.reasonIcon, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons name="time-outline" size={18} color={GOLD} />
            </View>
            <Text style={[styles.reasonText, { color: colors.text, fontWeight: '700' }]}>Show newest first</Text>
            <Toggle on={newestFirst} onPress={() => { impact('light'); onToggleNewest(); }} />
          </View>

          <View style={[styles.prefRow, { borderBottomColor: colors.border, borderBottomWidth: 0 }]}>
            <View style={[styles.reasonIcon, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons name="ban-outline" size={18} color={GOLD} />
            </View>
            <Text style={[styles.reasonText, { color: colors.text, fontWeight: '700' }]}>Hide rivalry content</Text>
            <Toggle on={hideRivalry} onPress={() => { impact('light'); onToggleRivalry(); }} />
          </View>

          <View style={styles.muteChips}>
            <Pressable style={[styles.muteChip, { backgroundColor: colors.surfaceElevated }]} onPress={() => { impact('light'); onMuteAuthor(); }} accessibilityLabel={'Mute ' + firstName}>
              <Text style={[styles.muteChipText, { color: colors.text }]}>Mute {firstName}</Text>
            </Pressable>
            <Pressable style={[styles.muteChip, { backgroundColor: colors.surfaceElevated }]} onPress={() => { impact('light'); onMuteCategory(); }} accessibilityLabel={'Mute ' + categoryLabel}>
              <Text style={[styles.muteChipText, { color: colors.text }]}>Mute {categoryLabel}</Text>
            </Pressable>
            <Pressable
              style={[styles.muteChip, { backgroundColor: colors.surfaceElevated }]}
              onPress={() => {
                impact('light');
                if (wordMode && word.trim()) {
                  onMuteWord();
                  setWord('');
                  setWordMode(false);
                } else {
                  setWordMode(true);
                }
              }}
              accessibilityLabel="Mute a word"
            >
              <Text style={[styles.muteChipText, { color: colors.text }]}>
                {wordMode && word.trim() ? 'Mute "' + word.trim() + '"' : 'Mute a word'}
              </Text>
            </Pressable>
          </View>

          {wordMode ? (
            <View style={[styles.wordInput, { borderColor: colors.border }]}>
              <TextInput
                style={[styles.wordInputText, { color: colors.text }]}
                placeholder="Type a word to mute"
                placeholderTextColor={colors.muted}
                value={word}
                onChangeText={(t) => setWord(t.slice(0, 30))}
                maxLength={30}
              />
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  grabHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: 14,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '900', flex: 1 },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  reasonIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  reasonText: { flex: 1, marginLeft: 12, fontSize: 15, lineHeight: 21 },
  shieldNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 12,
    marginTop: 12,
  },
  shieldText: { flex: 1, fontSize: 13, lineHeight: 18 },
  section: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8, marginTop: 16, marginBottom: 4 },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  toggle: {
    width: 46,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 2,
    justifyContent: 'center',
  },
  knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
  muteChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  muteChip: {
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: radii.md,
  },
  muteChipText: { fontSize: 14, fontWeight: '800' },
  wordInput: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
  },
  wordInputText: { fontSize: 14, minHeight: 36, padding: 0 },
});
