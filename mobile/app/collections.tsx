/** Collections - Rally design (mock 22)
 * Curate saved Moments into shareable sets. Real data from
 * /api/collections. Public Collections get a shareable link.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, TextInput, Pressable, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GradientButton, EmptyState } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { api } from '@/lib/api';
import { spacing, radii } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';

type Collection = {
  id: string;
  title: string;
  isPublic: boolean;
  momentIds: string[];
};

const PAIRS: [string, string][] = [
  ['#E9355B', '#7C4DFF'],
  ['#F57C00', '#FFA726'],
  ['#34D399', '#E9355B'],
  ['#FFA726', '#34D399'],
  ['#7C4DFF', '#F57C00'],
  ['#E9355B', '#FFA726'],
];

function Thumb({ seed }: { seed: number }) {
  const a = PAIRS[seed % PAIRS.length];
  const b = PAIRS[(seed + 2) % PAIRS.length];
  const c = PAIRS[(seed + 4) % PAIRS.length];
  const d = PAIRS[(seed + 1) % PAIRS.length];
  return (
    <View style={styles.thumb}>
      <LinearGradient colors={a} style={styles.tile} />
      <LinearGradient colors={b} style={styles.tile} />
      <LinearGradient colors={c} style={styles.tile} />
      <LinearGradient colors={d} style={styles.tile} />
    </View>
  );
}

export default function CollectionsScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();
  const { click } = useSounds();
  const router = useRouter();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await api<{ collections: Collection[] }>('/api/collections/me');
      setCollections(r.collections || []);
    } catch {
      // offline
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create() {
    if (!title.trim()) return;
    setBusy(true);
    impact('medium');
    try {
      await api('/api/collections', {
        method: 'POST',
        body: JSON.stringify({ title: title.trim(), isPublic: false }),
      });
      setTitle('');
      setCreating(false);
      impact('success');
      await load();
    } catch (e: any) {
      Alert.alert('Create failed', e.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function togglePublic(c: Collection) {
    impact('medium');
    try {
      await api('/api/collections/' + c.id, {
        method: 'PATCH',
        body: JSON.stringify({ isPublic: !c.isPublic }),
      });
      await load();
    } catch (e: any) {
      Alert.alert('Update failed', e.message || 'Please try again.');
    }
  }

  async function remove(id: string) {
    impact('medium');
    try {
      await api('/api/collections/' + id, { method: 'DELETE' });
      await load();
    } catch (e: any) {
      Alert.alert('Delete failed', e.message || 'Please try again.');
    }
  }

  async function shareLink(c: Collection) {
    impact('light');
    try {
      await Share.share({
        message: c.title + ' — a Collection on Rally' + (c.isPublic ? ' · anyone with the link can view' : ''),
      });
    } catch { /* dismissed */ }
  }

  function menu(c: Collection) {
    impact('light');
    Alert.alert(c.title, undefined, [
      { text: c.isPublic ? 'Make private' : 'Make public', onPress: () => togglePublic(c) },
      { text: 'Share link', onPress: () => shareLink(c) },
      { text: 'Delete', style: 'destructive', onPress: () => remove(c.id) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  const publicCollection = collections.find((c) => c.isPublic) || null;

  return (
    <SwipeBack>
      <Screen refreshing={refreshing} onRefresh={load}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel={'Back'}>
            <Ionicons name={'chevron-back'} size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Collections</Text>
          <Pressable
            onPress={() => {
              click();
              impact('light');
              setCreating(!creating);
            }}
            hitSlop={10}
          >
            <Text style={[styles.newBtn, { color: GOLD }]}>New</Text>
          </Pressable>
        </View>

        {/* List */}
        {collections.length === 0 && !refreshing && !creating ? (
          <EmptyState
            icon={'albums-outline'}
            title={'No collections yet'}
            body={'Start one to gather your favorite Moments in a set you can share.'}
          />
        ) : (
          <View style={{ gap: 14 }}>
            {collections.map((c, i) => (
              <View key={c.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Thumb seed={i} />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{c.title}</Text>
                  <View style={styles.chipRow}>
                    <View style={[styles.chip, { backgroundColor: colors.surfaceElevated || colors.bg }]}>
                      <Text style={[styles.chipText, { color: colors.muted }]}>{c.momentIds?.length ?? 0} Moments</Text>
                    </View>
                    {c.isPublic ? (
                      <View style={[styles.chip, { backgroundColor: colors.surfaceElevated || colors.bg }]}>
                        <Text style={[styles.chipText, { color: colors.muted }]}>Link ready</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                <Pressable onPress={() => menu(c)} hitSlop={10} accessibilityLabel={'Collection options'}>
                  <Ionicons name={'ellipsis-horizontal'} size={20} color={colors.muted} />
                </Pressable>
              </View>
            ))}

            {/* Start a new Collection */}
            {creating ? (
              <View style={[styles.createCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                  placeholder={'Collection title'}
                  placeholderTextColor={colors.muted}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={80}
                  autoFocus
                />
                <GradientButton label={busy ? 'Creating' : 'Create Collection'} onPress={create} loading={busy} disabled={busy || !title.trim()} fullWidth />
              </View>
            ) : (
              <Pressable
                style={[styles.dashed, { borderColor: colors.border }]}
                onPress={() => {
                  click();
                  impact('light');
                  setCreating(true);
                }}
              >
                <Ionicons name={'add'} size={22} color={colors.muted} />
                <Text style={[styles.dashedText, { color: colors.muted }]}>Start a new Collection</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Share a Collection */}
        <Text style={[styles.section, { color: colors.muted }]}>SHARE A COLLECTION</Text>
        {publicCollection ? (
          <Pressable
            style={[styles.shareRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => shareLink(publicCollection)}
          >
            <View style={[styles.linkTile, { backgroundColor: colors.surfaceElevated || colors.bg }]}>
              <Ionicons name={'link'} size={20} color={GOLD} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.shareTitle, { color: colors.text }]} numberOfLines={1}>{publicCollection.title}</Text>
              <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>Anyone with the link can view</Text>
            </View>
            <Text style={[styles.copyText, { color: GOLD }]}>Share</Text>
          </Pressable>
        ) : (
          <Text style={[styles.shareHint, { color: colors.muted }]}>
            Make a Collection public from its menu to get a shareable link.
          </Text>
        )}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  h1: { fontSize: 22, fontWeight: '900' },
  newBtn: { fontSize: 17, fontWeight: '800' },
  card: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radii.lg, padding: 14 },
  thumb: { width: 64, height: 64, borderRadius: 12, overflow: 'hidden', flexDirection: 'row', flexWrap: 'wrap' },
  tile: { width: '50%', height: '50%' },
  cardTitle: { fontSize: 16, fontWeight: '800', lineHeight: 21 },
  chipRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  chip: { borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontSize: 12, fontWeight: '700' },
  dashed: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: radii.lg, paddingVertical: 26 },
  dashedText: { fontSize: 16, fontWeight: '800' },
  createCard: { borderWidth: 1, borderRadius: radii.lg, padding: 14, gap: 12 },
  input: { borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  section: { fontSize: 13, fontWeight: '900', letterSpacing: 0.8, marginTop: spacing.xl, marginBottom: 10 },
  shareRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: radii.lg, padding: 14 },
  linkTile: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  shareTitle: { fontSize: 15, fontWeight: '800' },
  copyText: { fontSize: 16, fontWeight: '900' },
  shareHint: { fontSize: 13, lineHeight: 19, marginBottom: spacing.lg },
});
