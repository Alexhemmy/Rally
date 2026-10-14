import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '@/components/Screen';
import { colors, spacing, radii, useLayout } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';

const CATS = ['Music', 'Sports', 'Comedy', 'Gaming', 'Artisans', 'Writers', 'Film & TV', 'Dance'];

export default function ExploreTab() {
  const { columns, isTablet } = useLayout();
  const { impact } = useHaptics();
  const widthPct = columns === 3 ? '31%' : '48%';

  return (
    <Screen>
      <Text style={styles.h1}>Explore</Text>
      <Text style={styles.muted}>Grid adapts: 2 cols phone · 3 tablet</Text>
      <View style={styles.grid}>
        {CATS.map((c) => (
          <Pressable
            key={c}
            onPress={() => impact('light')}
            style={[styles.chip, { width: widthPct as any, minWidth: isTablet ? 140 : 0 }]}
          >
            <Text style={styles.chipText}>{c}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.card}>
        <Text style={styles.h2}>Featured</Text>
        <Link href="/favorite/mia" asChild>
          <Pressable style={styles.row} onPress={() => impact('medium')}>
            <View>
              <Text style={styles.name}>Mia</Text>
              <Text style={styles.muted}>@mia · Afrobeats</Text>
            </View>
            <Text style={styles.link}>Open</Text>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  h2: { fontSize: 16, fontWeight: '600', color: colors.primaryHover, marginBottom: 8 },
  muted: { color: colors.muted, marginBottom: 16, fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16, justifyContent: 'space-between' },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  chipText: { color: colors.text, fontWeight: '600', textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: colors.text, fontWeight: '700', fontSize: 16 },
  link: { color: colors.primary, fontWeight: '700' },
});
