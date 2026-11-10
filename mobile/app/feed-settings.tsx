/** Feed and playback - Rally design (mock 25)
 * Playback: autoplay, start with sound, captions, data saver.
 * Your feed: time order, translate language, muted words and
 * accounts, sensitive content, personalisation - with the shield
 * note that personalisation never uses spending.
 * All preferences persist locally via lib/feedPrefs.
 */
import { useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import {
  loadFeedPrefs,
  saveFeedPrefs,
  type FeedPrefs,
} from '@/lib/feedPrefs';

const GOLD = '#FFA726';
const TEAL = '#34D399';

const AUTOPLAY_LABELS: Record<FeedPrefs['autoplay'], string> = {
  wifi: 'Wi-Fi only',
  always: 'On',
  off: 'Off',
};

const LANGS = ['English', 'Yor\u00f9b\u00e1', 'Hausa', 'Igbo', 'Pidgin'];

export default function FeedSettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const [prefs, setPrefs] = useState<FeedPrefs | null>(null);

  useEffect(() => {
    loadFeedPrefs().then(setPrefs);
  }, []);

  async function update(patch: Partial<FeedPrefs>) {
    const next = await saveFeedPrefs(patch);
    setPrefs(next);
  }

  function cycleAutoplay() {
    if (!prefs) return;
    impact('light');
    const order: FeedPrefs['autoplay'][] = ['wifi', 'always', 'off'];
    const i = order.indexOf(prefs.autoplay);
    update({ autoplay: order[(i + 1) % order.length] });
  }

  function cycleLang() {
    if (!prefs) return;
    impact('light');
    const i = LANGS.indexOf(prefs.translateLang);
    update({ translateLang: LANGS[(i + 1) % LANGS.length] });
  }

  function cycleSensitive() {
    if (!prefs) return;
    impact('light');
    update({ sensitive: prefs.sensitive === 'less' ? 'default' : 'less' });
  }

  if (!prefs) {
    return (
      <Screen>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Feed and playback</Text>
        </View>
      </Screen>
    );
  }

  const mutedCount = prefs.mutedWords.length + prefs.mutedAccounts.length;

  const toggles: {
    key: keyof FeedPrefs;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
  }[] = [
    { key: 'startWithSound', icon: 'pulse-outline', label: 'Start with sound' },
    { key: 'captions', icon: 'chatbox-outline', label: 'Captions' },
    { key: 'dataSaver', icon: 'water-outline', label: 'Data saver' },
  ];

  const feedToggles: {
    key: keyof FeedPrefs;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
  }[] = [
    { key: 'timeOrder', icon: 'time-outline', label: 'Following in time order' },
    { key: 'personalise', icon: 'sparkles-outline', label: 'Personalise my feed' },
  ];

  const renderRow = (
    icon: keyof typeof Ionicons.glyphMap,
    label: string,
    right: React.ReactNode,
    onPress?: () => void,
    testLabel?: string
  ) => (
    <View key={label} style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={[styles.iconBubble, { backgroundColor: colors.surfaceElevated }]}>
        <Ionicons name={icon} size={18} color={GOLD} />
      </View>
      <Pressable
        style={styles.rowMain}
        onPress={onPress}
        disabled={!onPress}
        accessibilityLabel={testLabel || label}
        accessibilityRole={onPress ? 'button' : undefined}
      >
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      </Pressable>
      {right}
    </View>
  );

  return (
    <SwipeBack>
      <Screen>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.topBar}>
            <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Go back">
              <Ionicons name="chevron-back" size={26} color={colors.text} />
            </Pressable>
            <Text style={[styles.h1, { color: colors.text }]}>Feed and playback</Text>
          </View>

          {/* PLAYBACK */}
          <Text style={[styles.section, { color: colors.muted }]}>PLAYBACK</Text>
          <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {renderRow(
              'videocam-outline',
              'Autoplay',
              <Pressable style={styles.valueRow} onPress={cycleAutoplay} accessibilityLabel="Change autoplay">
                <Text style={[styles.rowValue, { color: colors.muted }]}>{AUTOPLAY_LABELS[prefs.autoplay]}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </Pressable>,
              cycleAutoplay,
              'Autoplay'
            )}
            {toggles.map((t) =>
              renderRow(
                t.icon,
                t.label,
                <Switch
                  value={prefs[t.key] as boolean}
                  onValueChange={(v) => {
                    impact('light');
                    update({ [t.key]: v } as Partial<FeedPrefs>);
                  }}
                  trackColor={{ true: TEAL, false: colors.border }}
                  thumbColor="#fff"
                />
              )
            )}
          </View>

          {/* YOUR FEED */}
          <Text style={[styles.section, { color: colors.muted }]}>YOUR FEED</Text>
          <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {feedToggles.map((t) =>
              renderRow(
                t.icon,
                t.label,
                <Switch
                  value={prefs[t.key] as boolean}
                  onValueChange={(v) => {
                    impact('light');
                    update({ [t.key]: v } as Partial<FeedPrefs>);
                  }}
                  trackColor={{ true: TEAL, false: colors.border }}
                  thumbColor="#fff"
                />
              )
            )}
            {renderRow(
              'globe-outline',
              'Translate posts',
              <Pressable style={styles.valueRow} onPress={cycleLang} accessibilityLabel="Change translation language">
                <Text style={[styles.rowValue, { color: colors.muted }]}>{prefs.translateLang}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </Pressable>,
              cycleLang,
              'Translate posts'
            )}
            {renderRow(
              'ban-outline',
              'Muted words and accounts',
              <Pressable
                style={styles.valueRow}
                onPress={() => router.push('/settings')}
                accessibilityLabel="Muted words and accounts"
              >
                <Text style={[styles.rowValue, { color: colors.muted }]}>{String(mutedCount)}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </Pressable>
            )}
            {renderRow(
              'shield-checkmark-outline',
              'Sensitive content',
              <Pressable style={styles.valueRow} onPress={cycleSensitive} accessibilityLabel="Change sensitive content">
                <Text style={[styles.rowValue, { color: colors.muted }]}>
                  {prefs.sensitive === 'less' ? 'Less' : 'Default'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </Pressable>,
              cycleSensitive,
              'Sensitive content'
            )}
          </View>

          {/* Shield note */}
          <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Ionicons name="shield-checkmark" size={16} color={TEAL} />
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              Personalisation uses your interests and activity. It never uses what you spend.
            </Text>
          </View>
        </ScrollView>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.sm, marginBottom: spacing.md },
  h1: { fontSize: 22, fontWeight: '900' },
  section: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8, marginTop: spacing.md, marginBottom: 8 },
  group: {
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconBubble: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowMain: { flex: 1, marginLeft: 12 },
  rowLabel: { fontSize: 15, fontWeight: '700' },
  rowValue: { fontSize: 15, fontWeight: '700' },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 12,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  noteText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
