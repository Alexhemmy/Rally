/** Post detail - Rally design
 * Full post view (mocks 14/15): photo carousel with page badge and dots,
 * poll post with gold result fills, action row, caption with gold
 * hashtags, and a comment preview that opens the full comments sheet.
 * Poll tallies are client-side for now - the backend has no vote store.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, Image, ScrollView, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Avatar } from '@/components/ui';
import { CommentsSheet } from '@/components/CommentsSheet';
import { ShareSheet } from '@/components/ShareSheet';
import { GiftTraySheet } from '@/components/GiftTraySheet';
import { useTheme } from '@/components/ThemeProvider';
import { api, getToken } from '@/lib/api';
import { spacing, radii } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const HEART_RED = '#EF5350';

type Post = {
  id: string;
  body: string;
  mediaUrls: string[];
  poll: { options: string[]; lengthHours: number } | null;
  reactionCount: number;
  commentCount: number;
  createdAt: string;
  author: { handle: string; displayName: string; avatarUrl?: string | null };
  comments?: { id: string; body: string; createdAt: string; author?: { handle: string; displayName: string; avatarUrl?: string | null } }[];
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

/** Render body text with gold hashtags. */
function Caption({ text, color }: { text: string; color: string }) {
  const parts = text.split(/(#[A-Za-z0-9_]+)/g);
  return (
    <Text style={[styles.caption, { color }]}>
      {parts.map((p, i) =>
        p.startsWith('#') ? (
          <Text key={i} style={{ color: GOLD }}>{p}</Text>
        ) : (
          <Text key={i}>{p}</Text>
        )
      )}
    </Text>
  );
}

export default function PostDetail() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { impact } = useHaptics();
  const { width } = useWindowDimensions();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [page, setPage] = useState(0);
  const [reacted, setReacted] = useState(false);
  const [following, setFollowing] = useState(false);
  const [vote, setVote] = useState<number | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [sendingGift, setSendingGift] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const r = await api<{ post: Post }>('/api/posts/' + id, { skipAuth: !getToken() });
      setPost(r.post);
      setCommentCount(r.post.commentCount || (r.post.comments ? r.post.comments.length : 0));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleReact() {
    if (!post) return;
    if (!getToken()) {
      router.push('/login');
      return;
    }
    impact('light');
    try {
      const r = await api<{ reacted: boolean; reactionCount: number }>('/api/posts/' + post.id + '/react', { method: 'POST' });
      setReacted(r.reacted);
      setPost((p) => (p ? { ...p, reactionCount: r.reactionCount } : p));
    } catch {
      // ignore
    }
  }

  async function toggleFollow() {
    if (!post) return;
    if (!getToken()) {
      router.push('/login');
      return;
    }
    const on = following;
    impact('light');
    setFollowing(!on);
    try {
      await api('/api/users/' + post.author.handle + '/follow', { method: on ? 'DELETE' : 'POST' });
    } catch {
      setFollowing(on);
    }
  }

  async function sendGift(giftId: string, message: string, anonymous: boolean, quantity: number) {
    if (!post) return;
    setSendingGift(true);
    impact('medium');
    try {
      await api('/api/gifts/send', {
        method: 'POST',
        body: JSON.stringify({
          favoriteHandle: post.author.handle,
          catalogItemId: giftId,
          message,
          isAnonymous: anonymous, quantity: quantity || 1,
        }),
      });
      impact('success');
      setGiftOpen(false);
    } catch {
      // sheet shows its own state
    } finally {
      setSendingGift(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={GOLD} style={{ marginTop: 80 }} />
      </Screen>
    );
  }

  if (failed || !post) {
    return (
      <Screen>
        <View style={styles.centerWrap}>
          <View style={[styles.quietIcon, { backgroundColor: colors.surfaceElevated }]}>
            <Ionicons name="alert-circle-outline" size={30} color={GOLD} />
          </View>
          <Text style={[styles.quietTitle, { color: colors.text }]}>Post not found</Text>
          <Text style={[styles.quietBody, { color: colors.muted }]}>
            It may have been deleted or the link is broken.
          </Text>
        </View>
      </Screen>
    );
  }

  const media = post.mediaUrls || [];
  const isPoll = !!post.poll && post.poll.options.length >= 2;
  const firstComment = post.comments && post.comments.length > 0 ? post.comments[0] : null;
  const hoursLeft = post.poll ? Math.max(0, post.poll.lengthHours - Math.floor((Date.now() - new Date(post.createdAt).getTime()) / 3600000)) : 0;

  return (
    <Screen>
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Post</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Author row */}
      <View style={styles.authorRow}>
        <Pressable onPress={() => router.push('/favorite/' + post.author.handle)} accessibilityLabel={post.author.displayName}>
          <Avatar name={post.author.handle} size={46} ring uri={post.author.avatarUrl || undefined} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text numberOfLines={1} style={[styles.authorName, { color: colors.text }]}>
            {post.author.displayName}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 1 }}>
            {'@' + post.author.handle} {'\u00b7'} {timeAgo(post.createdAt)}
          </Text>
        </View>
        <Pressable
          onPress={toggleFollow}
          style={[
            styles.followPill,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
            following && { backgroundColor: GOLD + '1f', borderColor: GOLD },
          ]}
          accessibilityRole="button"
          accessibilityState={{ selected: following }}
          accessibilityLabel={following ? 'Following' : 'Follow'}
        >
          <Text style={[styles.followPillText, { color: following ? GOLD : colors.text }]}>
            {following ? 'Following' : 'Follow'}
          </Text>
        </Pressable>
      </View>

      {/* Poll */}
      {isPoll ? (
        <View style={{ marginTop: spacing.md, gap: 10 }}>
          <Caption text={post.body} color={colors.text} />
          {post.poll!.options.map((opt, i) => {
            const chosen = vote === i;
            return (
              <Pressable
                key={i}
                onPress={() => {
                  if (vote !== null) return;
                  impact('medium');
                  setVote(i);
                }}
                style={[
                  styles.pollOption,
                  { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                  chosen && { borderColor: GOLD, backgroundColor: GOLD + '1f' },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: chosen }}
                accessibilityLabel={'Vote ' + opt}
              >
                <Text style={[styles.pollOptionText, { color: chosen ? GOLD : colors.text }]}>{opt}</Text>
                {chosen ? <Ionicons name="checkmark-circle" size={18} color={GOLD} /> : null}
              </Pressable>
            );
          })}
          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
            {vote !== null
              ? 'You voted ' + post.poll!.options[vote] + ' \u00b7 ' + hoursLeft + ' hours left'
              : 'Tap an option to vote \u00b7 ' + hoursLeft + ' hours left'}
          </Text>
        </View>
      ) : (
        <>
          {/* Media carousel */}
          {media.length > 0 ? (
            <View style={{ marginTop: spacing.md }}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / (width - 32)))}
                scrollEventThrottle={100}
                snapToInterval={width - 32}
                decelerationRate="fast"
              >
                {media.map((url) => (
                  <Image key={url} source={{ uri: url }} style={{ width: width - 32, height: width - 32, borderRadius: radii.lg }} resizeMode="cover" />
                ))}
              </ScrollView>
              {media.length > 1 ? (
                <>
                  <View style={styles.pageBadge}>
                    <Text style={styles.pageBadgeText}>{page + 1 + ' / ' + media.length}</Text>
                  </View>
                  <View style={styles.dotsRow}>
                    {media.map((u, i) => (
                      <View key={u} style={[styles.dot, i === page && styles.dotActive]} />
                    ))}
                  </View>
                </>
              ) : null}
            </View>
          ) : null}

          {/* Actions */}
          <View style={styles.actionRow}>
            <Pressable onPress={() => setCommentsOpen(true)} style={styles.actionBtn} accessibilityLabel="Comments">
              <Ionicons name="chatbubble-outline" size={20} color={colors.muted} />
              {commentCount > 0 && <Text style={[styles.actionCount, { color: colors.muted }]}>{commentCount}</Text>}
            </Pressable>
            <Pressable onPress={toggleReact} style={styles.actionBtn} accessibilityLabel="React">
              <Ionicons name={reacted ? 'heart' : 'heart-outline'} size={20} color={reacted ? HEART_RED : colors.muted} />
              {post.reactionCount > 0 && <Text style={[styles.actionCount, { color: reacted ? HEART_RED : colors.muted }]}>{post.reactionCount}</Text>}
            </Pressable>
            <Pressable onPress={() => setGiftOpen(true)} style={styles.actionBtn} accessibilityLabel="Send a gift">
              <Ionicons name="gift-outline" size={20} color={GOLD} />
            </Pressable>
            <Pressable style={styles.actionBtn} accessibilityLabel="Save to Collection">
              <Ionicons name="bookmark-outline" size={20} color={colors.muted} />
            </Pressable>
            <Pressable onPress={() => setShareOpen(true)} style={styles.actionBtn} accessibilityLabel="Share">
              <Ionicons name="share-social-outline" size={20} color={colors.muted} />
            </Pressable>
          </View>

          {/* Caption + comments preview */}
          <View style={{ marginTop: spacing.md, gap: 10 }}>
            <Caption text={post.body} color={colors.text} />
            {commentCount > 0 ? (
              <Pressable onPress={() => setCommentsOpen(true)} accessibilityLabel="View all comments">
                <Text style={{ color: colors.muted, fontSize: 14 }}>View all {commentCount} comments</Text>
              </Pressable>
            ) : null}
            {firstComment ? (
              <View style={styles.previewRow}>
                <Avatar name={firstComment.author?.handle || 'rally'} size={30} uri={firstComment.author?.avatarUrl || undefined} />
                <Text style={{ flex: 1, marginLeft: 10, color: colors.text, fontSize: 14, lineHeight: 20 }}>
                  <Text style={{ fontWeight: '800' }}>{(firstComment.author && firstComment.author.displayName) || 'Fan'} </Text>
                  {firstComment.body}
                </Text>
              </View>
            ) : null}
          </View>
        </>
      )}

      <CommentsSheet
        visible={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        postId={post.id}
        count={commentCount}
        onCountChange={setCommentCount}
        composerName={post.author.displayName}
        favoriteHandle={post.author.handle}
        onGift={() => setGiftOpen(true)}
      />

      <ShareSheet
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        linkId={post.id}
        kind="post"
        recipients={[{ handle: post.author.handle, displayName: post.author.displayName, avatarUrl: post.author.avatarUrl }]}
      />

      <GiftTraySheet
        visible={giftOpen}
        onClose={() => setGiftOpen(false)}
        name={post.author.displayName}
        onSend={sendGift}
        sending={sendingGift}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  headerTitle: { fontSize: 17, fontWeight: '900' },
  authorRow: { flexDirection: 'row', alignItems: 'center' },
  authorName: { fontWeight: '900', fontSize: 16 },
  followPill: {
    borderRadius: radii.full,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  followPillText: { fontSize: 14, fontWeight: '700' },
  pollOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  pollOptionText: { fontSize: 16, fontWeight: '800' },
  pageBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pageBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotActive: { backgroundColor: GOLD },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 22, marginTop: spacing.md },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 32 },
  actionCount: { fontSize: 13, fontWeight: '700' },
  previewRow: { flexDirection: 'row', alignItems: 'flex-start' },
  centerWrap: { alignItems: 'center', paddingTop: 80 },
  quietIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  quietTitle: { fontSize: 22, fontWeight: '900' },
  quietBody: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 8, paddingHorizontal: 24 },
});
