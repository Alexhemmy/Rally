/** Follow Favorites - Rally design (screen 57)
 * Step 5 of 6. Suggestions from /api/discover/trending grouped by
 * category, with a static fallback when the garden is empty.
 * Follow via POST /api/users/:handle/follow. Continue needs 3+.
 */
import { useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GradientButton } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { spacing, radii, type as typo } from '@/constants/theme';
import { api } from '@/lib/api';

const GOLD = '#FFA726';

const FALLBACK = [
  { group: 'Gospel', people: [
    { handle: 'mia_adebayo', name: 'Mia Adebayo', tag: 'Worship leader \u00b7 Lagos' },
    { handle: 'chinedu_hall', name: 'Chinedu Hall', tag: 'Gospel choir \u00b7 Enugu' },
  ] },
  { group: 'Afrobeats', people: [
    { handle: 'ada_nwosu', name: 'Ada Nwosu', tag: 'Singer and songwriter \u00b7 Abuja' },
    { handle: 'kayode_b', name: 'Kayode B', tag: 'Producer \u00b7 Ibadan' },
  ] },
  { group: 'Comedy', people: [
    { handle: 'tunde_jokes', name: 'Tunde Jokes', tag: 'Skits in Yoruba \u00b7 Ibadan' },
  ] },
];

function Bar() {
  return (
    <View style={styles.track}>
      <View style={{ flex: 0.83, backgroundColor: GOLD, borderRadius: 2 }} />
      <View style={{ flex: 0.17 }} />
    </View>
  );
}

export default function FollowFavoritesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name: string }>();
  const { impact } = useHaptics();
  const { success } = useSounds();
  const [groups, setGroups] = useState<any[]>(FALLBACK);
  const [followed, setFollowed] = useState<Record<string, boolean>>({});
  const [count, setCount] = useState(0);

  useEffect(() => {
    api('/api/discover/trending')
      .then((r: any) => {
        const trending = (r.trending || []) as any[];
        if (!trending.length) return;
        const byGroup: Record<string, any[]> = {};
        trending.forEach((f) => {
          const g = f.category || f.industry || 'Suggestions';
          if (!byGroup[g]) byGroup[g] = [];
          byGroup[g].push({
            handle: f.handle,
            name: f.displayName,
            tag: [f.category, f.supporterCount ? f.supporterCount + ' supporters' : null].filter(Boolean).join(' \u00b7 '),
          });
        });
        setGroups(Object.keys(byGroup).map((g) => ({ group: g, people: byGroup[g] })));
      })
      .catch(() => {});
  }, []);

  function toggleFollow(p: any) {
    impact('light');
    const was = !!followed[p.handle];
    setFollowed((f) => ({ ...f, [p.handle]: !was }));
    setCount((c) => (was ? Math.max(0, c - 1) : c + 1));
    if (!was) {
      api(('/api/users/' + p.handle + '/follow'), { method: 'POST', body: JSON.stringify({}) }).catch(() => {});
    }
  }

  function next(skip: boolean) {
    impact('medium');
    if (!skip) success();
    router.replace(('/spending-safety?name=' + (name || '')) as any);
  }

  const initials = (n: string) => n.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <SwipeBack pullDown>
      <Screen>
        <Bar />
        <Text style={[styles.h1, { color: colors.text }]}>Follow a few Favorites</Text>
        <Text style={[styles.sub, { color: colors.muted }]}>Based on Gospel, Afrobeats and Comedy. Pick at least 3 to fill your Home.</Text>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
          {groups.map((g) => (
            <View key={g.group} style={{ marginBottom: spacing.lg }}>
              <Text style={[styles.group, { color: colors.muted }]}>{g.group.toUpperCase()}</Text>
              {g.people.map((p: any) => (
                <View key={p.handle} style={[styles.row, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <View style={[styles.mini, { backgroundColor: 'rgba(255,167,38,0.2)' }]}>
                    <Text style={{ color: GOLD, fontWeight: '900', fontSize: 13 }}>{initials(p.name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>{p.name}</Text>
                    <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{p.tag}</Text>
                  </View>
                  <Pressable
                    onPress={() => toggleFollow(p)}
                    style={[styles.followBtn, followed[p.handle] ? { backgroundColor: colors.surface, borderColor: colors.border } : { backgroundColor: GOLD, borderColor: 'transparent' }]}
                  >
                    <Text style={{ color: followed[p.handle] ? colors.muted : '#111', fontWeight: '800', fontSize: 13 }}>
                      {followed[p.handle] ? 'Following' : 'Follow'}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ))}

          <Text style={[styles.note, { color: colors.muted }]}>Suggestions use your interests and language, never what you spend.</Text>
          <Text style={[styles.progress, { color: GOLD }]}>{count} followed</Text>

          <GradientButton label={'Continue'} onPress={() => next(false)} disabled={count < 3} fullWidth />
          <View style={{ marginTop: 12 }} />
          <GradientButton label={'Skip for now'} variant={'ghost'} onPress={() => next(true)} fullWidth />
        </ScrollView>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', height: 4, borderRadius: 2, backgroundColor: 'rgba(128,128,128,0.25)', marginBottom: spacing.lg },
  h1: { ...typo.h1, marginBottom: 4 },
  sub: { fontSize: 13, lineHeight: 19, marginBottom: spacing.lg },
  group: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: radii.lg, padding: 12, marginBottom: 10 },
  mini: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  followBtn: { borderWidth: 2, borderRadius: radii.full, paddingHorizontal: 16, paddingVertical: 8 },
  note: { fontSize: 12, lineHeight: 17, marginBottom: 10 },
  progress: { fontWeight: '900', fontSize: 14, marginBottom: spacing.lg },
});
