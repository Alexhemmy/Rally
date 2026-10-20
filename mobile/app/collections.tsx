/** Collections
 * Curate saved Moments into private or shareable sets.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, TextInput } from 'react-native';
import { Screen } from '@/components/Screen';
import { GradientButton, GlassCard, SectionHeader, EmptyState } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { api } from '@/lib/api';
import { spacing, radii, type as typo } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';

type Collection = {
  id: string;
  title: string;
  isPublic: boolean;
  momentIds: string[];
};

export default function CollectionsScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [title, setTitle] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

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
    if (!title.trim()) {
      setMsg({ type: 'error', text: 'Please enter a title' });
      return;
    }

    setMsg(null);
    setCreating(true);
    impact('medium');

    try {
      await api('/api/collections', {
        method: 'POST',
        body: JSON.stringify({ title: title.trim(), isPublic: false }),
      });
      setTitle('');
      setMsg({ type: 'success', text: 'Collection created' });
      impact('success');
      await load();
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Create failed' });
    } finally {
      setCreating(false);
    }
  }

  async function togglePublic(c: Collection) {
    setActingId(c.id);
    setMsg(null);
    impact('medium');

    try {
      await api(`/api/collections/${c.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isPublic: !c.isPublic }),
      });
      setMsg({
        type: 'success',
        text: c.isPublic ? 'Made private' : 'Now public',
      });
      impact('success');
      await load();
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Update failed' });
    } finally {
      setActingId(null);
    }
  }

  async function remove(id: string) {
    setActingId(id);
    setMsg(null);
    impact('medium');

    try {
      await api(`/api/collections/${id}`, { method: 'DELETE' });
      setMsg({ type: 'success', text: 'Collection deleted' });
      impact('success');
      await load();
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Delete failed' });
    } finally {
      setActingId(null);
    }
  }

  return (
    <SwipeBack>
      <Screen refreshing={refreshing} onRefresh={load}>
        {/* Header */}
        <Text style={[styles.h1, { color: colors.text }]}>Collections</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Curate saved Moments into private or shareable sets.
        </Text>

        {/* Feedback */}
        {msg && (
          <View
            style={[
              styles.feedback,
              {
                backgroundColor:
                  msg.type === 'success'
                    ? colors.success + '18'
                    : colors.danger + '18',
              },
            ]}
          >
            <Text
              style={{
                color: msg.type === 'success' ? colors.success : colors.danger,
                fontWeight: '700',
                fontSize: 13,
              }}
            >
              {msg.text}
            </Text>
          </View>
        )}

        {/* Create new */}
        <GlassCard style={{ marginBottom: spacing.md }}>
          <SectionHeader title="New collection" />

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.bg,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Collection title"
            placeholderTextColor={colors.muted}
            value={title}
            onChangeText={setTitle}
            maxLength={80}
          />

          <GradientButton
            label="Create collection"
            onPress={create}
            loading={creating}
            disabled={creating || !title.trim()}
            fullWidth
          />
        </GlassCard>

        {/* List */}
        {collections.length === 0 && !refreshing ? (
          <EmptyState
            icon="albums-outline"
            title="No collections yet"
            body="Create one to start organizing your favorite Moments."
          />
        ) : (
          <View style={{ gap: 12 }}>
            {collections.map((c) => (
              <GlassCard key={c.id}>
                <Text style={[styles.collectionTitle, { color: colors.text }]}>
                  {c.title}
                </Text>

                <View style={styles.meta}>
                  <Text style={{ color: colors.muted, fontSize: 13 }}>
                    {c.momentIds?.length ?? 0} moments
                  </Text>
                  <View
                    style={[
                      styles.visibilityPill,
                      {
                        backgroundColor: c.isPublic
                          ? colors.primaryMuted
                          : colors.surfaceElevated,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: c.isPublic ? colors.primary : colors.muted,
                        fontSize: 12,
                        fontWeight: '700',
                      }}
                    >
                      {c.isPublic ? 'Public' : 'Private'}
                    </Text>
                  </View>
                </View>

                <View style={styles.actions}>
                  <GradientButton
                    label={c.isPublic ? 'Make private' : 'Make public'}
                    size="sm"
                    variant="ghost"
                    onPress={() => togglePublic(c)}
                    loading={actingId === c.id}
                    disabled={!!actingId}
                  />
                  <GradientButton
                    label="Delete"
                    size="sm"
                    variant="outline"
                    onPress={() => remove(c.id)}
                    loading={actingId === c.id}
                    disabled={!!actingId}
                  />
                </View>
              </GlassCard>
            ))}
          </View>
        )}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: {
    ...typo.h1,
    marginTop: spacing.sm,
    marginBottom: 6,
  },
  subtitle: {
    ...typo.body,
    marginBottom: spacing.lg,
    lineHeight: 21,
  },
  feedback: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  collectionTitle: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 6,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  visibilityPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
});
