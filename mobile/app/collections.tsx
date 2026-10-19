import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, TextInput } from 'react-native';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SwipeBack } from '@/components/SwipeBack';
import { api } from '@/lib/api';
import { colors, spacing, radii } from '@/constants/theme';

type Collection = { id: string; title: string; isPublic: boolean; momentIds: string[] };

export default function Page() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [title, setTitle] = useState('');
  const [msg, setMsg] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await api<{ collections: Collection[] }>('/api/collections/me');
      setCollections(r.collections || []);
    } catch { /* offline */ } finally { setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function create() {
    setMsg('');
    try {
      await api('/api/collections', {
        method: 'POST',
        body: JSON.stringify({ title, isPublic: false }),
      });
      setTitle('');
      load();
    } catch (e: any) {
      setMsg(e.message || 'Create failed');
    }
  }

  async function togglePublic(c: Collection) {
    try {
      await api(`/api/collections/${c.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isPublic: !c.isPublic }),
      });
      load();
    } catch (e: any) {
      setMsg(e.message || 'Update failed');
    }
  }

  async function remove(id: string) {
    try {
      await api(`/api/collections/${id}`, { method: 'DELETE' });
      load();
    } catch (e: any) {
      setMsg(e.message || 'Delete failed');
    }
  }

  return (
    <SwipeBack>
      <Screen refreshing={refreshing} onRefresh={load}>
        <Text style={styles.h1}>Collections</Text>
        <Text style={styles.muted}>Curate saved Moments into private or shareable sets.</Text>
        {msg ? <Text style={styles.badge}>{msg}</Text> : null}
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="New collection title"
            placeholderTextColor={colors.muted}
            value={title}
            onChangeText={setTitle}
          />
          <PrimaryButton label="Create collection" onPress={create} />
        </View>
        {collections.map((c) => (
          <View key={c.id} style={styles.card}>
            <Text style={styles.name}>{c.title}</Text>
            <Text style={styles.badge}>
              {c.momentIds?.length ?? 0} moments · {c.isPublic ? 'public' : 'private'}
            </Text>
            <View style={styles.row}>
              <PrimaryButton
                label={c.isPublic ? 'Make private' : 'Share'}
                onPress={() => togglePublic(c)}
              />
              <PrimaryButton label="Delete" onPress={() => remove(c.id)} />
            </View>
          </View>
        ))}
        {!refreshing && collections.length === 0 && (
          <Text style={styles.muted}>No collections yet.</Text>
        )}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: spacing.sm, marginBottom: 8 },
  muted: { color: colors.muted, marginBottom: 12, fontSize: 14 },
  name: { color: colors.text, fontWeight: '700', fontSize: 16, marginBottom: 4 },
  badge: { color: colors.primaryHover, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: 10,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    color: colors.text,
    padding: 12,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
});
