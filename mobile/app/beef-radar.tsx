/** Beef Radar (UX) - Rally design
 * Heat now for a rivalry, measures applied automatically, rising reports,
 * and calm controls: Pause channel and Lock Face-Off. Auto de-escalation
 * keeps things friendly.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const RED = '#ef5350';
const GREEN = '#34D399';
const PURPLE = '#A78BFA';
const HEAT_COLORS = ['#22D3EE', '#34D399', '#FBBF24', '#F59E0B', '#EF4444'];

type Radar = {
  rivalry: { id: string; a: string; b: string; status: string };
  heat: { level: number; label: string };
  measures: { title: string; detail: string }[];
  deEscalationAt: number;
  reports: { threads: { severity: string; title: string; replies: number; reports: number }[] };
};
type RivalryList = { rivalries: { id: string; favoriteA: { name: string | null }; favoriteB: { name: string | null }; heatLevel: number }[] };

const MEASURE_ICONS = ['speedometer-outline', 'pin-outline', 'person-outline'];
const MEASURE_COLORS = [GREEN, GOLD, PURPLE];

export default function BeefRadarScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const params = useLocalSearchParams<{ id?: string }>();
  const [id, setId] = useState<string | null>(params.id || null);
  const [list, setList] = useState<RivalryList['rivalries']>([]);
  const [data, setData] = useState<Radar | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (id) {
        const res = await api<Radar>('/api/rivalries/' + id + '/radar');
        setData(res);
      } else {
        const res = await api<RivalryList>('/api/rivalries');
        setList(res.rivalries || []);
        if (res.rivalries && res.rivalries.length) {
          const first = res.rivalries[0];
          setId(first.id);
          const r = await api<Radar>('/api/rivalries/' + first.id + '/radar');
          setData(r);
        }
      }
    } catch {
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function act(path: string, okText: string) {
    if (!id || busy) return;
    setBusy(true);
    impact('medium');
    try {
      const res = await api<any>('/api/rivalries/' + id + path, { method: 'POST', body: JSON.stringify({}) });
      setMsg(res && res.note ? res.note : okText);
      await load();
    } catch (e: any) {
      setMsg(e && e.message ? e.message : 'Not allowed from this account.');
    } finally { setBusy(false); }
  }

  return (
    <SwipeBack>
      <Screen refreshing={loading} onRefresh={load}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Beef Radar</Text>
        </View>

        {loading && !data ? (
          <ActivityIndicator color={GOLD} style={{ marginTop: 60 }} />
        ) : !data ? (
          <EmptyState icon="pulse-outline" title="No rivalries yet" body="Documented rivalries appear here with a heat gauge and calm controls." />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
            <Text style={[styles.sub, { color: colors.muted }]}>
              {data.rivalry.a + ' vs ' + data.rivalry.b + ' \u00B7 last 24 hours'}
            </Text>

            {/* Heat now */}
            <Text style={[styles.section, { color: colors.muted }]}>HEAT NOW</Text>
            <View style={[styles.heatCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.heatValue}>
                <Text style={{ color: HEAT_COLORS[data.heat.level - 1] }}>{data.heat.level + ' \u00B7 ' + data.heat.label}</Text>
              </Text>
              <View style={styles.heatBar}>
                {HEAT_COLORS.map((c, i) => (
                  <View key={c} style={[styles.heatSeg, { backgroundColor: i < data.heat.level ? c : colors.border }]} />
                ))}
              </View>
              <Text style={{ color: colors.muted, fontSize: 11, marginTop: 8 }}>
                {'Auto de-escalation at level ' + data.deEscalationAt}
              </Text>
            </View>

            {/* Applied automatically */}
            <Text style={[styles.section, { color: colors.muted }]}>APPLIED AUTOMATICALLY</Text>
            {data.measures.length === 0 ? (
              <Text style={{ color: colors.muted, fontSize: 12 }}>Nothing needed right now. The rivalry is calm.</Text>
            ) : (
              <View style={{ gap: 10 }}>
                {data.measures.map((m, i) => (
                  <View key={m.title} style={[styles.measureRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons name={MEASURE_ICONS[i % 3]} size={18} color={MEASURE_COLORS[i % 3]} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>{m.title}</Text>
                      <Text style={{ color: colors.muted, fontSize: 12, marginTop: 1 }}>{m.detail}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Rising reports */}
            <Text style={[styles.section, { color: colors.muted }]}>RISING REPORTS</Text>
            {data.reports.threads.length === 0 ? (
              <Text style={{ color: colors.muted, fontSize: 12 }}>No rising reports. Fans are keeping it friendly.</Text>
            ) : (
              <View style={{ gap: 10 }}>
                {data.reports.threads.map((t) => (
                  <View key={t.title} style={[styles.threadRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={[styles.sevChip, { backgroundColor: t.severity === 'HIGH' ? RED + '22' : GOLD + '22' }]}>
                      <Text style={{ color: t.severity === 'HIGH' ? RED : GOLD, fontSize: 10, fontWeight: '900' }}>{t.severity}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }} numberOfLines={1}>{t.title}</Text>
                      <Text style={{ color: colors.muted, fontSize: 11, marginTop: 1 }}>
                        {t.replies + ' replies \u00B7 ' + t.reports + ' reports'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {msg ? <Text style={[styles.msg, { color: GREEN }]}>{msg}</Text> : null}

            {/* Calm controls */}
            <View style={styles.btnRow}>
              <Pressable
                style={[styles.pauseBtn, busy && { opacity: 0.5 }]}
                onPress={() => act('/pause-channel', 'The channel is paused.')}
                disabled={busy || !getToken()}
                accessibilityLabel="Pause channel"
              >
                <Text style={styles.pauseText}>Pause channel</Text>
              </Pressable>
              <Pressable
                style={[styles.lockBtn, { borderColor: colors.border }, busy && { opacity: 0.5 }]}
                onPress={() => act('/lock', 'Face-offs are locked.')}
                disabled={busy || !getToken()}
                accessibilityLabel="Lock Face-Off"
              >
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }}>Lock Face-Off</Text>
              </Pressable>
            </View>
            <Text style={[styles.hint, { color: colors.muted }]}>
              Pause and lock are for the two rivals and moderators. Fans keep the music either way.
            </Text>
          </ScrollView>
        )}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.sm },
  h1: { fontSize: 24, fontWeight: '900' },
  sub: { fontSize: 13, marginTop: 4, marginBottom: spacing.sm },
  section: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: spacing.lg, marginBottom: 8 },
  heatCard: { borderWidth: 1, borderRadius: radii.lg, padding: 16 },
  heatValue: { fontSize: 22, fontWeight: '900' },
  heatBar: { flexDirection: 'row', gap: 6, marginTop: 12 },
  heatSeg: { flex: 1, height: 10, borderRadius: 5 },
  measureRow: { flexDirection: 'row', borderWidth: 1, borderRadius: radii.md, padding: 14, alignItems: 'center' },
  threadRow: { flexDirection: 'row', borderWidth: 1, borderRadius: radii.md, padding: 14, alignItems: 'center' },
  sevChip: { borderRadius: radii.full, paddingHorizontal: 8, paddingVertical: 4 },
  msg: { fontSize: 13, fontWeight: '700', marginTop: 14, lineHeight: 19 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: spacing.lg },
  pauseBtn: { flex: 1, backgroundColor: RED, borderRadius: radii.full, alignItems: 'center', paddingVertical: 14 },
  pauseText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  lockBtn: { flex: 1, borderWidth: 1, borderRadius: radii.full, alignItems: 'center', paddingVertical: 14 },
  hint: { fontSize: 11, lineHeight: 17, marginTop: 10 },
});
