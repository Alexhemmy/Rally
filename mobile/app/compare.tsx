/** Compare Favorites (mock 31) - side-by-side, same-field only.
 * Real data: GET /api/favorites/:handle per handle (supporter count).
 * Honest deviations: the backend has no compare endpoint yet, so only
 * supporter counts are real today; 30-day growth, repeat fans,
 * retention, moment engagement, fan poll and countries arrive with the
 * analytics backend, and Rally Scores come from the scoring service.
 * Money is never shown or ranked.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView, ActivityIndicator, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api } from '@/lib/api';

const GOLD = '#FFA726';
const TEAL = '#34D399';

const GRADS: [string, string][] = [
  ['#F59E0B', '#F0663F'],
  ['#22D3EE', '#0EA5E9'],
  ['#EC4899', '#A21CAF'],
];

type Fav = { handle: string; name: string; supporters: number };

function compact(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

function initials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function CompareScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { handles } = useLocalSearchParams<{ handles: string }>();
  const { impact } = useHaptics();

  const [favs, setFavs] = useState<Fav[]>([]);
  const [loading, setLoading] = useState(true);

  const list = String(handles || '').split(',').map((h) => h.trim()).filter(Boolean);

  const load = useCallback(async () => {
    const out: Fav[] = [];
    for (const h of list) {
      try {
        const r = await api<any>('/api/favorites/' + h, { skipAuth: true });
        const f = r.favorite || {};
        out.push({ handle: h, name: f.displayName || f.handle || h, supporters: Number(f.supporterCount || 0) });
      } catch { /* skip */ }
    }
    setFavs(out);
    setLoading(false);
  }, [handles]);

  useEffect(() => { load(); }, [load]);

  const max = Math.max(1, ...favs.map((f) => f.supporters));

  async function share() {
    impact('light');
    const line = favs.map((f) => f.name + ': ' + compact(f.supporters) + ' supporters').join(' \u00b7 ');
    try {
      await Share.share({ message: 'Rally comparison - ' + line + '. Money is never shown or ranked.' });
    } catch { /* dismissed */ }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={[styles.h1, { color: colors.text }]}>Compare</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Scope chips */}
      <View style={styles.scopeRow}>
        <View style={[styles.scopeChip, { borderColor: GOLD }]}>
          <Text style={{ color: GOLD, fontWeight: '800', fontSize: 14 }}>Same field</Text>
        </View>
        <View style={[styles.scopeChip, { backgroundColor: colors.surfaceElevated, borderColor: 'transparent' }]}>
          <Text style={{ color: colors.muted, fontWeight: '800', fontSize: 14 }}>30 days</Text>
        </View>
        <View style={[styles.scopeChip, { backgroundColor: colors.surfaceElevated, borderColor: 'transparent' }]}>
          <Text style={{ color: colors.muted, fontWeight: '800', fontSize: 14 }}>90 days</Text>
        </View>
      </View>

      {loading ? <ActivityIndicator color={GOLD} style={{ marginTop: 30 }} /> : null}

      {!loading && favs.length === 0 ? (
        <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>
          Pass handles to compare, e.g. from a ranking page. Only same-field Favorites can be compared.
        </Text>
      ) : null}

      {favs.length > 0 ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Avatars row */}
          <View style={styles.avatarsRow}>
            {favs.map((f, i) => (
              <View key={f.handle} style={styles.avatarCol}>
                <LinearGradient colors={GRADS[i % GRADS.length]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 20 }}>{initials(f.name)}</Text>
                </LinearGradient>
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14, marginTop: 8 }} numberOfLines={1}>
                  {f.name}
                </Text>
              </View>
            ))}
          </View>

          {/* Supporters row (real) */}
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: colors.muted }]}>Supporters</Text>
            {favs.map((f, i) => (
              <Text key={f.handle} style={[styles.metricValue, { color: i === 0 ? GOLD : colors.text, flex: 1, textAlign: 'center' }]}>
                {compact(f.supporters)}
              </Text>
            ))}
          </View>

          {/* Rally-style bars (share of supporters) */}
          <Text style={[styles.section, { color: colors.muted }]}>SUPPORTER SHARE</Text>
          {favs.map((f, i) => (
            <View key={f.handle} style={styles.barRow}>
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15, width: 90 }} numberOfLines={1}>{f.name}</Text>
              <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
                <View style={[styles.barFill, { width: Math.round((f.supporters / max) * 100) + '%', backgroundColor: GRADS[i % GRADS.length][0] }]} />
              </View>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 15, width: 44, textAlign: 'right' }}>
                {Math.round((f.supporters / max) * 100)}
              </Text>
            </View>
          ))}

          {/* Fairness note */}
          <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Ionicons name="shield-checkmark-outline" size={16} color={TEAL} />
            <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20, flex: 1 }}>
              Updated from live supporter counts. Money is never shown or ranked, and only same-field Favorites can be compared. Growth, retention and fan-poll metrics arrive with the analytics backend.
            </Text>
          </View>

          {/* Share */}
          <Pressable onPress={share} style={[styles.shareBtn, { backgroundColor: colors.surfaceElevated }]} accessibilityLabel="Share comparison card">
            <Ionicons name="share-social-outline" size={20} color={colors.text} />
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16, marginLeft: 10 }}>Share comparison card</Text>
          </Pressable>
        </ScrollView>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 20, fontWeight: '900', flex: 1, textAlign: 'center' },
  scopeRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.md },
  scopeChip: { borderWidth: 1.5, borderRadius: radii.full, paddingHorizontal: 18, paddingVertical: 10 },
  avatarsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.sm, marginBottom: spacing.md },
  avatarCol: { alignItems: 'center', flex: 1 },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  metricLabel: { fontSize: 15, width: 110 },
  metricValue: { fontWeight: '900', fontSize: 17 },
  section: { fontSize: 13, fontWeight: '900', letterSpacing: 1, marginTop: spacing.lg, marginBottom: 10 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  barTrack: { flex: 1, height: 10, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5 },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 14,
    marginTop: spacing.md,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    paddingVertical: 18,
    marginTop: spacing.md,
  },
});
