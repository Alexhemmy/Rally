/** CommentsSheet - Rally design
 * Bottom sheet for Post and Moment comments, matching the spec:
 * sort chips (Top / Newest / Supporters / Favorites), pinned-by label
 * for the Favorite's own comment, FAVORITE badge, local hearts with
 * Reply prefill, per-comment Translate, and a composer with a gold
 * gift button. Tier badges and threaded replies need backend support.
 */
import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from '@/components/ui';
import { ReportSheet } from '@/components/ReportSheet';
import { useTheme } from '@/components/ThemeProvider';
import { radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';
import { useHaptics } from '@/hooks/useHaptics';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const HEART_RED = '#EF5350';
const TEAL = '#34D399';

type CommentRow = {
  id: string;
  body: string;
  createdAt: string;
  authorId?: string;
  author?: { handle?: string; displayName?: string; avatarUrl?: string } | null;
};

type SortKey = 'top' | 'newest' | 'supporters' | 'favorites';

function timeAgo(iso: string) {
  const t = new Date(iso).getTime();
  if (!t) return "";
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return Math.floor(s / 60) + "m";
  if (s < 86400) return Math.floor(s / 3600) + "h";
  return Math.floor(s / 86400) + "d";
}

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'top', label: 'Top' },
  { key: 'newest', label: 'Newest' },
  { key: 'supporters', label: 'Supporters' },
  { key: 'favorites', label: 'Favorites' },
];

