/** Home tab - Rally design system
 * Home is the FEED for Posts (text and media updates by Favorites).
 * Story rail on top, post cards below with react, comment, gift,
 * share and report. Moments (video) live on the Moments tab.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, Image, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Avatar, EmptyState } from '@/components/ui';
import { CommentsSheet } from '@/components/CommentsSheet';
import { GiftTraySheet } from '@/components/GiftTraySheet';
import { ReportSheet } from '@/components/ReportSheet';
import { useTheme } from '@/components/ThemeProvider';
import { api, getToken } from '@/lib/api';
import { spacing, radii } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useShare } from '@/hooks/useShare';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const HEART_RED = '#EF5350';

type Post = {
  id: string;
  favoriteId: string;
  body: string;
  mediaUrls: string[];
  reactionCount: number;
  commentCount: number;
  createdAt: string;
  author: { handle: string; displayName: string; avatarUrl?: string | null };
};

function timeAgo(iso: string) {
  const t = new Date(iso).getTime();
  if (!t) return '';
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return Math.floor(s / 60) + 'm';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  return Math.floor(s / 86400) + 'd';
}

export default function HomeTab() {
  const { colors } = useTheme();
  const { impact } = useHaptics();
  const { shareMoment } = useShare();
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [reactedIds, setReactedIds] = useState<Record<string, boolean>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [commentsTarget, setCommentsTarget] = useState<Post | null>(null);
  const [giftTarget, setGiftTarget] = useState<Post | null>(null);
  const [sendingGift, setSendingGift] = useState(false);
  const [reportTarget, setReportTarget] = useState<Post | null>(null);
  const [commentCount, setCommentCount] = useState(0);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await api<{ posts: Post[] }>('/api/posts/feed');
      setPosts(r.posts || []);
    } catch {
      // offline or signed out
      setPosts([]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleReact(post: Post) {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    setBusyId(post.id);
    impact('light');
    try {
      const r = await api<{ reacted: boolean; reactionCount: number }>('/api/posts/' + post.id + '/react', { method: 'POST' });
      setReactedIds((prev) => ({ ...prev, [post.id]: r.reacted }));
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, reactionCount: r.reactionCount } : p)));
      if (r.reacted) impact('success');
    } catch {
      // ignore
    } finally {
      setBusyId(null);
    }
  }

  async function sendGift(giftId: string, message: string, anonymous: boolean) {
    if (!giftTarget) return;
    setSendingGift(true);
    impact('medium');
    try {
      await api('/api/gifts/send', {
        method: 'POST',
        body: JSON.stringify({
          favoriteHandle: giftTarget.author.handle,
          catalogItemId: giftId,
          message,
          isAnonymous: anonymous,
        }),
      });
      impact('success');
      setGiftTarget(null);
    } catch {
      // sheet shows its own state
    } finally {
      setSendingGift(false);
    }
  }

  // Story rail: your create tile first, then Favorites you follow
  const stories: Post['author'][] = [];
  const seen = new Set<string>();
  for (const p of posts) {
    if (!seen.has(p.author.handle)) {
      seen.add(p.author.handle);
      stories.push(p.author);
    }
  }

  return (
    <Screen refreshing={refreshing} onRefresh={load}>
      {/* Story rail */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, marginBottom: spacing.md }}
        contentContainerStyle={{ gap: 14, paddingRight: 16 }}
      >
        <Pressable style={styles.storyTile} onPress={() => router.push('/compose-moment')} accessibilityLabel={'Create'}>
          <LinearGradient
            colors={[GOLD, GOLD_DEEP] as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.youRing}
          >
            <View style={styles.youInner}>
              <Ionicons name={'add'} size={20} color={'#fff'} />
            </View>
          </LinearGradient>
          <Text style={[styles.storyName, { color: colors.text }]}>You</Text>
        </Pressable>
        {stories.map((a) => (
          <Pressable key={a.handle} style={styles.storyTile} onPress={() => router.push('/favorite/' + a.handle)} accessibilityLabel={a.displayName}>
            <Avatar name={a.handle} size={56} ring uri={a.avatarUrl || undefined} />
            <Text numberOfLines={1} style={[styles.storyName, { color: colors.text }]}>
              {a.displayName}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Posts feed */}
      {refreshing && posts.length === 0 ? (
        <ActivityIndicator color={GOLD} style={{ marginVertical: 32 }} />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={'newspaper-outline'}
          title={'No posts yet'}
          body={'Posts from Favorites you follow appear here. Follow a Favorite from Discover to fill your feed.'}
        />
      ) : (
        <View style={{ gap: 16, marginBottom: spacing.lg }}>
          {posts.map((post) => {
            const reacted = !!reactedIds[post.id];
            return (
              <View key={post.id} style={[styles.postCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {/* Header */}
                <View style={styles.postHead}>
                  <Pressable onPress={() => router.push('/favorite/' + post.author.handle)} accessibilityLabel={post.author.displayName}>
                    <Avatar name={post.author.handle} size={42} ring uri={post.author.avatarUrl || undefined} />
                  </Pressable>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text numberOfLines={1} style={[styles.postName, { color: colors.text }]}>
                      {post.author.displayName}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 12, marginTop: 1 }}>
                      {'@' + post.author.handle} {'\u00b7'} {timeAgo(post.createdAt)}
                    </Text>
                  </View>
                  <Pressable onPress={() => setReportTarget(post)} hitSlop={10} accessibilityLabel={'Report post'}>
                    <Ionicons name={'ellipsis-horizontal'} size={18} color={colors.muted} />
                  </Pressable>
                </View>

                {/* Body */}
                <Text style={[styles.postBody, { color: colors.text }]}>{post.body}</Text>

                {/* Media */}
                {post.mediaUrls.length > 0 && (
                  <View style={[styles.mediaGrid, post.mediaUrls.length === 1 && { flexDirection: 'column' }]}>
                    {post.mediaUrls.slice(0, 4).map((url) => (
                      <Image key={url} source={{ uri: url }} style={post.mediaUrls.length === 1 ? styles.mediaOne : styles.mediaCell} resizeMode={'cover'} />
                    ))}
                  </View>
                )}

                {/* Actions */}
                <View style={styles.actionRow}>
                  <Pressable onPress={() => toggleReact(post)} disabled={busyId === post.id} style={styles.actionBtn} accessibilityLabel={'React'}>
                    <Ionicons name={reacted ? 'heart' : 'heart-outline'} size={20} color={reacted ? HEART_RED : colors.muted} />
                    {post.reactionCount > 0 && (
                      <Text style={[styles.actionCount, { color: reacted ? HEART_RED : colors.muted }]}>{post.reactionCount}</Text>
                    )}
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setCommentCount(post.commentCount);
                      setCommentsTarget(post);
                    }}
                    style={styles.actionBtn}
                    accessibilityLabel={'Comments'}
                  >
                    <Ionicons name={'chatbubble-outline'} size={20} color={colors.muted} />
                    {post.commentCount > 0 && (
                      <Text style={[styles.actionCount, { color: colors.muted }]}>{post.commentCount}</Text>
                    )}
                  </Pressable>
                  <Pressable onPress={() => setGiftTarget(post)} style={styles.actionBtn} accessibilityLabel={'Send a gift'}>
                    <Ionicons name={'gift-outline'} size={20} color={GOLD} />
                  </Pressable>
                  <Pressable
                    onPress={() => shareMoment(post.body.slice(0, 60), post.id)}
                    style={styles.actionBtn}
                    accessibilityLabel={'Share'}
                  >
                    <Ionicons name={'share-social-outline'} size={20} color={colors.muted} />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <CommentsSheet
        visible={commentsTarget !== null}
        onClose={() => {
          const n = commentCount;
          const id = commentsTarget ? commentsTarget.id : '';
          setCommentsTarget(null);
          setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, commentCount: n } : p)));
        }}
        postId={commentsTarget ? commentsTarget.id : undefined}
        count={commentCount}
        onCountChange={setCommentCount}
      />

      <GiftTraySheet
        visible={giftTarget !== null}
        onClose={() => setGiftTarget(null)}
        name={giftTarget ? giftTarget.author.displayName : ''}
        onSend={sendGift}
        sending={sendingGift}
      />

      <ReportSheet
        visible={reportTarget !== null}
        onClose={() => setReportTarget(null)}
        targetType={'post'}
        targetId={reportTarget ? reportTarget.id : ''}
        subjectLabel={reportTarget ? 'Post by @' + reportTarget.author.handle : ''}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  storyTile: { alignItems: 'center', width: 64 },
  youRing: { width: 56, height: 56, borderRadius: 28, padding: 2 },
  youInner: { flex: 1, borderRadius: 26, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' },
  storyName: { fontSize: 11, fontWeight: '700', marginTop: 4 },
  postCard: { borderWidth: 1, borderRadius: radii.lg, padding: 14 },
  postHead: { flexDirection: 'row', alignItems: 'center' },
  postName: { fontWeight: '800', fontSize: 15 },
  postBody: { fontSize: 15, lineHeight: 22, marginTop: 10 },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  mediaOne: { width: '100%', height: 220, borderRadius: radii.md },
  mediaCell: { width: '48%', height: 110, borderRadius: radii.sm },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 22, marginTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 32 },
  actionCount: { fontSize: 13, fontWeight: '700' },
});
