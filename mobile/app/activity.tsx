/** Activity (mock 09) - Watched / Liked / Comments.
 * Private activity history. There is no watch-history or per-user
 * like/comment lookup on the backend yet, so the three lists are
 * kept on this device (rally.watchHistory, rally.likedItems,
 * rally.myComments) and the privacy note says only you can see it.
 * Clear watch history wipes the active list for real.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, Alert } from 'react-native';
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
const TEAL = '#34D399';

const GRADS: [string, string][] = [
  ['#D95F02', '#F59E0B'],
  ['#3B4FE0', '#8B5CF6'],
  ['#E9355B', '#FF8A3D'],
  ['#0E7490', '#2DD4BF'],
];

type Item = { id: string; title: string; host: string; at: number };

const KEYS: Record<string, string> = {
  Watched: 'rally.watchHistory',
  Liked: 'rally.likedItems',
  Comments: 'rally.myComments',
};

function when(at: number): string {
  const d = new Date(at);
  const today = new Date().toDateString() === d.toDateString();
  if (today) return 'Today';
  const yest = new Date(Date.now() - 86400000).toDateString() === d.toDateString();
  if (yest) return 'Yesterday';
  const days = Math.floor((Date.now() - at) / 86400000);
  if (days < 7) return days + ' days ago';
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

export default function ActivityScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();

  const [tab, setTab] = useState<'Watched' | 'Liked' | 'Comments'>('Watched');
  const [items, setItems] = useState<Item[]>([]);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(KEYS[tab]);
      setItems(raw ? JSON.parse(raw) : []);
    } catch { setItems([]); }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  function clear() {
    impact('medium');
    Alert.alert(
      'Clear ' + tab.toLowerCase() + (tab === 'Watched' ? ' history' : ' list'),
      'This removes everything in ' + tab + ' from this phone. It cannot be undone.',
      [
        { text: 'Keep', style: 'cancel' as const },
        {
          text: 'Clear',
          style: 'destructive' as const,
          onPress: () => {
            AsyncStorage.setItem(KEYS[tab], JSON.stringify([])).catch(() => undefined);
            setItems([]);
            impact('success');
          },
        },
      ]
    );
  }

  function removeOne(it: Item) {
    impact('light');
    Alert.alert('Remove', 'Remove "' + it.title + '" from ' + tab + '?', [
      { text: 'Cancel', style: 'cancel' as const },
      {
        text: 'Remove',
        style: 'destructive' as const,
        onPress: () => {
          const next = items.filter((x) => x.id !== it.id);
          setItems(next);
          AsyncStorage.setItem(KEYS[tab], JSON.stringify(next)).catch(() => undefined);
        },
      },
    ]);
  }

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Activity</Text>
          <View style={{ width: 26 }} />
        </View>

        <View style={[styles.tabs, { backgroundColor: colors.surfaceElevated }]}>
          {(['Watched', 'Liked', 'Comments'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => { impact('light'); setTab(t); }}
              style={[styles.tabBtn, tab === t && { backgroundColor: colors.bg, borderRadius: radii.md }]}
              accessibilityLabel={t}
            >
              <Text style={{ color: tab === t ? colors.text : colors.muted, fontWeight: '900', fontSize: 16 }}>{t}</Text>
            </Pressable>
          ))}
        </View>

        {items.length === 0 ? (
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: spacing.lg, textAlign: 'center' }}>
            {tab === 'Watched'
              ? 'Your watch history starts filling as you watch Moments and lives.'
              : tab === 'Liked'
                ? 'Moments and posts you like show up here.'
                : 'Comments you write show up here.'}
          </Text>
        ) : (
          <View>
            {items.map((it, i) => (
              <View key={it.id} style={[styles.row, i < items.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                <LinearGradient colors={GRADS[i % GRADS.length]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.thumb}>
                  <Ionicons name="play" size={22} color="rgba(255,255,255,0.9)" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ color: colors.text, fontWeight: '900', fontSize: 18 }}>{it.title}</Text>
                  <Text style={{ color: colors.muted, fontSize: 15, marginTop: 2 }}>{(it.host || 'Rally') + ' \u00b7 ' + when(it.at)}</Text>
                </View>
                <Pressable onPress={() => removeOne(it)} hitSlop={8} accessibilityLabel="More">
                  <Ionicons name="ellipsis-horizontal" size={20} color={colors.muted} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Ionicons name="eye-outline" size={18} color={TEAL} />
          <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 21, flex: 1, marginLeft: 12 }}>
            Only you can see this. It helps tune your feed, and you can clear it any time.
          </Text>
        </View>

        <View style={{ marginTop: 'auto', paddingTop: spacing.lg }}>
          <Pressable onPress={clear} accessibilityLabel="Clear history">
            <LinearGradient colors={[GOLD, '#FF8A3D'] as [string, string]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.clearBtn}>
              <Text style={{ color: '#1A1206', fontWeight: '900', fontSize: 18 }}>
                {tab === 'Watched' ? 'Clear watch history' : 'Clear ' + tab.toLowerCase() + ' list'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.sm },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  tabs: { flexDirection: 'row', borderRadius: radii.lg, padding: 4, marginBottom: spacing.sm },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  thumb: { width: 64, height: 84, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  note: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radii.lg, padding: 14, marginTop: spacing.md },
  clearBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: radii.full },
});
