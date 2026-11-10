/** Home tab - Rally design system
 * Home is the FEED for Posts (text and media updates by Favorites).
 * Scope chips: For you / Following / Rising / Live. Story rail on top,
 * post cards below with react, comment, gift, save, share and a calm
 * options sheet. Moments (video) live on the Moments tab.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Avatar } from '@/components/ui';
import { FeedSkeleton } from '@/components/FeedSkeleton';
import { PostOptionsSheet } from '@/components/PostOptionsSheet';
import { SaveToCollectionSheet } from '@/components/SaveToCollectionSheet';
import { ShareSheet } from '@/components/ShareSheet';
import { NotInterestedSheet } from '@/components/NotInterestedSheet';
import { WhySheet } from '@/components/WhySheet';
import { CommentsSheet } from '@/components/CommentsSheet';
import { GiftTraySheet } from '@/components/GiftTraySheet';
import { ReportSheet } from '@/components/ReportSheet';
import { requestBreakPrompt } from '@/components/BreakPrompt';
import { loadFeedPrefs, saveFeedPrefs, addMutedWord, addMutedAccount } from '@/lib/feedPrefs';
import { useTheme } from '@/components/ThemeProvider';
import { api, getToken } from '@/lib/api';
import { spacing, radii } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useShare } from '@/hooks/useShare';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const HEART_RED = '#EF5350';
const TEAL = '#34D399';

type Scope = 'for-you' | 'following' | 'rising' | 'live';

const SCOPES: { key: Scope; label: string }[] = [
  { key: 'for-you', label: 'For you' },
  { key: 'following', label: 'Following' },
  { key: 'rising', label: 'Rising' },
  { key: 'live', label: 'Live' },
];

const INTEREST_CHIPS = ['Gospel', 'Afrobeats', 'Comedy'];

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

type LiveSession = {
  id: string;
  title?: string;
  status?: string;
  viewerCount?: number;
  favorite?: { user?: { handle?: string; displayName?: string; avatarUrl?: string | null } };
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

  const [scope, setScope] = useState<Scope>('for-you');
  const [posts, setPosts] = useState<Post[]>([]);
  const [live, setLive] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [reactedIds, setReactedIds] = useState<Record<string, boolean>>({});
  const [savedKeys, setSavedKeys] = useState<Record<string, boolean>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [commentsTarget, setCommentsTarget] = useState<Post | null>(null);
  const [giftTarget, setGiftTarget] = useState<Post | null>(null);
  const [sendingGift, setSendingGift] = useState(false);
  const [reportTarget, setReportTarget] = useState<Post | null>(null);
  const [optionsTarget, setOptionsTarget] = useState<Post | null>(null);
  const [saveTarget, setSaveTarget] = useState<Post | null>(null);
  const [shareTarget, setShareTarget] = useState<Post | null>(null);
  const [notInterestedTarget, setNotInterestedTarget] = useState<Post | null>(null);
  const [whyTarget, setWhyTarget] = useState<Post | null>(null);
  const [translatedIds, setTranslatedIds] = useState<Record<string, boolean>>({});
  const [showTranslateBanner, setShowTranslateBanner] = useState(true);
  const [undoId, setUndoId] = useState<string | null>(null);
  const [newestFirst, setNewestFirst] = useState(true);
  const [hideRivalry, setHideRivalry] = useState(false);

  useEffect(() => {
    loadFeedPrefs()
      .then((p) => setNewestFirst(p.timeOrder))
      .catch(() => {});
  }, []);
  const [hiddenIds, setHiddenIds] = useState<Record<string, boolean>>({});
  const [hiddenAuthors, setHiddenAuthors] = useState<Record<string, boolean>>({});
  const [commentCount, setCommentCount] = useState(0);

  const load = useCallback(async () => {
    setRefreshing(true);
    setOffline(false);
    try {
      const r = await api<{ posts: Post[] }>('/api/posts/feed');
      setPosts(r.posts || []);
    } catch {
      // Keep whatever posts we already have and say so calmly.
      setOffline(true);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  const loadLive = useCallback(async () => {
    setRefreshing(true);
    setOffline(false);
    try {
      const r = await api<{ sessions: LiveSession[] }>('/api/live', { skipAuth: !getToken() });
      setLive((r.sessions || []).filter((s) => (s.status || 'live') === 'live'));
    } catch {
      setOffline(true);
      setLive([]);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    if (scope === 'live') loadLive();
    else load();
  }, [scope, load, loadLive]);

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

  function toggleTranslated(id: string) {
    setTranslatedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function hidePost(id: string, muteHandle?: string) {
    setHiddenIds((prev) => ({ ...prev, [id]: true }));
    if (muteHandle) setHiddenAuthors((prev) => ({ ...prev, [muteHandle]: true }));
    setUndoId(id);
  }

  function undoHide() {
    if (!undoId) return;
    setHiddenIds((prev) => {
      const next = { ...prev };
      delete next[undoId];
      return next;
    });
    setUndoId(null);
  }

  async function sendGift(giftId: string, message: string, anonymous: boolean, quantity: number) {
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
          isAnonymous: anonymous, quantity: quantity || 1,
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

  const visiblePosts = posts
    .filter((p) => !hiddenIds[p.id] && !hiddenAuthors[p.author.handle])
    .slice()
    .sort((a, b) =>
      scope === 'rising'
        ? b.reactionCount + b.commentCount - (a.reactionCount + a.commentCount)
        : newestFirst
          ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

  const isPostsScope = scope !== 'live';
  const showSkeleton = loading && isPostsScope && posts.length === 0;
  const followingQuiet = scope === 'following' && !loading && !offline && visiblePosts.length === 0;

  return (
    <Screen refreshing={refreshing} onRefresh={scope === 'live' ? loadLive : load}>
      {/* Scope chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, marginBottom: spacing.md }}
        contentContainerStyle={{ gap: 8, paddingRight: 16 }}
      >
        {SCOPES.map((s) => {
          const active = scope === s.key;
          return (
            <Pressable
              key={s.key}
              onPress={() => {
                impact('selection');
                setScope(s.key);
              }}
              style={[styles.scopePill, active && styles.scopePillActive, !active && { backgroundColor: colors.surface, borderColor: colors.border }]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={s.label}
            >
              <Text style={[styles.scopeText, { color: active ? '#111' : colors.textSecondary }]}>{s.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Offline banner: calm, inline, with Retry */}
      {offline && isPostsScope ? (
        <View style={[styles.offlineBanner, { backgroundColor: GOLD + '1f', borderColor: GOLD + '55' }]}>
          <Ionicons name="wifi" size={16} color={GOLD} />
          <Text style={[styles.offlineText, { color: colors.text }]}>You are offline. Showing saved posts.</Text>
          <Pressable onPress={load} hitSlop={8} accessibilityLabel="Retry">
            <Text style={[styles.retryText, { color: GOLD }]}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {showTranslateBanner && isPostsScope ? (
        <View style={[styles.translateBanner, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Ionicons name="globe" size={16} color={colors.success} />
          <Text style={[styles.offlineText, { color: colors.textSecondary, fontWeight: '600' }]}>
            {'Translate posts automatically from Yor\u00f9b\u00e1, Hausa and Igbo into English.'}
          </Text>
          <Pressable onPress={() => router.push('/settings')} hitSlop={8} accessibilityLabel="Change in Settings">
            <Text style={[styles.retryText, { color: GOLD }]}>Change in Settings</Text>
          </Pressable>
        </View>
      ) : null}

      {undoId ? (
        <View style={styles.undoToast}>
          <Text style={styles.undoText}>Post hidden</Text>
          <Pressable onPress={undoHide} hitSlop={8} accessibilityLabel="Undo">
            <Text style={styles.undoBtn}>Undo</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Story rail (posts scopes only) */}
      {isPostsScope && !followingQuiet ? (
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
      ) : null}

      {/* LIVE scope: sessions list */}
      {scope === 'live' ? (
        live.length === 0 ? (
          <View style={{ marginTop: spacing.xl }}>
            <View style={[styles.quietIcon, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons name="radio-outline" size={30} color={GOLD} />
            </View>
            <Text style={[styles.quietTitle, { color: colors.text }]}>No one is live right now</Text>
            <Text style={[styles.quietBody, { color: colors.muted }]}>
              When a Favorite you follow goes live, it shows up here first.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12, marginBottom: spacing.lg }}>
            {live.map((s) => {
              const u = s.favorite && s.favorite.user ? s.favorite.user : null;
              const handle = (u && u.handle) || 'rally';
              return (
                <Pressable
                  key={s.id}
                  style={[styles.postCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => router.push('/live/' + s.id)}
                  accessibilityRole="button"
                  accessibilityLabel={s.title || 'Live session'}
                >
                  <View style={styles.postHead}>
                    <Avatar name={handle} size={42} ring uri={(u && u.avatarUrl) || undefined} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text numberOfLines={1} style={[styles.postName, { color: colors.text }]}>
                        {(u && u.displayName) || '@' + handle}
                      </Text>
                      <Text style={{ color: colors.muted, fontSize: 12, marginTop: 1 }}>
                        {(s.viewerCount || 0) + ' watching'}
                      </Text>
                    </View>
                    <View style={styles.liveBadge}>
                      <Text style={styles.liveBadgeText}>LIVE</Text>
                    </View>
                  </View>
                  {s.title ? (
                    <Text style={[styles.postBody, { color: colors.text }]}>{s.title}</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )
      ) : followingQuiet ? (
        /* Following quiet state - mock 04 */
        <View style={styles.quietWrap}>
          <View style={[styles.quietIcon, { backgroundColor: colors.surfaceElevated }]}>
            <Ionicons name="people-outline" size={30} color={GOLD} />
          </View>
          <Text style={[styles.quietTitle, { color: colors.text }]}>Your feed is quiet</Text>
          <Text style={[styles.quietBody, { color: colors.muted }]}>
            Follow a few Favorites and their Moments and posts show up here.
          </Text>
          <View style={styles.interestRow}>
            {INTEREST_CHIPS.map((c) => (
              <Pressable
                key={c}
                style={[styles.interestChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                onPress={() => router.push('/follow-favorites')}
                accessibilityLabel={c}
              >
                <Text style={[styles.interestText, { color: colors.text }]}>{c}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={() => router.push('/follow-favorites')}
            accessibilityRole="button"
            accessibilityLabel="Find Favorites"
            style={{ width: '100%' }}
          >
            <LinearGradient
              colors={[GOLD, GOLD_DEEP] as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.findBtn}
            >
              <Text style={styles.findBtnText}>Find Favorites</Text>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={() => setScope('rising')} hitSlop={8} accessibilityLabel="See what is rising">
            <Text style={[styles.risingLink, { color: colors.textSecondary }]}>See what is rising</Text>
          </Pressable>
        </View>
      ) : showSkeleton ? (
        /* Loading skeleton - mock 03 */
        <FeedSkeleton count={3} />
      ) : visiblePosts.length === 0 ? (
        <View style={{ marginTop: spacing.lg }}>
          <View style={[styles.quietIcon, { backgroundColor: colors.surfaceElevated }]}>
            <Ionicons name="newspaper-outline" size={30} color={GOLD} />
          </View>
          <Text style={[styles.quietTitle, { color: colors.text }]}>No posts yet</Text>
          <Text style={[styles.quietBody, { color: colors.muted }]}>
            {offline ? 'Pull down or tap Retry when you are back online.' : 'Posts from Favorites you follow appear here.'}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 16, marginBottom: spacing.lg }}>
          {visiblePosts.map((post) => {
            const reacted = !!reactedIds[post.id];
            const savedKey = 'post:' + post.id;
            const saved = !!savedKeys[savedKey];
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
                  <Pressable onPress={() => setOptionsTarget(post)} hitSlop={10} accessibilityLabel={'Post options'}>
                    <Ionicons name={'ellipsis-horizontal'} size={18} color={colors.muted} />
                  </Pressable>
                </View>

                {/* Body */}
                <Pressable onPress={() => router.push('/post/' + post.id)}>
                  <Text style={[styles.postBody, { color: colors.text }]}>{post.body}</Text>
                </Pressable>
                {translatedIds[post.id] ? (
                  <Pressable style={styles.translatedRow} onPress={() => toggleTranslated(post.id)} accessibilityLabel="Show original">
                    <Ionicons name="globe" size={14} color={colors.success} />
                    <Text style={[styles.translatedText, { color: colors.success }]}>Translated from Yor\u00f9b\u00e1</Text>
                    <Text style={[styles.translatedText, { color: colors.muted }]}>Show original</Text>
                  </Pressable>
                ) : null}

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
                    onPress={() => {
                      impact('light');
                      setSaveTarget(post);
                    }}
                    style={styles.actionBtn}
                    accessibilityLabel={'Save to Collection'}
                  >
                    <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={saved ? GOLD : colors.muted} />
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

      {/* All caught up - mock 23 */}
      {isPostsScope && !loading && !offline && visiblePosts.length > 0 ? (
        <View style={[styles.caughtUp, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.caughtUpCheck}>
            <Ionicons name="checkmark" size={26} color="#04120C" />
          </View>
          <Text style={[styles.caughtUpTitle, { color: colors.text }]}>You are all caught up</Text>
          <Text style={[styles.caughtUpBody, { color: colors.muted }]}>
            You have seen everything from the last 3 days. Rally does not loop old posts to keep you scrolling.
          </Text>
          <View style={styles.caughtUpBtns}>
            <Pressable
              style={[styles.caughtUpBtn, { backgroundColor: colors.surfaceElevated }]}
              onPress={() => setScope('rising')}
              accessibilityLabel="Explore Rising"
            >
              <Text style={[styles.caughtUpBtnText, { color: colors.text }]}>Explore Rising</Text>
            </Pressable>
            <Pressable
              style={[styles.caughtUpBtn, { backgroundColor: colors.surfaceElevated }]}
              onPress={requestBreakPrompt}
              accessibilityLabel="Take a break"
            >
              <Text style={[styles.caughtUpBtnText, { color: colors.text }]}>Take a break</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <PostOptionsSheet
        visible={optionsTarget !== null}
        onClose={() => setOptionsTarget(null)}
        postId={optionsTarget ? optionsTarget.id : ''}
        authorHandle={optionsTarget ? optionsTarget.author.handle : ''}
        authorName={optionsTarget ? optionsTarget.author.displayName : ''}
        postBody={optionsTarget ? optionsTarget.body : ''}
        onSaveToCollection={() => {
          const p = optionsTarget;
          setOptionsTarget(null);
          setSaveTarget(p);
        }}
        onShare={() => {
          const p = optionsTarget;
          setOptionsTarget(null);
          setShareTarget(p);
        }}
        onTranslated={() => {
          const id = optionsTarget ? optionsTarget.id : '';
          setOptionsTarget(null);
          if (id) {
            setTranslatedIds((prev) => ({ ...prev, [id]: true }));
            setShowTranslateBanner(true);
          }
        }}
        onWhyExplain={() => {
          const p = optionsTarget;
          setOptionsTarget(null);
          setWhyTarget(p);
        }}
        onNotInterested={() => {
          const p = optionsTarget;
          setOptionsTarget(null);
          setNotInterestedTarget(p);
        }}
        onMute={() => {
          const h = optionsTarget ? optionsTarget.author.handle : '';
          const n = optionsTarget ? optionsTarget.author.displayName : '';
          setOptionsTarget(null);
          if (h) setHiddenAuthors((prev) => ({ ...prev, [h]: true }));
          if (n) impact('light');
        }}
        onReport={() => {
          const p = optionsTarget;
          setOptionsTarget(null);
          setReportTarget(p);
        }}
      />

      <SaveToCollectionSheet
        visible={saveTarget !== null}
        onClose={() => setSaveTarget(null)}
        postKey={saveTarget ? 'post:' + saveTarget.id : undefined}
      />

      <ShareSheet
        visible={shareTarget !== null}
        onClose={() => setShareTarget(null)}
        linkId={shareTarget ? shareTarget.id : ''}
        kind="post"
        recipients={stories.map((a) => ({ handle: a.handle, displayName: a.displayName, avatarUrl: a.avatarUrl }))}
      />

      <NotInterestedSheet
        visible={notInterestedTarget !== null}
        onClose={() => setNotInterestedTarget(null)}
        authorName={notInterestedTarget ? notInterestedTarget.author.displayName : ''}
        onDone={(reason, mute30) => {
          const p = notInterestedTarget;
          setNotInterestedTarget(null);
          if (p) hidePost(p.id, mute30 ? p.author.handle : undefined);
        }}
      />

      <WhySheet
        visible={whyTarget !== null}
        onClose={() => setWhyTarget(null)}
        authorName={whyTarget ? whyTarget.author.displayName : ''}
        categoryLabel={'Gospel'}
        newestFirst={newestFirst}
        onToggleNewest={() => {
          setNewestFirst((v) => {
            saveFeedPrefs({ timeOrder: !v });
            return !v;
          });
        }}
        hideRivalry={hideRivalry}
        onToggleRivalry={() => setHideRivalry((v) => !v)}
        onMuteAuthor={() => {
          const h = whyTarget ? whyTarget.author.handle : '';
          setWhyTarget(null);
          if (h) {
            setHiddenAuthors((prev) => ({ ...prev, [h]: true }));
            addMutedAccount(h);
          }
        }}
        onMuteCategory={() => setWhyTarget(null)}
        onMuteWord={(w?: string) => {
          setWhyTarget(null);
          if (w) addMutedWord(w);
        }}
      />

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
        composerName={commentsTarget ? commentsTarget.author.displayName : undefined}
        favoriteHandle={commentsTarget ? commentsTarget.author.handle : undefined}
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
  scopePill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  scopePillActive: {
    backgroundColor: '#F5F5F0',
    borderColor: '#F5F5F0',
  },
  scopeText: { fontSize: 14, fontWeight: '700' },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: spacing.md,
  },
  offlineText: { flex: 1, fontSize: 13, fontWeight: '700' },
  retryText: { fontSize: 14, fontWeight: '800' },
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
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 32 },
  actionCount: { fontSize: 13, fontWeight: '700' },
  quietWrap: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 8 },
  quietIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  quietTitle: { fontSize: 24, fontWeight: '900', textAlign: 'center', letterSpacing: -0.4 },
  quietBody: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 8, paddingHorizontal: 12 },
  interestRow: { flexDirection: 'row', gap: 8, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' },
  interestChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  interestText: { fontSize: 14, fontWeight: '700' },
  findBtn: {
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 20,
    width: '100%',
  },
  findBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  risingLink: { fontSize: 15, fontWeight: '700', marginTop: 16 },
  liveBadge: {
    backgroundColor: '#EF5350',
    borderRadius: radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  liveBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  translatedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  translatedText: { fontSize: 13, fontWeight: '700' },
  translateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: spacing.md,
  },
  undoToast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F0',
    borderRadius: radii.full,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: spacing.md,
  },
  undoText: { color: '#111', fontSize: 14, fontWeight: '800' },
  undoBtn: { color: '#E4572E', fontSize: 14, fontWeight: '800' },
  caughtUp: {
    borderWidth: 1,
    borderRadius: radii.lg,
    alignItems: 'center',
    padding: 22,
    marginBottom: spacing.lg,
  },
  caughtUpCheck: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  caughtUpTitle: { fontSize: 20, fontWeight: '900', textAlign: 'center' },
  caughtUpBody: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8 },
  caughtUpBtns: { flexDirection: 'row', gap: 12, marginTop: 18 },
  caughtUpBtn: { borderRadius: radii.full, paddingHorizontal: 20, paddingVertical: 13 },
  caughtUpBtnText: { fontWeight: '800', fontSize: 14 },
});
