/** Search
 * Find Favorites by name, handle, or category — live results from /api/discover/search.
 */
import { useEffect, useState, useCallback } from 'react';
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
import { api } from '@/lib/api';

type Favorite = {
  handle: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  favoriteProfile?: {
    supporterCount?: number;
    verificationStatus?: string;
    category?: { name?: string } | null;
  } | null;
};

type Specialty = {
  id: string;
  slug: string;
  name: string;
  category?: string | null;
  industry?: string | null;
};

export default function SearchScreen() {
  const { colors } = useTheme();
  const { click } = useSounds();
  const { impact } = useHaptics();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(false);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setFavorites([]);
      setSpecialties([]);
      return;
    }
    setLoading(true);
    try {
      const r = await api<{ favorites: Favorite[]; specialties: Specialty[] }>(
        '/api/discover/search?q=' + encodeURIComponent(q.trim())
      );
      setFavorites(r.favorites || []);
      setSpecialties(r.specialties || []);
    } catch {
      // offline
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 350);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  const noResults = query.trim().length > 0 && !loading && favorites.length === 0 && specialties.length === 0;

  return (
    <SwipeBack>
      <Screen>
        <Text style={[styles.h1, { color: colors.text }]}>Search</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Name, handle, or category
        </Text>

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

        {noResults ? (
          <EmptyState
            icon="search-outline"
            title="No matches"
            body={'No results for "' + query + '". Try a different name or handle.'}
          />
        ) : query.trim().length === 0 ? (
          <EmptyState
            icon="search-outline"
            title="Find Favorites"
            body="Start typing to search by name, handle, or category."
          />
        ) : (
          <View style={{ gap: 16 }}>
            {favorites.length > 0 && (
              <GlassCard padded={false} style={{ marginTop: 4 }}>
                {favorites.map((item, index) => (
                  <Pressable
                    key={item.handle}
                    onPress={() => {
                      click();
                      impact('light');
                      router.push('/favorite/' + item.handle);
                    }}
                    style={({ pressed }) => [
                      styles.row,
                      {
                        borderBottomWidth: index < favorites.length - 1 ? StyleSheet.hairlineWidth : 0,
                        borderBottomColor: colors.border,
                        backgroundColor: pressed ? colors.surfaceHover : 'transparent',
                      },
                    ]}
                  >
                    <Avatar uri={item.avatarUrl} name={item.displayName || item.handle} size={42} ring />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.name, { color: colors.text }]}>
                        {item.displayName || item.handle}
                      </Text>
                      <Text style={{ color: colors.muted, fontSize: 13 }}>
                        @{item.handle}
                        {item.favoriteProfile?.category?.name ? ' · ' + item.favoriteProfile.category.name : ''}
                      </Text>
                    </View>
                    <Text style={{ color: colors.primary, fontSize: 18 }}>›</Text>
                  </Pressable>
                ))}
              </GlassCard>
            )}

            {specialties.length > 0 && (
              <View>
                <Text style={{ color: colors.muted, fontWeight: '700', marginBottom: 8, fontSize: 13 }}>
                  CATEGORIES & SPECIALTIES
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {specialties.map((s) => (
                    <Pressable
                      key={s.id}
                      onPress={() => {
                        click();
                        setQuery(s.name);
                      }}
                      style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.bg }]}
                    >
                      <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>{s.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>
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
  chip: {
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
