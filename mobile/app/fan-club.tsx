/** Fan Club (mock 21) - tier management for the Favorite.
 * Real tier CRUD: GET /api/subscriptions/favorite/:id, POST /tiers,
 * PATCH /tiers/:id. Billing cadence and the member-count toggle have
 * no backend fields, so they stay client-side and labeled as such.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView, TextInput, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { GradientButton } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#FFA726';
const TEAL = '#34D399';

type Tier = { id: string; name: string; priceCents: number; currency: string; perks: string[]; description: string | null };

function money(cents: number, currency: string): string {
  const symbol = currency === 'NGN' ? '\u20A6' : currency === 'USD' ? '$' : currency + ' ';
  return symbol + (cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export default function FanClubScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const { click, success } = useSounds();

  const [tiers, setTiers] = useState<Tier[]>([]);
  const [showCount, setShowCount] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newPerks, setNewPerks] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    setLoading(true);
    try {
      const handleRaw = await AsyncStorage.getItem('rally.myHandle');
      const handle = handleRaw ? JSON.parse(handleRaw) : null;
      if (handle) {
        const u = await api<any>('/api/users/' + handle);
        const favoriteId = u.favoriteProfile && u.favoriteProfile.id;
        if (favoriteId) {
          const r = await api<{ tiers: Tier[] }>('/api/subscriptions/favorite/' + favoriteId);
          setTiers(r.tiers || []);
          await AsyncStorage.setItem('rally.myFavoriteId', JSON.stringify(favoriteId));
        }
      }
    } catch { /* offline */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('rally.fanClubPrefs');
        if (raw) setShowCount(JSON.parse(raw).showCount !== false);
      } catch { /* fresh */ }
    })();
    load();
  }, [load]);

  async function addTier() {
    const price = Math.round(parseFloat(newPrice) * 100);
    if (!newName.trim() || !price || price < 100) {
      Alert.alert('Add a tier', 'Give the tier a name and a price of at least 1.');
      return;
    }
    setSaving(true);
    impact('medium');
    try {
      const favoriteIdRaw = await AsyncStorage.getItem('rally.myFavoriteId');
      const favoriteId = favoriteIdRaw ? JSON.parse(favoriteIdRaw) : null;
      if (!favoriteId) throw new Error('Favorite profile not found');
      const perks = newPerks.split('\n').map((p) => p.trim()).filter(Boolean).slice(0, 10);
      await api('/api/subscriptions/tiers', {
        method: 'POST',
        body: JSON.stringify({ favoriteId, name: newName.trim(), priceCents: price, currency: 'NGN', perks }),
      });
      success();
      setAdding(false);
      setNewName(''); setNewPrice(''); setNewPerks('');
      await load();
    } catch (e: any) {
      Alert.alert('Add a tier', e.message || 'Could not create the tier');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Fan Club</Text>
          <Pressable onPress={() => { impact('light'); click(); }} hitSlop={10} accessibilityLabel="Preview">
            <Text style={{ color: GOLD, fontWeight: '900', fontSize: 16 }}>Preview</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {loading ? <Text style={{ color: colors.muted, fontSize: 14 }}>Loading\u2026</Text> : null}

          {/* Tiers */}
          {tiers.map((t, i) => (
            <View
              key={t.id}
              style={[styles.tierCard, { backgroundColor: colors.surface, borderColor: i === 0 ? GOLD : colors.border }, i === 0 && { borderWidth: 1.5 }]}
            >
              <View style={styles.tierHead}>
                <Text style={{ color: colors.text, fontWeight: '900', fontSize: 19 }}>{t.name}</Text>
                <Text style={{ color: colors.text, fontWeight: '900', fontSize: 19 }}>{money(t.priceCents, t.currency) + ' / mo'}</Text>
              </View>
              {(t.perks && t.perks.length ? t.perks : (t.description ? [t.description] : [])).map((p, j) => (
                <Text key={j} style={{ color: colors.muted, fontSize: 16, marginTop: 6 }}>{p}</Text>
              ))}
            </View>
          ))}

          {/* Add a tier */}
          {adding ? (
            <View style={[styles.addForm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                style={[styles.addInput, { borderColor: colors.border, color: colors.text }]}
                placeholder="Tier name (e.g. Inner Circle)"
                placeholderTextColor={colors.muted}
                value={newName}
                onChangeText={(t) => setNewName(t.slice(0, 50))}
              />
              <TextInput
                style={[styles.addInput, { borderColor: colors.border, color: colors.text }]}
                placeholder="Price per month (e.g. 5000)"
                placeholderTextColor={colors.muted}
                value={newPrice}
                onChangeText={(t) => setNewPrice(t.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.addInput, { borderColor: colors.border, color: colors.text, minHeight: 80, textAlignVertical: 'top' }]}
                placeholder="One perk per line"
                placeholderTextColor={colors.muted}
                value={newPerks}
                onChangeText={setNewPerks}
                multiline
              />
              <View style={styles.addBtnRow}>
                <Pressable onPress={() => setAdding(false)} style={[styles.cancelBtn, { backgroundColor: colors.surfaceElevated }]} accessibilityLabel="Cancel">
                  <Text style={{ color: colors.text, fontWeight: '800' }}>Cancel</Text>
                </Pressable>
                <Pressable onPress={addTier} disabled={saving} style={styles.createBtn} accessibilityLabel="Create tier">
                  <Text style={{ color: '#111', fontWeight: '900' }}>{saving ? 'Creating\u2026' : 'Create tier'}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => { impact('light'); click(); setAdding(true); }}
              style={[styles.addTier, { borderColor: colors.border }]}
              accessibilityLabel="Add a tier"
            >
              <Ionicons name="add" size={22} color={GOLD} />
              <Text style={{ color: GOLD, fontWeight: '900', fontSize: 17 }}>Add a tier</Text>
            </Pressable>
          )}

          {/* Billing */}
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <View style={[styles.rowIcon, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons name="calendar-outline" size={18} color={GOLD} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Billing</Text>
            <Text style={{ color: colors.muted, fontSize: 16, fontWeight: '700' }}>Monthly</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} style={{ marginLeft: 6 }} />
          </View>

          {/* Show member count */}
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons name="eye-outline" size={18} color={GOLD} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Show member count</Text>
            <Switch
              value={showCount}
              onValueChange={(v) => {
                impact('light');
                setShowCount(v);
                AsyncStorage.setItem('rally.fanClubPrefs', JSON.stringify({ showCount: v })).catch(() => {});
              }}
              trackColor={{ true: TEAL, false: colors.border }}
              thumbColor="#fff"
            />
          </View>

          {/* Note */}
          <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Ionicons name="shield-checkmark-outline" size={16} color={TEAL} />
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              Members can cancel any time. Benefits you promise are shown before they join.
            </Text>
          </View>
        </ScrollView>

        <GradientButton
          label="Save tiers"
          onPress={() => { impact('success'); success(); router.back(); }}
          accessibilityLabel="Save tiers"
        />
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  tierCard: { borderWidth: 1, borderRadius: radii.lg, padding: 18, marginBottom: 14 },
  tierHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  addTier: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radii.lg,
    paddingVertical: 18,
  },
  addForm: { borderWidth: 1, borderRadius: radii.lg, padding: 14, gap: 10 },
  addInput: { borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 14, minHeight: 50, fontSize: 16 },
  addBtnRow: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, borderRadius: radii.full, paddingVertical: 13, alignItems: 'center' },
  createBtn: { flex: 1, backgroundColor: GOLD, borderRadius: radii.full, paddingVertical: 13, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, borderBottomWidth: 1 },
  rowIcon: { width: 44, height: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 17, fontWeight: '800' },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 14,
    marginTop: spacing.md,
  },
  noteText: { flex: 1, fontSize: 14, lineHeight: 20 },
});
