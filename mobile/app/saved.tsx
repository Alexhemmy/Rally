/** Saved (mock 08).
 * All / Moments / Posts / Sounds chips over a two-column gradient
 * grid. Saved items are kept on this device (rally.saved) - there is
 * no bookmarks endpoint on the backend yet, so the empty state says
 * where the save action lives and the grid renders what you saved.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#FFA726';

const CHIPS = ['All', 'Moments', 'Posts', 'Sounds'];

const GRADS: [string, string][] = [
  ['#8E3B5E', '#F59E0B'],
  ['#D95F02', '#F97316'],
  ['#3B4FE0', '#8B5CF6'],
  ['#0E7490', '#2DD4BF'],
  ['#BE123C', '#FB7185'],
  ['#6D28D9', '#A78BFA'],
];

type SavedItem = { id: string; type: string; title: string; at: number };

export default function SavedScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();

  const [chip, setChip] = useState('All');
  const [items, setItems] = useState<SavedItem[]>([]);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem('rally.saved');
      if (raw) setItems(JSON.parse(raw));
    } catch { /* fresh */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const shown = chip === 'All' ? items : items.filter((i) => i.type === chip.slice(0, -1));

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Saved</Text>
          <View style={{ width: 26 }} />
        </View>

        <View style={styles.chipRow}>
          {CHIPS.map((c) => {
            const on = chip === c;
            return (
              <Pressable
                key={c}
                onPress={() => { impact('light'); setChip(c); }}
                style={[styles.chip, { borderColor: on ? GOLD : 'transparent', backgroundColor: on ? colors.bg : colors.surfaceElevated }]}
                accessibilityLabel={c}
              >
                <Text style={{ color: on ? GOLD : colors.text, fontWeight: '800', fontSize: 15 }}>{c}</Text>
              </Pressable>
            );
          })}
        </View>

        {shown.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 60, paddingHorizontal: 30, gap: 8 }}>
            <Ionicons name="bookmark-outline" size={36} color={GOLD} />
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 18 }}>Nothing saved yet</Text>
            <Text style={{ color: colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 21 }}>
              Use the menu on a Moment, post or sound to save it here. Saves are kept on this phone for now.
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.grid}>
              {shown.map((it, i) => (
                <LinearGradient key={it.id} colors={GRADS[i % GRADS.length]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tile}>
                  <View style={styles.tileType}>
                    <Text style={{ color: '#fff', fontWeight: '900', fontSize: 11, letterSpacing: 0.5 }}>{it.type.toUpperCase()}</Text>
                  </View>
                  <Text numberOfLines={2} style={{ color: '#fff', fontWeight: '900', fontSize: 16, marginTop: 'auto' }}>{it.title}</Text>
                </LinearGradient>
              ))}
            </View>
          </ScrollView>
        )}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.sm },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  chipRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: spacing.md },
  chip: { borderWidth: 1.5, borderRadius: radii.full, paddingHorizontal: 18, paddingVertical: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { width: '47.5%', height: 190, borderRadius: 16, padding: 12 },
  tileType: { alignSelf: 'flex-start', backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 4 },
});
