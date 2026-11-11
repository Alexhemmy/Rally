/** Fan Club join (mock 16) - fan-side tier picker.
 * Real tiers from GET /api/subscriptions/favorite/:favoriteId and a real
 * join via POST /api/subscriptions/subscribe {tierId} (monthly, cancel or
 * pause any time). Honest deviations: the backend charges in naira only,
 * so "Pay with Tokens" is shown as coming soon; there is no most-chosen
 * statistic yet, so the MOST CHOSEN badge is omitted; member count uses
 * the Favorite's supporter count.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const TEAL = '#34D399';

type Tier = { id: string; name: string; priceCents: number; currency: string; perks: string[] };

function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export default function FanClubJoinScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const { impact } = useHaptics();
  const { success } = useSounds();

  const [tiers, setTiers] = useState<Tier[]>([]);
  const [clubName, setClubName] = useState('');
  const [supporters, setSupporters] = useState<number | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const load = useCallback(async () => {
    if (!handle) { setLoading(false); return; }
    try {
      const fav = await api<any>('/api/favorites/' + handle);
      const f = fav.favorite || {};
      setClubName(f.displayName || f.handle || 'this Favorite');
      setSupporters(f.supporterCount != null ? Number(f.supporterCount) : null);
      const favoriteId = f.id;
      if (favoriteId) {
        const r = await api<{ tiers: Tier[] }>('/api/subscriptions/favorite/' + favoriteId);
        setTiers(r.tiers || []);
        if (r.tiers && r.tiers.length > 0) setPicked(r.tiers[0].id);
      }
    } catch { /* offline */ }
    setLoading(false);
  }, [handle]);

  useEffect(() => { load(); }, [load]);

  async function join() {
    if (!picked || joining) return;
    if (!getToken()) { router.push('/login'); return; }
    setJoining(true);
    impact('medium');
    try {
      await api('/api/subscriptions/subscribe', { method: 'POST', body: JSON.stringify({ tierId: picked }) });
      success();
      impact('success');
      Alert.alert('Welcome to the club', 'Your membership is active. Manage or pause it any time in Fan Clubs.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Join fan club', e.message || 'Could not join right now');
    } finally {
      setJoining(false);
    }
  }

  const pickedTier = tiers.find((t) => t.id === picked) || null;

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <View style={{ width: 26 }} />
      </View>

      {loading ? <ActivityIndicator color={GOLD} style={{ marginTop: 24 }} /> : null}

      {!loading ? (
        <>
          {/* Identity */}
          <View style={styles.identityRow}>
            <LinearGradient colors={[GOLD, '#F0663F'] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18 }}>
                {(clubName || 'FC').slice(0, 2).toUpperCase()}
              </Text>
            </LinearGradient>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 24 }} numberOfLines={1}>
                {clubName ? clubName + "'s Room" : 'Fan Club'}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 15, marginTop: 2 }}>
                {'Fan club \u00b7 ' + (supporters === null ? '\u2014' : fmt(supporters)) + ' supporters'}
              </Text>
            </View>
          </View>

          <Text style={[styles.sub, { color: colors.muted }]}>
            Pick a tier. Cancel or pause any time. Perks never change giveaway odds.
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
            {tiers.length === 0 ? (
              <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
                This Favorite has not published tiers yet. Check back soon.
              </Text>
            ) : null}

            {tiers.map((t) => {
              const active = picked === t.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => { impact('light'); setPicked(t.id); }}
                  style={[styles.tierCard, { backgroundColor: colors.surface, borderColor: active ? GOLD : colors.border }, active && { borderWidth: 1.5 }]}
                  accessibilityLabel={t.name}
                >
                  <View style={styles.tierHead}>
                    <Text style={{ color: colors.text, fontWeight: '900', fontSize: 20 }}>{t.name}</Text>
                    <Text style={{ color: colors.text, fontWeight: '900', fontSize: 18 }}>
                      {'\u20A6' + fmt(t.priceCents / 100) + ' / month'}
                    </Text>
                  </View>
                  {(t.perks && t.perks.length ? t.perks : []).map((p, i) => (
                    <View key={i} style={styles.perkRow}>
                      <Ionicons name="checkmark" size={16} color={TEAL} />
                      <Text style={{ color: colors.muted, fontSize: 16, marginLeft: 10, flex: 1 }}>{p}</Text>
                    </View>
                  ))}
                </Pressable>
              );
            })}

            {/* Payment method chips */}
            {tiers.length > 0 ? (
              <View style={styles.payRow}>
                <View style={[styles.payChip, { borderColor: GOLD }]}>
                  <Text style={{ color: GOLD, fontWeight: '900', fontSize: 15 }}>Pay in naira</Text>
                </View>
                <Pressable
                  onPress={() => Alert.alert('Pay with Tokens', 'Token payments for fan clubs arrive with the billing update - naira is the only method for now.')}
                  style={[styles.payChip, { borderColor: colors.border }]}
                  accessibilityLabel="Pay with Tokens"
                >
                  <Text style={{ color: colors.muted, fontWeight: '900', fontSize: 15 }}>Pay with Tokens</Text>
                </Pressable>
              </View>
            ) : null}
          </ScrollView>

          {/* Join bar */}
          {pickedTier ? (
            <View style={styles.joinWrap}>
              <Pressable onPress={join} disabled={joining} accessibilityLabel="Join tier">
                <LinearGradient
                  colors={[GOLD, GOLD_DEEP] as [string, string]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={[styles.joinBtn, joining && { opacity: 0.6 }]}
                >
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18 }}>
                    {joining ? 'Joining\u2026' : 'Join ' + pickedTier.name + ' \u00b7 \u20A6' + fmt(pickedTier.priceCents / 100) + ' / month'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.sm },
  identityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  sub: { fontSize: 16, lineHeight: 23, marginBottom: spacing.md },
  tierCard: { borderWidth: 1, borderRadius: radii.lg, padding: 18, marginBottom: 14 },
  tierHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  perkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  payRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  payChip: { borderWidth: 1.5, borderRadius: radii.full, paddingHorizontal: 18, paddingVertical: 12 },
  joinWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  joinBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: radii.full },
});
