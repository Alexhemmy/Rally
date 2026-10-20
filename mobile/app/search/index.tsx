/** Search
 * Find Favorites by name, handle, or category.
 */
import { useState } from 'react';
import { Text, StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GlassCard, Avatar, EmptyState } from '@/components/ui';
import { SoundTextInput } from '@/components/SoundTextInput';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, radii, type as typo } from '@/constants/theme';
import { useSounds } from '@/hooks/useSounds';
import { useHaptics } from '@/hooks/useHaptics';

const SUGGESTIONS = [
  { handle: 'mia', label: 'Mia', category: 'Afrobeats' },
  // Add more demo suggestions as needed
];

export default function SearchScreen() {
  const { colors } = useTheme();
  const { click } = useSounds();
  const { impact } = useHaptics();
  const router = useRouter();

  const [query, setQuery] = useState('');

  const results = SUGGESTIONS.filter(
    (s) =>
      !query ||
      s.handle.includes(query.toLowerCase()) ||
      s.label.toLowerCase().includes(query.toLowerCase()) ||
      s.category.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <SwipeBack>
      <Screen>
        {/* Header */}
        <Text style={[styles.h1, { color: colors.text }]}>Search</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Name, handle, or category
        </Text>

        {/* Search input */}
        <SoundTextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.bg,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          placeholder="Search Favorites..."
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />

        {/* Results */}
        {results.length === 0 ? (
          <EmptyState
            icon="search-outline"
            title="No matches"
            body={query ? `No results for “${query}”. Try “mia”.` : 'Start typing to find Favorites.'}
          />
        ) : (
          <GlassCard padded={false} style={{ marginTop: 4 }}>
            {results.map((item, index) => (
              <Pressable
                key={item.handle}
                onPress={() => {
                  click();
                  impact('light');
                  router.push(`/favorite/${item.handle}`);
                }}
                style={({ pressed }) => [
                  styles.row,
                  {
                    borderBottomWidth: index < results.length - 1 ? StyleSheet.hairlineWidth : 0,
                    borderBottomColor: colors.border,
                    backgroundColor: pressed ? colors.surfaceHover : 'transparent',
                  },
                ]}
              >
                <Avatar name={item.label} size={42} ring />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.name, { color: colors.text }]}>
                    {item.label}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 13 }}>
                    @{item.handle} · {item.category}
                  </Text>
                </View>
                <Text style={{ color: colors.primary, fontSize: 18 }}>›</Text>
              </Pressable>
            ))}
          </GlassCard>
        )}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: {
    ...typo.h1,
    marginTop: spacing.sm,
    marginBottom: 6,
  },
  subtitle: {
    ...typo.body,
    marginBottom: spacing.md,
    lineHeight: 21,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: spacing.md,
    minHeight: 52,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  name: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 2,
  },
});
