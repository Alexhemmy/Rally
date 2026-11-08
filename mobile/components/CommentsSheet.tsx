/** CommentsSheet - Rally design
 * Bottom sheet for Moment comments: list with author avatars,
 * per-comment report, and a composer that posts to /api/moments/:id/comments.
 */
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from '@/components/ui';
import { ReportSheet } from '@/components/ReportSheet';
import { useTheme } from '@/components/ThemeProvider';
import { radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';

type CommentRow = {
  id: string;
  body: string;
  createdAt: string;
  authorId?: string;
  author?: { handle?: string; displayName?: string; avatarUrl?: string } | null;
};

function timeAgo(iso: string) {
  const t = new Date(iso).getTime();
  if (!t) return "";
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return Math.floor(s / 60) + "m";
  if (s < 86400) return Math.floor(s / 3600) + "h";
  return Math.floor(s / 86400) + "d";
}

export function CommentsSheet({
  visible,
  onClose,
  momentId,
  count,
  onCountChange,
}: {
  visible: boolean;
  onClose: () => void;
  momentId: string;
  count: number;
  onCountChange: (n: number) => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [reportTarget, setReportTarget] = useState<CommentRow | null>(null);

  useEffect(() => {
    if (!visible) return;
    setText('');
    setError('');
    setLoading(true);
    (async () => {
      try {
        const res = await api<{ moment: any }>('/api/moments/' + momentId, { skipAuth: true });
        const list: CommentRow[] = (res.moment?.comments || []).map((c: any) => ({
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
  }, [visible, momentId]);

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
      const res = await api<{ comment: any }>('/api/moments/' + momentId + '/comments', {
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

  const renderItem = ({ item }: { item: CommentRow }) => {
    const handle = item.author?.handle || "rally";
    const name = item.author?.displayName || "@" + handle;
    return (
      <View style={styles.commentRow}>
        <Avatar name={handle} size={36} uri={item.author?.avatarUrl || undefined} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={styles.commentHead}>
            <Text numberOfLines={1} style={[styles.commentName, { color: colors.text }]}>{name}</Text>
            <Text style={[styles.commentTime, { color: colors.muted }]}>{timeAgo(item.createdAt)}</Text>
          </View>
          <Text style={[styles.commentBody, { color: colors.text }]}>{item.body}</Text>
        </View>
        <Pressable
          onPress={() => setReportTarget(item)}
          hitSlop={10}
          accessibilityLabel="Report comment"
          style={styles.flagBtn}
        >
          <Ionicons name="flag-outline" size={16} color={colors.muted} />
        </Pressable>
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
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]}>Comments</Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>
                {count} {count === 1 ? "comment" : "comments"}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close comments">
              <Ionicons name="close" size={22} color={colors.muted} />
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator color={GOLD} style={{ marginVertical: 24 }} />
          ) : comments.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="chatbubble-ellipses-outline" size={30} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                No comments yet. Be the first to cheer them on.
              </Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(c) => c.id}
              renderItem={renderItem}
              style={{ maxHeight: 340 }}
              contentContainerStyle={{ gap: 14, paddingHorizontal: 16 }}
            />
          )}

          {error ? <Text style={[styles.error, { color: "#ef5350" }]}>{error}</Text> : null}

          <View style={[styles.composer, { borderColor: colors.border }]}>
            <TextInput
              style={[styles.composerInput, { color: colors.text }]}
              placeholder="Add a comment"
              placeholderTextColor={colors.muted}
              value={text}
              onChangeText={(t) => setText(t.slice(0, 1000))}
              maxLength={1000}
              multiline
            />
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
  header: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  title: { fontSize: 16, fontWeight: "900" },
  subtitle: { fontSize: 12, marginTop: 1 },
  emptyWrap: { alignItems: "center", paddingVertical: 28, gap: 8 },
  emptyText: { fontSize: 13, textAlign: "center", paddingHorizontal: 24 },
  commentRow: { flexDirection: "row", alignItems: "flex-start" },
  commentHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  commentName: { fontSize: 13, fontWeight: "800", maxWidth: 180 },
  commentTime: { fontSize: 11 },
  commentBody: { fontSize: 14, lineHeight: 20, marginTop: 2 },
  flagBtn: { padding: 6 },
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
  sendBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
});