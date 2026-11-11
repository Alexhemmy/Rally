/** Level Progress (mock 06) - "Your level".
 * Level card uses the real /api/badges level for a Favorite (name,
 * progress percent, next tier) - the backend does not expose raw
 * point totals yet, so the bar shows the real percent. HOW YOU EARN
 * POINTS lists the four ways with points tracked on this device
 * (rally.pointTally); per-activity server tracking arrives with
 * scoring v2. Spending Tokens never earns points - the note says so.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#FFA726';
const TEAL = '#34D399';

type Level = { name: string; progress: number; next: string | null };

const WAYS = [
  { icon: 'play-circle-outline', title: 'Watch and react', rule: 'Up to 20 a day', key: 'watch' },
  { icon: 'chatbubble-outline', title: 'Join threads', rule: 'Helpful replies earn more', key: 'threads' },
  { icon: 'calendar-outline', title: 'Show up daily', rule: 'Streak days', key: 'streak' },
  { icon: 'people-outline', title: 'Report and vote fairly', rule: 'Fair play points', key: 'fairplay' },
];

export default function LevelProgressScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { handle } = useLocalSearchParams<{ handle?: string }>();

  const [level, setLevel] = useState<Level | null>(null);
  const [favName, setFavName] = useState('');
  const [tally, setTally] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    const h = handle || null;
    if (h && getToken()) {
      try {
        const b = await api<{ level: Level; favorite: { displayName: string } }>('/api/badges/' + h);
        setLevel(b.level || null);
        if (b.favorite) setFavName(b.favorite.displayName);
      } catch { /* offline */ }
    }
    try {
      const raw = await AsyncStorage.getItem('rally.pointTally');
      if (raw) setTally(JSON.parse(raw));
    } catch { /* fresh */ }
  }, [handle]);

  useEffect(() => { load(); }, [load]);

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Your level</Text>
          <View style={{ width: 26 }} />
        </View>

        <View style={styles.center}>
          <View style={[styles.trophyTile, { backgroundColor: GOLD }]}>
            <Ionicons name="trophy-outline" size={44} color="#1A1206" />
          </View>
          {level ? (
            <>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 32, marginTop: 18 }}>{level.name}</Text>
              <Text style={{ color: colors.muted, fontSize: 17, marginTop: 4 }}>
                {level.next
                  ? level.progress + '% of the way to ' + level.next
                  : 'Top level reached' + (favName ? ' with ' + favName : '')}
              </Text>
              <View style={[styles.bar, { backgroundColor: colors.border }]}>
                <View style={{ width: Math.round(level.progress) + '%', height: '100%', borderRadius: 4, backgroundColor: GOLD }} />
              </View>
            </>
          ) : (
            <>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 26, marginTop: 18 }}>Support a Favorite</Text>
              <Text style={{ color: colors.muted, fontSize: 15, textAlign: 'center', marginTop: 6, lineHeight: 21 }}>
                Open a Favorite page and tap Badges to see your level there. Levels are set by each Favorite.
              </Text>
            </>
          )}
        </View>

        <Text style={[styles.section, { color: colors.muted }]}>HOW YOU EARN POINTS</Text>
        <View style={[styles.list, { borderColor: colors.border }]}>
          {WAYS.map((w, i) => (
            <View key={w.key} style={[styles.wayRow, i < WAYS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={[styles.wayIcon, { backgroundColor: colors.surfaceElevated || colors.bg }]}>
                <Ionicons name={w.icon as any} size={20} color={GOLD} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 }}>{w.title}</Text>
                <Text style={{ color: colors.muted, fontSize: 14, marginTop: 2 }}>{w.rule}</Text>
              </View>
              <Text style={{ color: TEAL, fontWeight: '900', fontSize: 18 }}>{'+' + Math.round(tally[w.key] || 0)}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.note, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="shield-checkmark-outline" size={20} color={TEAL} />
          <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 21, flex: 1, marginLeft: 12 }}>
            Spending Tokens earns no points and never raises your level.
          </Text>
        </View>
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 10, lineHeight: 18 }}>
          Points shown are tracked on this phone. Server-side per-activity totals arrive with scoring v2.
        </Text>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.sm },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  center: { alignItems: 'center', paddingHorizontal: 20, paddingTop: spacing.md },
  trophyTile: { width: 110, height: 110, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  bar: { height: 8, borderRadius: 4, alignSelf: 'stretch', marginTop: 18, overflow: 'hidden' },
  section: { fontSize: 13, fontWeight: '900', letterSpacing: 0.8, marginTop: spacing.lg, marginBottom: 8 },
  list: { borderWidth: 1, borderRadius: radii.lg },
  wayRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15, paddingHorizontal: 14 },
  wayIcon: { width: 44, height: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  note: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radii.lg, padding: 16, marginTop: spacing.lg },
});
