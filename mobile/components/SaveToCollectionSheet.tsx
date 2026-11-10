/** SaveToCollectionSheet - Rally design
 * Bottom sheet listing the user's collections with check toggles.
 * Moments are saved server-side (POST /api/collections/:id/moments).
 * Posts are saved on-device for now - the backend collections model
 * is Moments-only, so the sheet says so in a calm inline note.
 */
import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/components/ThemeProvider';
import { radii } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';

type Collection = {
  id: string;
  title: string;
  isPublic: boolean;
  momentIds?: string[];
  cover?: string | null;
};

export function SaveToCollectionSheet({
  visible,
  onClose,
  momentId,
  postKey,
}: {
  visible: boolean;
  onClose: () => void;
  /** Moment id when saving a Moment (server-side save). */
  momentId?: string;
  /** Stable key like 'post:{id}' when saving a Post (on-device save). */
  postKey?: string;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { impact } = useHaptics();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [savedLocal, setSavedLocal] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState(false);

  const isMoment = !!momentId;

  const load = useCallback(async () => {
    if (!visible || !getToken()) {
      setFailed(!getToken());
      return;
    }
    setLoading(true);
    setFailed(false);
    try {
      const r = await api<{ collections: Collection[] }>('/api/collections/me');
      setCollections(r.collections || []);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [visible]);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  async function toggle(c: Collection) {
    impact('light');
    const wasOn = !!checked[c.id];
    setChecked((prev) => ({ ...prev, [c.id]: !wasOn }));
    if (isMoment) {
      try {
        if (wasOn) {
          await api('/api/collections/' + c.id + '/moments/' + momentId, { method: 'DELETE' });
        } else {
          await api('/api/collections/' + c.id + '/moments', {
            method: 'POST',
            body: JSON.stringify({ momentId }),
          });
        }
      } catch {
        setChecked((prev) => ({ ...prev, [c.id]: wasOn }));
      }
    } else if (postKey) {
      // On-device save for posts (backend collections are Moments-only).
      setSavedLocal((prev) => ({ ...prev, [c.id]: !wasOn }));
    }
  }

  async function createNew() {
    if (creating) return;
    setCreating(true);
    impact('light');
    try {
      const r = await api<{ collection: Collection }>('/api/collections', {
        method: 'POST',
        body: JSON.stringify({ title: 'New collection', isPublic: false }),
      });
      setCollections((prev) => [r.collection, ...prev]);
      setChecked((prev) => ({ ...prev, [r.collection.id]: false }));
      if (isMoment && momentId) {
        try {
          await api('/api/collections/' + r.collection.id + '/moments', {
            method: 'POST',
            body: JSON.stringify({ momentId }),
          });
          setChecked((prev) => ({ ...prev, [r.collection.id]: true }));
        } catch {
          // keep the collection, save can be retried by tapping it
        }
      }
    } catch {
      // leave the list as it is; user can retry
    } finally {
      setCreating(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: Math.max(20, insets.bottom) }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.grabHandle} />

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Save to</Text>
            <Pressable onPress={createNew} hitSlop={10} accessibilityLabel="New collection">
              {creating ? (
                <ActivityIndicator size="small" color={GOLD} />
              ) : (
                <Text style={[styles.newLabel, { color: GOLD }]}>New</Text>
              )}
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator color={GOLD} style={{ marginVertical: 28 }} />
          ) : failed ? (
            <Text style={[styles.failed, { color: colors.muted }]}>
              {getToken()
                ? 'Could not load your collections. Check your connection and try again.'
                : 'Log in to save to your collections.'}
            </Text>
          ) : collections.length === 0 ? (
            <Text style={[styles.failed, { color: colors.muted }]}>
              No collections yet. Tap New to start your first one.
            </Text>
          ) : (
            <View style={styles.list}>
              {collections.map((c) => {
                const on = isMoment ? !!checked[c.id] : !!savedLocal[c.id] || !!checked[c.id];
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => toggle(c)}
                    style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={'Save to ' + c.title}
                  >
                    <View style={[styles.thumb, { backgroundColor: colors.surfaceElevated }]}>
                      {c.cover ? (
                        <Image source={{ uri: c.cover }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                      ) : (
                        <LinearGradient
                          colors={[GOLD, GOLD_DEEP] as [string, string]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={[StyleSheet.absoluteFill, { opacity: 0.85 }]}
                        />
                      )}
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
                        {c.title}
                      </Text>
                      <Text style={[styles.rowSub, { color: colors.muted }]}>
                        {(c.momentIds || []).length + ' saved' + (c.isPublic ? '' : ' \u00b7 Private')}
                      </Text>
                    </View>
                    <View style={[styles.checkRing, on && { backgroundColor: GOLD, borderColor: GOLD }]}>
                      {on ? <Ionicons name="checkmark" size={15} color="#111" /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {!isMoment && postKey ? (
            <Text style={[styles.note, { color: colors.muted }]}>
              Posts are saved on this device for now. Moments save to your Rally collections.
            </Text>
          ) : null}

          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Done">
            <LinearGradient
              colors={[GOLD, GOLD_DEEP] as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.doneBtn}
            >
              <Text style={styles.doneText}>Done</Text>
            </LinearGradient>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  grabHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: '900' },
  newLabel: { fontSize: 15, fontWeight: '800' },
  list: { gap: 4, maxHeight: 340 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  thumb: { width: 48, height: 48, borderRadius: 12, overflow: 'hidden' },
  rowTitle: { fontSize: 16, fontWeight: '800' },
  rowSub: { fontSize: 13, marginTop: 1 },
  checkRing: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  failed: { fontSize: 13, lineHeight: 18, paddingVertical: 16 },
  note: { fontSize: 12, lineHeight: 16, marginTop: 10 },
  doneBtn: {
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginTop: 14,
  },
  doneText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