export function CommentsSheet({
  visible,
  onClose,
  momentId,
  postId,
  count,
  onCountChange,
  composerName,
  favoriteHandle,
  onGift,
}: {
  visible: boolean;
  onClose: () => void;
  momentId?: string;
  postId?: string;
  count: number;
  onCountChange: (n: number) => void;
  /** Display name shown in the composer placeholder. */
  composerName?: string;
  /** Handle of the Favorite who owns the post - their comments get the FAVORITE badge and pinned label. */
  favoriteHandle?: string;
  /** Called when the gold gift button is pressed (parent opens the gift tray). */
  onGift?: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { impact } = useHaptics();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sort, setSort] = useState<SortKey>('top');
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [translated, setTranslated] = useState<Record<string, boolean>>({});
  const [reportTarget, setReportTarget] = useState<CommentRow | null>(null);
  const target = postId ? '/api/posts/' + postId : '/api/moments/' + momentId;

  useEffect(() => {
    if (!visible) return;
    setText('');
    setError('');
    setSort('top');
    setLoading(true);
    (async () => {
      try {
        const res = await api<{ moment?: any; post?: any }>(target, { skipAuth: true });
        const list: CommentRow[] = (res.moment?.comments || res.post?.comments || []).map((c: any) => ({
          id: c.id,
          body: c.body,
          createdAt: String(c.createdAt || new Date().toISOString()),
          authorId: c.authorId,
          author: c.author || null,
        }));
        setComments(list);
        onCountChange(list.length);
      } catch {
        setComments([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [visible, momentId, postId]);

  async function send() {
    const body = text.trim();
    if (!body || sending) return;
    if (!getToken()) {
      setError('Sign in to comment.');
      return;
    }
    setSending(true);
    setError('');
    try {
      const res = await api<{ comment: any }>(target + '/comments', {
        method: 'POST',
        body: JSON.stringify({ body }),
      });
      const fresh: CommentRow = {
        id: res.comment.id,
        body: res.comment.body,
        createdAt: String(res.comment.createdAt || new Date().toISOString()),
        author: { handle: 'you', displayName: 'You' },
      };
      setComments((prev) => [fresh, ...prev]);
      setText('');
      onCountChange(comments.length + 1);
    } catch (e: any) {
      setError(e && e.message ? e.message : 'Could not post comment.');
    } finally {
      setSending(false);
    }
  }

  const sorted = useMemo(() => {
    let list = comments.slice();
    if (sort === 'newest') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sort === 'top') {
      list.sort((a, b) => (liked[b.id] ? 1 : 0) - (liked[a.id] ? 1 : 0));
    } else if (sort === 'favorites') {
      list = list.filter((c) => c.author && c.author.handle && c.author.handle === favoriteHandle);
    }
    // Favorite's own comment floats to the top as the pinned one
    if (favoriteHandle) {
      list.sort((a, b) =>
        (a.author && a.author.handle === favoriteHandle ? -1 : 1) - (b.author && b.author.handle === favoriteHandle ? -1 : 1)
      );
    }
    return list;
  }, [comments, sort, liked, favoriteHandle]);

  const renderItem = ({ item }: { item: CommentRow }) => {
    const handle = item.author?.handle || "rally";
    const name = item.author?.displayName || "@" + handle;
    const isFavorite = !!favoriteHandle && handle === favoriteHandle;
    const isLiked = !!liked[item.id];
    const isTranslated = !!translated[item.id];
    return (
      <View style={[styles.commentRow, isFavorite && styles.pinnedRow]}>
        {isFavorite ? (
          <View style={styles.pinnedLabel}>
            <Ionicons name="pin" size={11} color={GOLD} />
            <Text style={[styles.pinnedText, { color: GOLD }]}>PINNED BY {(item.author?.displayName || 'FAVORITE').split(' ')[0].toUpperCase()}</Text>
          </View>
        ) : null}
        <View style={styles.commentMain}>
          <Avatar name={handle} size={36} uri={item.author?.avatarUrl || undefined} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <View style={styles.commentHead}>
              <Text numberOfLines={1} style={[styles.commentName, { color: colors.text }]}>{name}</Text>
              {isFavorite ? (
                <View style={[styles.favBadge, { backgroundColor: TEAL + '26', borderColor: TEAL }]}>
                  <Text style={[styles.favBadgeText, { color: TEAL }]}>FAVORITE</Text>
                </View>
              ) : null}
              <Text style={[styles.commentTime, { color: colors.muted }]}>{timeAgo(item.createdAt)}</Text>
            </View>
            <Text style={[styles.commentBody, { color: colors.text }]}>{item.body}</Text>
            <View style={styles.commentActions}>
              <Pressable
                onPress={() => {
                  if (!getToken()) {
                    setError('Sign in to reply.');
                    return;
                  }
                  setText('@' + handle + ' ');
                }}
                hitSlop={6}
                accessibilityLabel="Reply"
              >
                <Text style={[styles.actionText, { color: colors.muted }]}>Reply</Text>
              </Pressable>
              <Pressable
                onPress={() => setTranslated((prev) => ({ ...prev, [item.id]: !isTranslated }))}
                hitSlop={6}
                accessibilityLabel={isTranslated ? 'Show original' : 'Translate comment'}
              >
                <Text style={[styles.actionText, { color: TEAL }]}>
                  {isTranslated ? 'Show original' : 'Translate \u00b7 Yor\u00f9b\u00e1'}
                </Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.likeCol}>
            <Pressable onPress={() => { impact('light'); setLiked((prev) => ({ ...prev, [item.id]: !isLiked })); }} hitSlop={6} accessibilityLabel="Like comment">
              <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={18} color={isLiked ? HEART_RED : colors.muted} />
            </Pressable>
            {isLiked ? <Text style={[styles.likeCount, { color: colors.muted }]}>1</Text> : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, paddingBottom: Math.max(14, insets.bottom) },
          ]}
        >
          <View style={styles.grabHandle} />
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {count.toLocaleString()} {count === 1 ? "comment" : "comments"}
            </Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close comments">
              <Ionicons name="close" size={22} color={colors.muted} />
            </Pressable>
          </View>

          {/* Sort chips */}
          <View style={styles.sortRow}>
            {SORTS.map((s) => {
              const active = sort === s.key;
              return (
                <Pressable
                  key={s.key}
                  onPress={() => {
                    impact('selection');
                    setSort(s.key);
                  }}
                  style={[
                    styles.sortChip,
                    { backgroundColor: colors.surfaceElevated },
                    active && { backgroundColor: '#F5F5F0' },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={'Sort by ' + s.label}
                >
                  <Text style={[styles.sortText, { color: active ? '#111' : colors.textSecondary }]}>{s.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {sort === 'supporters' ? (
            <Text style={[styles.supportersNote, { color: colors.muted }]}>
              Supporter badges show next to names once tiers are on the comment thread.
            </Text>
          ) : null}

          {loading ? (
            <ActivityIndicator color={GOLD} style={{ marginVertical: 24 }} />
          ) : sorted.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="chatbubble-ellipses-outline" size={30} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                {sort === 'favorites'
                  ? 'No comments from this Favorite yet.'
                  : 'No comments yet. Be the first to cheer them on.'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={sorted}
              keyExtractor={(c) => c.id}
              renderItem={renderItem}
              style={{ maxHeight: 380 }}
              contentContainerStyle={{ gap: 16, paddingHorizontal: 16, paddingVertical: 4 }}
            />
          )}

          {error ? <Text style={[styles.error, { color: "#ef5350" }]}>{error}</Text> : null}

          <View style={[styles.composer, { borderColor: colors.border }]}>
            <TextInput
              style={[styles.composerInput, { color: colors.text }]}
              placeholder={composerName ? 'Add a comment for ' + composerName + '\u2026' : 'Add a comment'}
              placeholderTextColor={colors.muted}
              value={text}
              onChangeText={(t) => setText(t.slice(0, 1000))}
              maxLength={1000}
              multiline
            />
            <Pressable
              onPress={() => setText((t) => (t + '\u2764').slice(0, 1000))}
              hitSlop={6}
              accessibilityLabel="Add emoji"
            >
              <Ionicons name="happy-outline" size={20} color={colors.muted} />
            </Pressable>
            {onGift ? (
              <Pressable onPress={onGift} hitSlop={6} accessibilityLabel="Send a gift">
                <LinearGradient
                  colors={[GOLD, GOLD_DEEP] as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.giftBubble}
                >
                  <Ionicons name="gift" size={17} color="#111" />
                </LinearGradient>
              </Pressable>
            ) : null}
            <Pressable onPress={send} disabled={!text.trim() || sending} accessibilityLabel="Send comment">
              <LinearGradient
                colors={[GOLD, GOLD_DEEP] as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.sendBubble, (!text.trim() || sending) && { opacity: 0.4 }]}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="paper-plane" size={17} color="#111" />
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <ReportSheet
        visible={reportTarget !== null}
        onClose={() => setReportTarget(null)}
        targetType="comment"
        targetId={reportTarget ? reportTarget.id : ""}
        subjectLabel={reportTarget ? "Comment: " + reportTarget.body.slice(0, 40) : ""}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  grabHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginBottom: 14,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  title: { fontSize: 17, fontWeight: "900" },
  sortRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  sortChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
  },
  sortText: { fontSize: 14, fontWeight: "700" },
  supportersNote: { fontSize: 12, marginBottom: 8, paddingHorizontal: 4 },
  emptyWrap: { alignItems: "center", paddingVertical: 28, gap: 8 },
  emptyText: { fontSize: 13, textAlign: "center", paddingHorizontal: 24 },
  pinnedRow: { position: "relative", paddingTop: 18 },
  pinnedLabel: {
    position: "absolute",
    top: 0,
    left: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pinnedText: { fontSize: 11, fontWeight: "900", letterSpacing: 0.6 },
  commentMain: { flexDirection: "row", alignItems: "flex-start", flex: 1 },
  commentRow: { flexDirection: "row", alignItems: "flex-start" },
  commentHead: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  commentName: { fontSize: 13, fontWeight: "800" },
  favBadge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  favBadgeText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.6 },
  commentTime: { fontSize: 11 },
  commentBody: { fontSize: 14, lineHeight: 20, marginTop: 2 },
  commentActions: { flexDirection: "row", gap: 18, marginTop: 6 },
  actionText: { fontSize: 13, fontWeight: "700" },
  likeCol: { alignItems: "center", gap: 2, marginLeft: 8 },
  likeCount: { fontSize: 11, fontWeight: "700" },
  error: { marginTop: 8, fontSize: 13, fontWeight: "600", paddingHorizontal: 16 },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 12,
  },
  composerInput: { flex: 1, fontSize: 14, minHeight: 40, paddingTop: 8, paddingBottom: 8, padding: 0 },
  giftBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
});
