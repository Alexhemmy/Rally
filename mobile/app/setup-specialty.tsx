/** Favorite Setup - "What do you do?" (mock 02)
 * Step 2 of 4 in Favorite onboarding. Search + grouped specialty
 * catalog: first pick becomes PRIMARY, up to three more become
 * Secondary. Persisted locally as rally.specialties because the
 * backend has no specialties field yet. Continue goes to verification.
 */
import { useEffect, useMemo, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { GradientButton } from '@/components/GradientButton';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { spacing, radii } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#FFA726';
const TEAL = '#34D399';

type Item = { id: string; label: string; icon: keyof typeof Ionicons.glyphMap };
type Group = { title: string; items: Item[] };

const CATALOG: Group[] = [
  {
    title: 'MUSIC \u00b7 GOSPEL AND WORSHIP',
    items: [
      { id: 'worship-leader', label: 'Worship leader', icon: 'mic' },
      { id: 'gospel-choir', label: 'Gospel choir or group', icon: 'people' },
      { id: 'gospel-rap', label: 'Gospel rap', icon: 'mic' },
    ],
  },
  {
    title: 'ALSO IN MUSIC',
    items: [
      { id: 'afro-fusion', label: 'Afro-fusion', icon: 'disc' },
      { id: 'songwriter', label: 'Songwriter', icon: 'book' },
      { id: 'producer', label: 'Producer', icon: 'musical-notes' },
      { id: 'instrumentalist', label: 'Instrumentalist', icon: 'musical-note' },
    ],
  },
  {
    title: 'ALSO ON RALLY',
    items: [
      { id: 'comedy', label: 'Comedy', icon: 'happy' },
      { id: 'dance', label: 'Dance', icon: 'body' },
      { id: 'acting', label: 'Acting and skits', icon: 'film' },
      { id: 'visual-art', label: 'Visual art', icon: 'color-palette' },
      { id: 'fitness', label: 'Fitness', icon: 'barbell' },
      { id: 'preaching', label: 'Preaching and teaching', icon: 'book' },
    ],
  },
];

export default function SetupSpecialtyScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const { click } = useSounds();

  const [query, setQuery] = useState('');
  const [primary, setPrimary] = useState<string | null>(null);
  const [secondaries, setSecondaries] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('rally.specialties');
        if (raw) {
          const p = JSON.parse(raw);
          setPrimary(p.primary || null);
          setSecondaries(p.secondaries || []);
        }
      } catch { /* fresh */ }
    })();
  }, []);

  const q = query.trim().toLowerCase();
  const groups = useMemo(
    () =>
      CATALOG.map((g) => ({
        ...g,
        items: q ? g.items.filter((i) => i.label.toLowerCase().indexOf(q) > -1) : g.items,
      })).filter((g) => g.items.length > 0),
    [q]
  );

  function toggle(id: string) {
    impact('light');
    click();
    if (primary === id) {
      setPrimary(null);
      return;
    }
    if (secondaries.indexOf(id) > -1) {
      setSecondaries(secondaries.filter((s) => s !== id));
      return;
    }
    if (!primary) {
      setPrimary(id);
      return;
    }
    if (secondaries.length < 3) {
      setSecondaries(secondaries.concat(id));
    }
  }

  async function next() {
    if (!primary) return;
    impact('medium');
    try {
      await AsyncStorage.setItem('rally.specialties', JSON.stringify({ primary, secondaries }));
    } catch { /* local only */ }
    router.push('/verify-identity');
  }

  const all = CATALOG.flatMap((g) => g.items);
  const labelOf = (id: string) => (all.find((i) => i.id === id) || { label: id }).label;

  return (
    <SwipeBack>
      <Screen>
        {/* Progress header */}
        <View style={styles.progressRow}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.bar, i < 2 ? { backgroundColor: GOLD } : { backgroundColor: colors.border }]} />
          ))}
          <Text style={[styles.stepText, { color: colors.muted }]}>2 of 4</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
          <Text style={[styles.h1, { color: colors.text }]}>What do you do?</Text>
          <Text style={[styles.sub, { color: colors.muted }]}>
            This places you next to Favorites like you. Your page can be live in about 10 minutes.
          </Text>

          {/* Search */}
          <View style={[styles.search, { borderColor: GOLD, backgroundColor: colors.surface }]}>
            <Ionicons name="search" size={18} color={colors.muted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search specialties"
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
            />
          </View>

          {groups.map((g) => (
            <View key={g.title}>
              <Text style={[styles.groupTitle, { color: colors.muted }]}>{g.title}</Text>
              {g.items.map((item, idx) => {
                const isPrimary = primary === item.id;
                const isSecondary = secondaries.indexOf(item.id) > -1;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => toggle(item.id)}
                    style={[
                      styles.row,
                      idx < g.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                    ]}
                    accessibilityLabel={item.label}
                  >
                    <View style={[styles.iconBox, { backgroundColor: colors.surfaceElevated }]}>
                      <Ionicons name={item.icon} size={18} color={isPrimary || isSecondary ? GOLD : colors.muted} />
                    </View>
                    <Text style={[styles.rowLabel, { color: colors.text }]}>{item.label}</Text>
                    {isPrimary ? (
                      <View style={[styles.pill, { backgroundColor: GOLD + '22', borderColor: GOLD }]}>
                        <Text style={{ color: GOLD, fontWeight: '900', fontSize: 11, letterSpacing: 0.6 }}>PRIMARY</Text>
                      </View>
                    ) : isSecondary ? (
                      <Text style={{ color: TEAL, fontWeight: '800', fontSize: 15 }}>Secondary</Text>
                    ) : (
                      <Ionicons name="add" size={22} color={colors.muted} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}

          {primary ? (
            <Text style={[styles.selection, { color: colors.muted }]}>
              {labelOf(primary) + (secondaries.length ? ' \u00b7 ' + secondaries.map(labelOf).join(', ') : '')}
            </Text>
          ) : null}

          {/* Note */}
          <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Ionicons name="shield-checkmark" size={16} color={TEAL} />
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              Pick one primary specialty and up to three more. You get a separate ranking in each.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <GradientButton
            label="Continue"
            onPress={next}
            disabled={!primary}
            accessibilityLabel="Continue"
          />
        </View>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.lg },
  bar: { flex: 1, height: 5, borderRadius: 3 },
  stepText: { fontSize: 14, fontWeight: '800' },
  h1: { fontSize: 34, fontWeight: '900', marginBottom: 10 },
  sub: { fontSize: 16, lineHeight: 23, marginBottom: spacing.md },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    minHeight: 54,
    marginBottom: spacing.md,
  },
  searchInput: { flex: 1, fontSize: 16 },
  groupTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 0.8, marginTop: spacing.md, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  iconBox: { width: 44, height: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 17, fontWeight: '800' },
  pill: { borderWidth: 1.5, borderRadius: radii.full, paddingHorizontal: 12, paddingVertical: 6 },
  selection: { fontSize: 13, marginTop: spacing.sm, lineHeight: 18 },
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
  footer: { paddingTop: spacing.sm },
});
