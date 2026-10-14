import { View, Text, StyleSheet, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import { colors, spacing, radii } from '@/constants/theme';

const CATS = ['Music', 'Sports', 'Comedy', 'Gaming', 'Artisans', 'Writers', 'Film & TV'];

export default function Explore() {
  const { width } = useWindowDimensions();
  const cols = width >= 600 ? 3 : 2;

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <Text style={styles.h1}>Explore</Text>
      <Text style={styles.muted}>Browse by industry · responsive grid</Text>
      <View style={[styles.grid, { gap: 10 }]}>
        {CATS.map((c) => (
          <View key={c} style={[styles.chip, { width: `${100 / cols - 2}%` as any }]}>
            <Text style={styles.chipText}>{c}</Text>
          </View>
        ))}
      </View>
      <View style={styles.card}>
        <Text style={styles.h2}>Featured</Text>
        <Link href="/favorite/mia" asChild>
          <Pressable style={styles.row}>
            <View>
              <Text style={styles.name}>Mia</Text>
              <Text style={styles.muted}>@mia · Afrobeats</Text>
            </View>
            <Text style={styles.link}>Open</Text>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: spacing.md, paddingBottom: 40 },
  h1: { fontSize: 24, fontWeight: '700', color: colors.text },
  h2: { fontSize: 16, fontWeight: '600', color: colors.primaryHover, marginBottom: 8 },
  muted: { color: colors.muted, marginBottom: 16, fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 14,
    marginBottom: 8,
    minWidth: '46%',
    flexGrow: 1,
  },
  chipText: { color: colors.text, fontWeight: '600' },
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
