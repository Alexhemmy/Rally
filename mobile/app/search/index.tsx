import { useState } from 'react';
import { Text, StyleSheet, View, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SoundTextInput } from '@/components/SoundTextInput';
import { colors, spacing, radii } from '@/constants/theme';
import { useSounds } from '@/hooks/useSounds';
import { SwipeBack } from '@/components/SwipeBack';

export default function SearchScreen() {
  const [q, setQ] = useState('');
  const { click } = useSounds();
  const suggestions = [
    { handle: 'mia', label: 'Mia · Afrobeats' },
  ].filter((s) => !q || s.handle.includes(q.toLowerCase()) || s.label.toLowerCase().includes(q.toLowerCase()));

  return (
    <SwipeBack>
      <Screen>
        <Text style={styles.h1}>Search</Text>
        <Text style={styles.muted}>Name, handle, category</Text>
        <SoundTextInput
          style={styles.input}
          placeholder="Search Favorites..."
          placeholderTextColor={colors.muted}
          value={q}
          onChangeText={setQ}
          autoCapitalize="none"
        />
        <View style={styles.card}>
          {suggestions.map((s) => (
            <Link key={s.handle} href={('/favorite/' + s.handle) as any} asChild>
              <Pressable style={styles.row} onPress={() => click()}>
                <Text style={styles.name}>{s.label}</Text>
                <Text style={styles.muted}>></Text>
              </Pressable>
            </Link>
          ))}
          {suggestions.length === 0 && <Text style={styles.muted}>No matches. Try mia</Text>}
        </View>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  muted: { color: colors.muted, marginBottom: 8, fontSize: 14 },
  name: { color: colors.text, fontWeight: '600', fontSize: 16 },
  input: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md,
    padding: 14, color: colors.text, marginBottom: 12, minHeight: 48, fontSize: 16,
  },
  card: {
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1,
    borderColor: colors.border, padding: spacing.md,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
});
