/** New giveaway (mock 22) - create, fund and announce.
 * Prize pool, winners, Equal/Tiered split, entry window and funding.
 * Real flow: POST /api/giveaways (draft) -> /:id/fund -> /:id/announce
 * (which publishes the provably-fair seed hash). One honest note: the
 * backend funds from the Favorite's Gift Points balance (pool + 3%
 * fee), not the naira earnings balance shown in the mock.
 */
import { useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#FFA726';
const TEAL = '#34D399';

function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

function isoLocal(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })
    + ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function NewGiveawayScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const { click } = useSounds();

  const [pool, setPool] = useState('300000');
  const [winners, setWinners] = useState('5');
  const [split, setSplit] = useState<'equal' | 'tiered'>('equal');
  const [publishing, setPublishing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [handle, setHandle] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('rally.myHandle');
        if (raw) setHandle(JSON.parse(raw));
      } catch { /* fresh */ }
    })();
  }, []);

  const poolNum = parseInt(pool, 10) || 0;
  const winnersNum = Math.max(1, parseInt(winners, 10) || 1);
  const each = winnersNum > 0 ? Math.floor(poolNum / winnersNum) : 0;
  const opens = new Date();
  const closes = new Date(Date.now() + 6 * 86400000);
  closes.setHours(20, 0, 0, 0);

  async function publish() {
    if (publishing) return;
    if (!getToken()) { router.push('/login'); return; }
    if (!handle) { setErr('Set up your Favorite page first.'); return; }
    if (poolNum < 1000) { setErr('Prize pool must be at least \u20A61,000.'); return; }
    setPublishing(true);
    setErr(null);
    impact('medium');
    try {
      const u = await api<any>('/api/users/' + handle);
      const favoriteId = u.favoriteProfile && u.favoriteProfile.id;
      if (!favoriteId) throw new Error('Apply as a Favorite to run giveaways.');
      const created = await api<{ giveaway: { id: string } }>('/api/giveaways', {
        method: 'POST',
        body: JSON.stringify({
          favoriteId,
          poolAmount: poolNum,
          currency: 'NGN',
          winnerCount: winnersNum,
          split,
          entryOpensAt: opens.toISOString(),
          entryClosesAt: closes.toISOString(),
          countryFilter: 'NG',
        }),
      });
      const id = created.giveaway.id;
      await api('/api/giveaways/' + id + '/fund', { method: 'POST' });
      await api('/api/giveaways/' + id + '/announce', { method: 'POST' });
      impact('success');
      router.replace('/giveaways');
    } catch (e: any) {
      setErr(e.message || 'Could not publish the giveaway');
      setPublishing(false);
    }
  }

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>New giveaway</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Identity */}
          <View style={styles.identityRow}>
            <View style={[styles.tsAvatar, { backgroundColor: GOLD }]}>
              <Text style={{ color: '#111', fontWeight: '900', fontSize: 14 }}>{(handle || 'TS').slice(0, 2).toUpperCase()}</Text>
            </View>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>
              {(handle ? '@' + handle : 'You') + ' \u00b7 available in Nigeria'}
            </Text>
          </View>

          {/* Pool + winners */}
          <View style={styles.poolRow}>
            <View style={{ flex: 1.4 }}>
              <Text style={[styles.label, { color: colors.text }]}>Prize pool</Text>
              <TextInput
                style={[styles.poolInput, { borderColor: GOLD, color: colors.text }]}
                value={'\u20A6' + fmt(poolNum)}
                onChangeText={(t) => setPool(t.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.text }]}>Winners</Text>
              <TextInput
                style={[styles.poolInput, { borderColor: colors.border, color: colors.text }]}
                value={winners}
                onChangeText={(t) => setWinners(t.replace(/[^0-9]/g, '').slice(0, 3))}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Split */}
          <View style={[styles.splitWrap, { backgroundColor: colors.surfaceElevated }]}>
            {(['equal', 'tiered'] as const).map((s) => (
              <Pressable
                key={s}
                onPress={() => { impact('light'); click(); setSplit(s); }}
                style={[styles.splitBtn, split === s && { backgroundColor: '#1C1C22', borderRadius: radii.md }]}
                accessibilityLabel={s === 'equal' ? 'Equal split' : 'Tiered'}
              >
                <Text style={{ color: split === s ? colors.text : colors.muted, fontWeight: '900', fontSize: 16 }}>
                  {s === 'equal' ? 'Equal split' : 'Tiered'}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={{ color: colors.muted, fontSize: 15, marginTop: 8 }}>
            {'Each winner gets \u20A6' + fmt(each)}
          </Text>

          {/* Entry window */}
          <Text style={[styles.label, { color: colors.text, marginTop: spacing.md }]}>Entry window</Text>
          <View style={[styles.windowCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.windowRow, { borderBottomColor: colors.border }]}>
              <Text style={{ color: colors.muted, fontSize: 17 }}>Opens</Text>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 }}>{isoLocal(opens)}</Text>
            </View>
            <View style={styles.windowRow}>
              <Text style={{ color: colors.muted, fontSize: 17 }}>Closes</Text>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 }}>{isoLocal(closes)}</Text>
            </View>
          </View>

          {/* Funding */}
          <Text style={[styles.label, { color: colors.text, marginTop: spacing.md }]}>Funding</Text>
          <View style={[styles.fundCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.fundIcon, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons name="business-outline" size={18} color={GOLD} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 }}>Your Gift Points balance</Text>
              <Text style={{ color: colors.muted, fontSize: 14, marginTop: 2, lineHeight: 20 }}>
                {'\u20A6' + fmt(poolNum) + ' pool + 3% fee, held in escrow until the draw'}
              </Text>
            </View>
          </View>

          {/* Fairness notes */}
          <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Ionicons name="lock-closed-outline" size={16} color={TEAL} />
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              Rally publishes a seed hash before entries open, so fans can verify the draw afterwards.
            </Text>
          </View>
          <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Ionicons name="people-outline" size={16} color={TEAL} />
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              Winners come from three scores: activeness, dedication and passion. Tokens, Gifts and subscriptions are never used. Entry is free.
            </Text>
          </View>

          {err ? <Text style={{ color: colors.danger, fontSize: 13, marginTop: 12 }}>{err}</Text> : null}
        </ScrollView>

        <Pressable onPress={publish} disabled={publishing} accessibilityLabel="Fund and publish">
          <View style={[styles.publishBtn, { backgroundColor: GOLD }, publishing && { opacity: 0.7 }]}>
            <Text style={{ color: '#111', fontWeight: '900', fontSize: 18 }}>
              {publishing ? 'Publishing\u2026' : 'Fund and publish'}
            </Text>
          </View>
        </Pressable>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  tsAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  poolRow: { flexDirection: 'row', gap: 14 },
  label: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  poolInput: { borderWidth: 1.5, borderRadius: radii.md, paddingHorizontal: 16, minHeight: 60, fontSize: 20, fontWeight: '900' },
  splitWrap: { flexDirection: 'row', borderRadius: radii.md, padding: 4, marginTop: 14 },
  splitBtn: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  windowCard: { borderWidth: 1, borderRadius: radii.lg },
  windowRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1 },
  fundCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radii.lg, padding: 14 },
  fundIcon: { width: 44, height: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 14,
    marginTop: 12,
  },
  noteText: { flex: 1, fontSize: 14, lineHeight: 20 },
  publishBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: radii.full },
});
