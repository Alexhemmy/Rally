/** Rivalry Hub (mock 28) + Join the Rivalry sheet (mock 29).
 * Real rivalry from GET /api/rivalries (matched by id): VS card with
 * opt-in pill, heat level segments, summary, and open Face-Offs linking
 * to the Face-Off screen. Honest deviations: the backend has no fan-side
 * join or per-side stats (supporters, growth, repeat fans) and no banter
 * channel yet, so Join saves your heat preference on this device, stats
 * are omitted with a note, and Banter Channel says it arrives with
 * Community Chat. Start Face-Off is for the two rivals (server rule).
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, Modal, ScrollView, ActivityIndicator, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const TEAL = '#34D399';
const HEAT_COLORS = ['#22D3EE', '#84CC16', '#FBBF24', '#F59E0B', '#EF4444'];
const HEAT_LABELS = ['Calm', 'Mild', 'Warm', 'Heating up', 'Cooling off'];

type FaceOff = { id: string; question: string; votesA: number; votesB: number; closesAt: string };
type Rivalry = {
  id: string;
  favoriteA: { id: string; name: string | null };
  favoriteB: { id: string; name: string | null };
  status: string;
  heatLevel: number;
  summary: string | null;
  optInA: boolean;
  optInB: boolean;
  faceOffs: FaceOff[];
};

const HEATS = [
  { key: 'friendly', label: 'Friendly', sub: 'Light banter' },
  { key: 'spicy', label: 'Spicy', sub: 'Cheeky jabs' },
  { key: 'fierce', label: 'Fierce', sub: 'Full contest' },
];

function initials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function RivalryHubScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { impact } = useHaptics();

  const [r, setR] = useState<Rivalry | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState(false);
  const [heat, setHeat] = useState('friendly');
  const [joined, setJoined] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api<{ rivalries: Rivalry[] }>('/api/rivalries', { skipAuth: true });
      setR((res.rivalries || []).find((x) => x.id === id) || null);
    } catch { /* offline */ }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    AsyncStorage.multiGet(['rally.rivalryHeat', 'rally.rivalryJoined:' + id])
      .then((v: [string, string | null][]) => {
        if (v[0] && v[0][1]) setHeat(v[0][1]);
        if (v[1] && v[1][1]) setJoined(v[1][1]);
      })
      .catch(() => {});
  }, [id]);

  function joinRivalry() {
    impact('medium');
    AsyncStorage.multiSet([['rally.rivalryHeat', heat], ['rally.rivalryJoined:' + id, heat]])
      .then(() => {
        setJoined(heat);
        setSheet(false);
      })
      .catch(() => {});
  }

  const nameA = r ? r.favoriteA.name || 'Favorite A' : '';
  const nameB = r ? r.favoriteB.name || 'Favorite B' : '';
  const bothIn = !!r && r.optInA && r.optInB;

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={[styles.h1, { color: colors.text }]}>Rivalry Hub</Text>
        <Pressable onPress={() => { impact('light'); router.push('/rivalries/settings'); }} hitSlop={10} accessibilityLabel="Rivalry settings">
          <Ionicons name="settings-outline" size={22} color={colors.muted} />
        </Pressable>
      </View>

      {loading ? <ActivityIndicator color={GOLD} style={{ marginTop: 30 }} /> : null}

      {!loading && !r ? (
        <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>Rivalry not found.</Text>
      ) : null}

      {r ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          {/* VS card */}
          <View style={[styles.vsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.vsRow}>
              <View style={styles.side}>
                <LinearGradient colors={['#C026D3', '#A855F7'] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 26 }}>{initials(nameA)}</Text>
                </LinearGradient>
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16, marginTop: 10, textAlign: 'center' }} numberOfLines={1}>
                  {nameA}
                </Text>
              </View>
              <Text style={{ color: colors.muted, fontWeight: '900', fontSize: 22 }}>VS</Text>
              <View style={styles.side}>
                <LinearGradient colors={['#0EA5E9', '#2DD4BF'] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 26 }}>{initials(nameB)}</Text>
                </LinearGradient>
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16, marginTop: 10, textAlign: 'center' }} numberOfLines={1}>
                  {nameB}
                </Text>
              </View>
            </View>
            <View style={[styles.optInPill, { backgroundColor: TEAL + '22' }]}>
              <Ionicons name={bothIn ? 'checkmark' : 'time-outline'} size={14} color={TEAL} />
              <Text style={{ color: TEAL, fontWeight: '900', fontSize: 12, letterSpacing: 0.5, marginLeft: 6 }}>
                {bothIn ? 'BOTH FAVORITES OPTED IN' : 'AWAITING OPT-IN'}
              </Text>
            </View>
          </View>

          {/* Heat level */}
          <Pressable style={styles.heatHead} onPress={() => { impact('light'); router.push('/beef-radar?id=' + id); }} accessibilityLabel="Open Beef Radar">
            <Text style={{ color: colors.muted, fontWeight: '900', fontSize: 15, letterSpacing: 1 }}>HEAT LEVEL</Text>
            <Text style={{ color: HEAT_COLORS[Math.max(0, Math.min(4, r.heatLevel - 1))], fontWeight: '900', fontSize: 17 }}>
              {r.heatLevel + ' \u00b7 ' + (HEAT_LABELS[r.heatLevel - 1] || '')}
            </Text>
          </Pressable>
          <View style={styles.heatBar}>
            {HEAT_COLORS.map((col, i) => (
              <View key={col} style={[styles.heatSeg, { backgroundColor: i < r.heatLevel ? col : 'rgba(128,128,128,0.25)' }]} />
            ))}
          </View>

          {/* Stats note (honest) */}
          <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Ionicons name="stats-chart-outline" size={16} color={GOLD} />
            <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20, flex: 1 }}>
              Per-side stats (supporters, 30-day growth, repeat fans) arrive with the analytics backend.
            </Text>
          </View>

          {/* Summary / sourced timeline */}
          {r.summary ? (
            <>
              <Text style={[styles.section, { color: colors.muted }]}>{'TIMELINE \u00b7 SOURCED'}</Text>
              <View style={styles.timelineRow}>
                <View style={[styles.dot, { backgroundColor: TEAL }]} />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ color: colors.text, fontSize: 16, lineHeight: 22 }}>{r.summary}</Text>
                  <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
                    {'Documented by Rally \u00b7 sources on file'}
                  </Text>
                </View>
              </View>
            </>
          ) : null}

          {/* Open face-offs */}
          {r.faceOffs.length > 0 ? (
            <>
              <Text style={[styles.section, { color: colors.muted }]}>OPEN FACE-OFFS</Text>
              {r.faceOffs.map((f) => (
                <Pressable
                  key={f.id}
                  onPress={() => { impact('light'); router.push({ pathname: '/rivalries/faceoff', params: { id: f.id } }); }}
                  style={[styles.foCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  accessibilityLabel={'Face-Off: ' + f.question}
                >
                  <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16, flex: 1 }}>{f.question}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </Pressable>
              ))}
            </>
          ) : null}
        </ScrollView>
      ) : null}

      {/* Bottom actions */}
      {r ? (
        <View style={styles.bottomBar}>
          <Pressable
            onPress={() => {
              impact('light');
              Alert.alert(
                'Banter Channel',
                'The channel opens with Community Chat. Until then, keep the banter in posts and moments - the same conduct rules apply.'
              );
            }}
            style={[styles.quietBtn, { backgroundColor: colors.surfaceElevated }]}
            accessibilityLabel="Banter Channel"
          >
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16 }}>Banter Channel</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              impact('light');
              if (joined) {
                router.push({ pathname: '/rivalries/faceoff-new', params: { id: String(id), nameA, nameB } });
                return;
              }
              setSheet(true);
            }}
            style={styles.goldBtn}
            accessibilityLabel="Start Face-Off"
          >
            <Text style={{ color: '#111', fontWeight: '900', fontSize: 16 }}>
              {joined ? 'New Face-Off' : 'Start Face-Off'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* Join the Rivalry sheet (mock 29) */}
      <Modal visible={sheet} transparent animationType="slide" onRequestClose={() => setSheet(false)}>
        <View style={styles.sheetBackdrop}>
          <Pressable style={{ flex: 1 }} onPress={() => setSheet(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.grab, { backgroundColor: colors.border }]} />
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 24 }}>Join the Rivalry?</Text>
            <Text style={{ color: colors.muted, fontSize: 16, lineHeight: 23, marginTop: 8 }}>
              Rivalry is playful competition between fandoms. It is opt-in and you can leave any time.
            </Text>

            <Text style={{ color: colors.muted, fontWeight: '900', fontSize: 14, letterSpacing: 1, marginTop: 20 }}>
              HOW HEATED?
            </Text>
            <View style={styles.heatRow}>
              {HEATS.map((h) => {
                const on = heat === h.key;
                return (
                  <Pressable
                    key={h.key}
                    onPress={() => { impact('light'); setHeat(h.key); }}
                    style={[styles.heatCard, on && { borderColor: GOLD }, { borderColor: on ? GOLD : colors.border }]}
                    accessibilityLabel={h.label}
                  >
                    <Text style={{ color: on ? GOLD : colors.text, fontWeight: '900', fontSize: 17 }}>{h.label}</Text>
                    <Text style={{ color: colors.muted, fontSize: 14, marginTop: 3 }}>{h.sub}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Ionicons name="shield-checkmark-outline" size={16} color={TEAL} />
              <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20, flex: 1 }}>
                No threats, slurs or pile-ons. Call-Outs follow the same rules as any public post. Under 18s cannot join.
              </Text>
            </View>

            <Pressable onPress={joinRivalry} style={styles.joinBtn} accessibilityLabel="Join Rivalry">
              <Text style={{ color: '#111', fontWeight: '900', fontSize: 18 }}>
                {joined ? 'Update my heat' : 'Join Rivalry'}
              </Text>
            </Pressable>
            <Pressable onPress={() => setSheet(false)} hitSlop={10} accessibilityLabel="Not now">
              <Text style={{ color: colors.muted, fontWeight: '800', fontSize: 16, textAlign: 'center', marginTop: 16 }}>
                Not now
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 20, fontWeight: '900', flex: 1, textAlign: 'center' },
  vsCard: { borderWidth: 1, borderRadius: radii.xl, padding: 22, alignItems: 'center' },
  vsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  side: { alignItems: 'center', flex: 1 },
  avatar: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
  optInPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 18,
  },
  heatHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  heatBar: { flexDirection: 'row', gap: 8, marginTop: 12 },
  heatSeg: { flex: 1, height: 12, borderRadius: 6 },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 14,
    marginTop: spacing.md,
  },
  section: { fontSize: 13, fontWeight: '900', letterSpacing: 1, marginTop: spacing.lg, marginBottom: 10 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start' },
  dot: { width: 16, height: 16, borderRadius: 8, marginTop: 4 },
  foCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 16,
    marginBottom: 10,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  quietBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: radii.full },
  goldBtn: { flex: 1, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: radii.full },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 34 },
  grab: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, marginBottom: 18 },
  heatRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  heatCard: { flex: 1, borderWidth: 1.5, borderRadius: radii.lg, padding: 14, alignItems: 'center' },
  joinBtn: { backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: radii.full, marginTop: 18 },
});
