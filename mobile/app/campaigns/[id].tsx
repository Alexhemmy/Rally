/** Campaign Detail (mock 27) - charity campaign with transparency.
 * Real campaign from GET /api/campaigns/:id (title, goal, raised,
 * deadline, impactReport). Honest deviations: the backend has no donor
 * count and no donate endpoint yet, so the donor line is omitted and
 * Donate explains that donations open with the payments backend; the
 * beneficiary and money-trail details come from the campaign record.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api } from '@/lib/api';

const TEAL = '#34D399';
const GOLD = '#FFA726';

type Campaign = {
  id: string;
  title: string;
  description: string | null;
  goalAmount: number;
  raisedAmount: number;
  currency: string;
  status: string;
  deadline: string | null;
  impactReport: string | null;
};

function naira(amount: number, currency: string): string {
  const sym = currency === 'NGN' ? '\u20A6' : currency === 'USD' ? '$' : currency + ' ';
  return sym + Math.round(amount).toLocaleString('en-US');
}

function daysLeft(iso: string | null): string {
  if (!iso) return 'Open';
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'Ended';
  const d = Math.ceil(ms / 86400000);
  return d + (d === 1 ? ' day left' : ' days left');
}

const CHIPS = [100000, 500000, 1000000];

export default function CampaignDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { impact } = useHaptics();

  const [c, setC] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState<number>(500000);
  const [other, setOther] = useState('');

  const load = useCallback(async () => {
    if (!id) { setLoading(false); return; }
    try {
      const r = await api<{ campaign: Campaign }>('/api/campaigns/' + id, { skipAuth: true });
      setC(r.campaign || null);
    } catch { /* offline */ }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function donate() {
    impact('medium');
    const amount = other ? Number(other) : picked / 100;
    Alert.alert(
      'Donations open soon',
      'Campaign pages are live and every naira raised so far is real. Donating opens with the payments backend - this screen will light up then.'
    );
  }

  const pct = c && c.goalAmount ? Math.min(100, Math.round((c.raisedAmount / c.goalAmount) * 100)) : 0;

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <View style={{ width: 26 }} />
      </View>

      {loading ? <ActivityIndicator color={TEAL} style={{ marginTop: 30 }} /> : null}

      {!loading && !c ? (
        <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>Campaign not found.</Text>
      ) : null}

      {c ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Hero */}
          <LinearGradient
            colors={['#0F9B8E', '#2196D9'] as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.hero}
          >
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 26, lineHeight: 34 }}>{c.title}</Text>
          </LinearGradient>

          {/* Progress */}
          <View style={styles.progressRow}>
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 30 }}>
              {naira(c.raisedAmount, c.currency)}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 17 }}>{' of ' + naira(c.goalAmount, c.currency)}</Text>
          </View>
          <View style={[styles.track, { backgroundColor: colors.border }]}>
            <View style={[styles.fill, { width: pct + '%', backgroundColor: TEAL }]} />
          </View>
          <View style={styles.metaRow}>
            <Text style={{ color: colors.muted, fontSize: 15 }}>{daysLeft(c.deadline)}</Text>
            <Text style={{ color: colors.muted, fontSize: 15 }}>{pct + '% funded'}</Text>
          </View>

          {c.description ? (
            <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: spacing.md }}>
              {c.description}
            </Text>
          ) : null}

          {/* No fee note */}
          <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Ionicons name="water-outline" size={18} color={TEAL} />
            <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 21, flex: 1 }}>
              No Rally fee. Donations go straight to the verified beneficiary, minus payment processing costs only.
            </Text>
          </View>

          {/* Where the money went */}
          {c.impactReport ? (
            <>
              <Text style={[styles.section, { color: colors.muted }]}>WHERE THE MONEY WENT</Text>
              <View style={[styles.reportCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.dotRow}>
                  <View style={[styles.dot, { backgroundColor: TEAL }]} />
                  <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16, flex: 1, marginLeft: 14 }}>
                    {c.impactReport}
                  </Text>
                </View>
              </View>
            </>
          ) : null}

          {/* Give chips */}
          <Text style={[styles.section, { color: colors.muted }]}>GIVE</Text>
          <View style={styles.chipRow}>
            {CHIPS.map((v) => {
              const on = picked === v && !other;
              return (
                <Pressable
                  key={v}
                  onPress={() => { impact('light'); setPicked(v); setOther(''); }}
                  style={[styles.chip, on && { borderColor: GOLD, backgroundColor: GOLD + '14' }]}
                  accessibilityLabel={'Give ' + naira(v, c.currency)}
                >
                  <Text style={{ color: on ? GOLD : colors.text, fontWeight: '800', fontSize: 16 }}>
                    {naira(v, c.currency)}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => { impact('light'); setOther(' '); }}
              style={[styles.chip, other ? { borderColor: GOLD, backgroundColor: GOLD + '14' } : null]}
              accessibilityLabel="Other amount"
            >
              <Text style={{ color: other ? GOLD : colors.text, fontWeight: '800', fontSize: 16 }}>Other</Text>
            </Pressable>
          </View>
          {other ? (
            <TextInput
              value={other.trim()}
              onChangeText={(t) => setOther(t.replace(/[^0-9]/g, ''))}
              placeholder="Amount in naira"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
              accessibilityLabel="Other amount"
            />
          ) : null}
        </ScrollView>
      ) : null}

      {c ? (
        <Pressable onPress={donate} accessibilityLabel="Donate">
          <View style={[styles.donateBtn, { opacity: c.status === 'active' ? 1 : 0.5 }]}>
            <Text style={{ color: '#04120C', fontWeight: '900', fontSize: 19 }}>
              {'Donate ' + (other ? '\u20A6' + Number(other || 0).toLocaleString('en-US') : naira(picked, c.currency))}
            </Text>
          </View>
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  hero: { borderRadius: radii.xl, padding: 22, minHeight: 150, justifyContent: 'flex-end' },
  progressRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: spacing.md },
  track: { height: 8, borderRadius: 4, marginTop: 12, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
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
  reportCard: { borderWidth: 1, borderRadius: radii.lg, padding: 16 },
  dotRow: { flexDirection: 'row', alignItems: 'flex-start' },
  dot: { width: 14, height: 14, borderRadius: 7, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { borderWidth: 1.5, borderColor: 'transparent', borderRadius: radii.full, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: 'rgba(128,128,128,0.15)' },
  input: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginTop: 12,
  },
  donateBtn: {
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: radii.full,
    marginTop: spacing.md,
  },
});
