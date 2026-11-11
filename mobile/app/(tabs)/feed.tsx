/** Moments feed - Rally design
 * Full-screen vertical pager with Following / Rising / Live tabs.
 * Each Moment fills the screen: media background, gradient overlays,
 * author info, and a right action rail (react, comment, share, gift, report).
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, FlatList, Image, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar, EmptyState } from '@/components/ui';
import { CommentsSheet } from '@/components/CommentsSheet';
import { ReportSheet } from '@/components/ReportSheet';
import { SaveToCollectionSheet } from '@/components/SaveToCollectionSheet';
import { GiftTraySheet } from '@/components/GiftTraySheet';
import { FavoriteQuickView } from '@/components/FavoriteQuickView';
import { GiftBurst } from '@/components/GiftBurst';
import { PostOptionsSheet } from '@/components/PostOptionsSheet';
import { NotInterestedSheet } from '@/components/NotInterestedSheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { shareMoment } from '@/hooks/useShare';
import { api, getToken } from '@/lib/api';
import { getApiUrl } from '@/lib/config';
import { radii } from '@/constants/theme';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const LIVE_RED = '#ff4d4f';

const TABS = [
  { key: 'following', label: 'Following' },
  { key: 'rising', label: 'Rising' },
  { key: 'live', label: 'Live' },
];

const ENDPOINTS: Record<string, { path: string; auth: boolean }> = {
  following: { path: '/api/feed/home', auth: true },
  rising: { path: '/api/feed/explore', auth: false },
  live: { path: '/api/feed/flash', auth: false },
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

export default function FeedTab() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const router = useRouter();
  const { impact } = useHaptics();
  const { click } = useSounds();

  const [tab, setTab] = useState('rising');
  const [dataByTab, setDataByTab] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reacted, setReacted] = useState<Record<string, boolean>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [base, setBase] = useState('');
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const [reportFor, setReportFor] = useState<any | null>(null);
  const [saveFor, setSaveFor] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [followState, setFollowState] = useState<Record<string, boolean>>({});
  const [sortNewest, setSortNewest] = useState(true);
  const [whyFor, setWhyFor] = useState<string | null>(null);
  const [giftFor, setGiftFor] = useState<any | null>(null);
  const [sendingGift, setSendingGift] = useState(false);
  const [quickFor, setQuickFor] = useState<any | null>(null);
  const [burst, setBurst] = useState(false);
  const [burstInfo, setBurstInfo] = useState<{ title: string; sub: string } | null>(null);
  const [giftEvents, setGiftEvents] = useState<{ id: string; name: string; gift: string; qty: number }[]>([]);
  const [optionsFor, setOptionsFor] = useState<any | null>(null);
  const [notInterestedFor, setNotInterestedFor] = useState<any | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Record<string, boolean>>({});
  const [mutedAuthors, setMutedAuthors] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    getApiUrl().then((b) => setBase(b || '')).catch(() => undefined);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('rally.mutedAuthors').then((raw) => {
      if (raw) setMutedAuthors(JSON.parse(raw) || {});
    }).catch(() => undefined);
  }, []);

  function hidePost(id: string, message: string) {
    setHiddenIds((prev) => ({ ...prev, [id]: true }));
    setToast(message);
  }

  function undoHide(handle?: string) {
    setToast(null);
    setHiddenIds((prev) => {
      const next = { ...prev };
      if (handle) {
        for (const k of Object.keys(next)) next[k] = false;
      }
      return next;
    });
  }

  async function muteAuthor(handle: string, displayName: string) {
    setMutedAuthors((prev) => {
      const next = { ...prev, [handle]: true };
      AsyncStorage.setItem('rally.mutedAuthors', JSON.stringify(next)).catch(() => undefined);
      return next;
    });
    if (optionsFor) setHiddenIds((prev) => ({ ...prev, [optionsFor.id]: true }));
    setOptionsFor(null);
    setToast('Muted ' + displayName + ' \u00b7 their Moments are hidden');
  }

  const load = useCallback(async (which: string) => {
    setLoading(true);
    setFailed(false);
    const ep = ENDPOINTS[which];
    try {
      const res = await api<{ moments: any[] }>(ep.path, {
        skipAuth: !ep.auth || !getToken(),
      });
      const list = res.moments || [];
      setDataByTab((prev) => ({ ...prev, [which]: list }));
      const start: Record<string, number> = {};
      for (const m of list) start[m.id] = m.commentCount || 0;
      setCounts((prev) => ({ ...prev, ...start }));
    } catch {
      setDataByTab((prev) => ({ ...prev, [which]: [] }));
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (dataByTab[tab]) return;
    load(tab);
  }, [tab, dataByTab, load]);

  async function react(m: any) {
    if (reacted[m.id]) return;
    if (!getToken()) {
      router.push('/you');
      return;
    }
    impact("medium");
    setReacted((prev) => ({ ...prev, [m.id]: true }));
    try {
      await api('/api/moments/' + m.id + '/react', {
        method: 'POST',
        body: JSON.stringify({ type: 'like' }),
      });
    } catch {
      setReacted((prev) => ({ ...prev, [m.id]: false }));
    }
  }

  async function toggleFollow(handle: string) {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    const on = !!followState[handle];
    impact('light');
    setFollowState((prev) => ({ ...prev, [handle]: !on }));
    try {
      await api('/api/users/' + handle + '/follow', { method: on ? 'DELETE' : 'POST' });
    } catch {
      setFollowState((prev) => ({ ...prev, [handle]: on }));
    }
  }

  async function sendMomentGift(giftId: string, message: string, anonymous: boolean, quantity: number, giftName?: string) {
    if (!giftFor || sendingGift) return;
    setSendingGift(true);
    impact('medium');
    try {
      await api('/api/gifts/send', {
        method: 'POST',
        body: JSON.stringify({
          favoriteHandle: giftFor.favorite && giftFor.favorite.user ? giftFor.favorite.user.handle : '',
          catalogItemId: giftId,
          message: message || undefined,
          isAnonymous: anonymous,
          momentId: giftFor.id,
          quantity: quantity || 1,
        }),
      });
      const who = giftFor.favorite && giftFor.favorite.user
        ? giftFor.favorite.user.displayName || '@' + giftFor.favorite.user.handle
        : 'this Favorite';
      setGiftEvents((prev) => [
        { id: giftId + '-' + Date.now(), name: 'You', gift: giftName || 'gift', qty: quantity || 1 },
      ].concat(prev).slice(0, 3));
      setBurstInfo({
        title: 'You sent ' + (quantity > 1 ? 'x' + quantity + ' ' : '') + (giftName || 'a gift'),
        sub: 'to ' + who,
      });
      setBurst(true);
      impact('success');
      setGiftFor(null);
    } catch {
      // the tray keeps its own error state
    } finally {
      setSendingGift(false);
    }
  }

  const rawMoments = dataByTab[tab] || [];
  const visibleMoments = rawMoments.filter((m: any) => {
    if (hiddenIds[m.id]) return false;
    const h = m.favorite && m.favorite.user ? m.favorite.user.handle : '';
    return !(h && mutedAuthors[h]);
  });
  const moments = tab === 'following'
    ? visibleMoments.slice().sort((a, b) =>
        sortNewest
          ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          : (b.reactionCount * 2 + b.supportCount * 3 + b.commentCount) - (a.reactionCount * 2 + a.supportCount * 3 + a.commentCount)
      )
    : rawMoments;
  const milestoneTotal = visibleMoments.reduce((s, m) => s + (m.supportCount || 0) + (m.reactionCount || 0), 0);
  const milestoneTarget = 5000;
  const h = height;

  function mediaSource(m: any): string | null {
    const url: string | null = m.mediaUrl || (m.media && m.media[0] && m.media[0].url) || null;
    if (!url) return null;
    if (url.indexOf("http") === 0) return url;
    return base ? base + url : null;
  }

  const renderItem = ({ item }: { item: any }) => {
    const author = item.favorite?.user || null;
    const handle = author?.handle || "rally";
    const displayName = author?.displayName || "@" + handle;
    const url = mediaSource(item);
    const isLive = tab === "live" || item.isFlash;
    const hasReacted = !!reacted[item.id];
    const commentCount = counts[item.id] ?? (item.commentCount || 0);
    const isFollowing = !!followState[handle];
    const isSaved = !!savedIds[item.id];
    return (
      <View style={[styles.card, { height: h }]}>
        {url && item.mediaType === "image" ? (
          <Image source={{ uri: url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={[GOLD_DEEP + "00", colors.bg, "#00000000"] as [string, string, string]}
            style={StyleSheet.absoluteFill}
          />
        )}
        <LinearGradient
          colors={["#00000000", "#00000000", "rgba(0,0,0,0.82)"] as [string, string, string]}
          style={styles.bottomShade}
        />
        <LinearGradient
          colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.18)", "#00000000"] as [string, string, string]}
          style={styles.topShade}
        />

        {/* Author + text overlay */}
        <View style={[styles.info, { bottom: Math.max(insets.bottom, 96) }]}>
          <Pressable
            style={styles.authorRow}
            onPress={() => {
              click();
              setQuickFor(item);
            }}
          >
            <Avatar name={handle} size={44} ring uri={author?.avatarUrl || undefined} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <View style={styles.nameRow}>
                <Text numberOfLines={1} style={styles.name}>
                  {displayName}
                </Text>
                {isLive ? (
                  <View style={styles.liveBadge}>
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.handleLine}>
                {"@" + handle} {"\u00b7"} {timeAgo(String(item.createdAt || ""))}
              </Text>
            </View>
          </Pressable>
          <Text style={styles.title}>{item.title}</Text>
          {item.description ? (
            <Text numberOfLines={2} style={styles.desc}>
              {item.description}
            </Text>
          ) : null}
          {item.categoryTag ? (
            <View style={styles.tagPill}>
              <Text style={styles.tagText}>{item.categoryTag}</Text>
            </View>
          ) : null}
          {tab === 'following' ? (
            <Pressable
              onPress={() => setWhyFor(whyFor === item.id ? null : item.id)}
              hitSlop={8}
              style={{ marginTop: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}
              accessibilityLabel="Why am I seeing this"
            >
              <Ionicons name="sparkles-outline" size={13} color="rgba(255,255,255,0.6)" />
              <Text style={styles.whyText}>
                {'From a Favorite you follow'} {whyFor === item.id ? '\u00b7 Ranked by recency and engagement' : '\u00b7 Why am I seeing this?'}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* Recent gift chips - mock 19 */}
        {tab === 'following' && giftEvents.length > 0 ? (
          <View style={[styles.giftFeed, { bottom: Math.max(insets.bottom, 96) }]} pointerEvents="none">
            {giftEvents.map((g) => (
              <View key={g.id} style={styles.giftChip}>
                <Ionicons name="gift" size={13} color={GOLD} />
                <Text style={styles.giftChipText}>
                  {g.name + ' sent ' + (g.qty > 1 ? g.gift + ' x' + g.qty : 'a ' + g.gift)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Right action rail */}
        <View style={[styles.rail, { bottom: Math.max(insets.bottom, 96) }]}>
          <Pressable
            style={styles.railBtn}
            onPress={() => {
              click();
              setOptionsFor(item);
            }}
            accessibilityLabel="Post options"
          >
            <Ionicons name="ellipsis-horizontal" size={26} color="#fff" />
          </Pressable>
          <Pressable style={styles.railBtn} onPress={() => toggleFollow(handle)} accessibilityLabel={isFollowing ? 'Following' : 'Follow'}>
            <View style={styles.followWrap}>
              <Avatar name={handle} size={44} ring uri={author?.avatarUrl || undefined} />
              {!isFollowing ? (
                <View style={styles.followPlus}>
                  <Ionicons name="add" size={13} color="#fff" />
                </View>
              ) : null}
            </View>
          </Pressable>
          <Pressable style={styles.railBtn} onPress={() => react(item)} accessibilityLabel="React">
            <Ionicons name={hasReacted ? "heart" : "heart-outline"} size={30} color={hasReacted ? GOLD : "#fff"} />
            <Text style={styles.railLabel}>{(item.reactionCount || 0) + (hasReacted ? 1 : 0)}</Text>
          </Pressable>
          <Pressable
            style={styles.railBtn}
            onPress={() => {
              click();
              setCommentsFor(item.id);
            }}
            accessibilityLabel="Comments"
          >
            <Ionicons name="chatbubble-ellipses-outline" size={28} color="#fff" />
            <Text style={styles.railLabel}>{commentCount}</Text>
          </Pressable>
          <Pressable
            style={styles.railBtn}
            onPress={() => {
              impact("light");
              shareMoment(item.title, item.id);
            }}
            accessibilityLabel="Share"
          >
            <Ionicons name="share-social-outline" size={27} color="#fff" />
            <Text style={styles.railLabel}>Share</Text>
          </Pressable>
          <Pressable
            style={styles.railBtn}
            onPress={() => {
              click();
              setGiftFor(item);
            }}
            accessibilityLabel="Send a gift"
          >
            <View style={styles.giftBubble}>
              <Ionicons name="gift" size={22} color="#111" />
            </View>
            <Text style={styles.railLabel}>Gift</Text>
          </Pressable>
          <Pressable
            style={styles.railBtn}
            onPress={() => {
              impact('light');
              setSavedIds((prev) => ({ ...prev, [item.id]: true }));
              setSaveFor(item.id);
            }}
            accessibilityLabel="Save to Collection"
          >
            <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={26} color={isSaved ? GOLD : '#fff'} />
            <Text style={styles.railLabel}>{isSaved ? 'Saved' : 'Save'}</Text>
          </Pressable>
          <Pressable
            style={styles.railBtn}
            onPress={() => setReportFor(item)}
            accessibilityLabel="Report Moment"
          >
            <Ionicons name="flag-outline" size={24} color="#fff" />
            <Text style={styles.railLabel}>Report</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      {/* Tab bar */}
      <View style={[styles.tabBar, { paddingTop: insets.top + 6 }]}>
        <View style={styles.tabRow}>
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <Pressable
                key={t.key}
                onPress={() => {
                  click();
                  setTab(t.key);
                }}
                style={styles.tabBtn}
                accessibilityLabel={t.label + " tab"}
              >
                <Text style={[styles.tabLabel, { color: active ? "#fff" : "rgba(255,255,255,0.55)" }]}>
                  {t.label}
                </Text>
                {active ? (
                  <View style={styles.tabUnderline} />
                ) : null}
              </Pressable>
            );
          })}
          <Pressable onPress={() => load(tab)} hitSlop={10} style={styles.refreshBtn} accessibilityLabel="Refresh feed">
            <Ionicons name="refresh" size={18} color="rgba(255,255,255,0.55)" />
          </Pressable>
        </View>
      </View>

      {tab === 'following' && milestoneTotal > 0 ? (
        <View pointerEvents="none" style={[styles.milestone, { top: insets.top + 54 }]}>
          <View style={styles.milestoneTop}>
            <Text style={styles.milestoneTitle}>Milestone: 5,000 Gifts</Text>
            <Text style={styles.milestoneCount}>
              {Math.min(milestoneTotal, milestoneTarget).toLocaleString()} / {milestoneTarget.toLocaleString()}
            </Text>
          </View>
          <View style={styles.milestoneTrack}>
            <View style={[styles.milestoneFill, { width: Math.min(100, (milestoneTotal / milestoneTarget) * 100) + '%' }]} />
          </View>
        </View>
      ) : null}

      {tab === 'following' && moments.length > 0 ? (
        <View style={[styles.sortRow, { top: insets.top + (milestoneTotal > 0 ? 112 : 54) }]}>
          <Pressable style={styles.sortChip} onPress={() => setSortNewest((s) => !s)} accessibilityLabel="Sort feed">
            <Ionicons name="time-outline" size={14} color="#fff" />
            <Text style={styles.sortChipText}>{sortNewest ? 'Newest' : 'Top'}</Text>
          </Pressable>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={GOLD} style={{ flex: 1 }} />
      ) : moments.length === 0 ? (
        <View style={[styles.emptyWrap, { paddingTop: insets.top + 60 }]}>
          {failed && tab === "following" ? (
            <EmptyState
              icon="lock-closed-outline"
              title="Sign in to follow your Favorites"
              body="Create an account or sign in, then follow Favorites to fill this feed."
            />
          ) : tab === "live" ? (
            <EmptyState
              icon="flash-outline"
              title="No live Moments right now"
              body="Flash Moments drop for 24 hours. Check back soon!"
            />
          ) : (
            <EmptyState
              icon="trending-up-outline"
              title="Quiet for now"
              body="No Moments here yet. Discover Favorites on the Explore tab."
            />
          )}
        </View>
      ) : (
        <FlatList
          data={moments}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToAlignment="start"
          decelerationRate="fast"
          getItemLayout={(_data, index) => ({ length: h, offset: h * index, index })}
          windowSize={3}
        />
      )}

      <CommentsSheet
        visible={commentsFor !== null}
        onClose={() => setCommentsFor(null)}
        momentId={commentsFor || ""}
        count={commentsFor ? counts[commentsFor] || 0 : 0}
        onCountChange={(n) => {
          if (commentsFor) setCounts((prev) => ({ ...prev, [commentsFor]: n }));
        }}
      />
      <ReportSheet
        visible={reportFor !== null}
        onClose={() => setReportFor(null)}
        targetType="moment"
        targetId={reportFor ? reportFor.id : ""}
        subjectLabel={reportFor ? reportFor.title : ""}
      />
      <SaveToCollectionSheet
        visible={saveFor !== null}
        onClose={() => setSaveFor(null)}
        momentId={saveFor || undefined}
      />
      <GiftTraySheet
        visible={giftFor !== null}
        onClose={() => setGiftFor(null)}
        name={giftFor && giftFor.favorite && giftFor.favorite.user
          ? giftFor.favorite.user.displayName || giftFor.favorite.user.handle
          : ''}
        onSend={sendMomentGift}
        sending={sendingGift}
      />
      <FavoriteQuickView
        visible={quickFor !== null}
        onClose={() => setQuickFor(null)}
        handle={quickFor && quickFor.favorite && quickFor.favorite.user ? quickFor.favorite.user.handle : ''}
        displayName={quickFor && quickFor.favorite && quickFor.favorite.user ? quickFor.favorite.user.displayName : ''}
        avatarUrl={quickFor && quickFor.favorite && quickFor.favorite.user ? quickFor.favorite.user.avatarUrl : null}
        isFollowing={quickFor ? !!followState[quickFor.favorite && quickFor.favorite.user ? quickFor.favorite.user.handle : ''] : false}
        onToggleFollow={() => {
          if (quickFor && quickFor.favorite && quickFor.favorite.user) {
            const h = quickFor.favorite.user.handle;
            if (h) toggleFollow(h);
          }
        }}
        onGift={() => {
          const m = quickFor;
          setQuickFor(null);
          setGiftFor(m);
        }}
      />
      <PostOptionsSheet
        visible={optionsFor !== null}
        onClose={() => setOptionsFor(null)}
        postId={optionsFor ? optionsFor.id : ''}
        authorHandle={optionsFor && optionsFor.favorite && optionsFor.favorite.user ? optionsFor.favorite.user.handle : ''}
        authorName={optionsFor && optionsFor.favorite && optionsFor.favorite.user ? optionsFor.favorite.user.displayName || '' : ''}
        postBody={optionsFor ? String(optionsFor.title || '') : ''}
        onNotInterested={() => {
          const m = optionsFor;
          setOptionsFor(null);
          setNotInterestedFor(m);
        }}
        onMute={() => {
          const m = optionsFor;
          if (m && m.favorite && m.favorite.user) muteAuthor(m.favorite.user.handle, m.favorite.user.displayName || 'them');
          else setOptionsFor(null);
        }}
        onReport={() => {
          const m = optionsFor;
          setOptionsFor(null);
          setReportFor(m);
        }}
        onSaveToCollection={() => {
          const m = optionsFor;
          setOptionsFor(null);
          if (m) setSaveFor(m.id);
        }}
        onShare={() => {
          const m = optionsFor;
          setOptionsFor(null);
          if (m) shareMoment(m.title, m.id);
        }}
        onTranslated={() => undefined}
      />
      <NotInterestedSheet
        visible={notInterestedFor !== null}
        onClose={() => setNotInterestedFor(null)}
        authorName={notInterestedFor && notInterestedFor.favorite && notInterestedFor.favorite.user ? notInterestedFor.favorite.user.displayName || '' : ''}
        onDone={(reason, muteFor30Days) => {
          const m = notInterestedFor;
          setNotInterestedFor(null);
          if (!m) return;
          if (muteFor30Days && m.favorite && m.favorite.user) {
            muteAuthor(m.favorite.user.handle, m.favorite.user.displayName || 'them');
          } else {
            hidePost(m.id, 'Post hidden \u00b7 ' + reason);
          }
        }}
      />
      {toast ? (
        <View style={[styles.toastWrap, { bottom: Math.max(96, 96) }]} pointerEvents="box-none">
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
            <Pressable onPress={() => undoHide()} hitSlop={8} accessibilityLabel="Undo">
              <Text style={styles.undoText}>Undo</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      <GiftBurst
        visible={burst}
        title={burstInfo ? burstInfo.title : undefined}
        sub={burstInfo ? burstInfo.sub : undefined}
        onDone={() => setBurst(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  card: { flex: 1, overflow: "hidden" },
  bottomShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "55%",
  },
  topShade: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 160,
  },
  info: {
    position: "absolute",
    left: 16,
    right: 88,
  },
  authorRow: { flexDirection: "row", alignItems: "center" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { color: "#fff", fontWeight: "900", fontSize: 16 },
  liveBadge: {
    backgroundColor: LIVE_RED,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  liveText: { color: "#fff", fontSize: 10, fontWeight: "900" },
  handleLine: { color: "rgba(255,255,255,0.72)", fontSize: 13, marginTop: 1 },
  title: { color: "#fff", fontWeight: "900", fontSize: 19, lineHeight: 26, marginTop: 12 },
  desc: { color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 20, marginTop: 6 },
  tagPill: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginTop: 10,
  },
  tagText: { color: GOLD, fontSize: 11, fontWeight: "800" },
  rail: {
    position: "absolute",
    right: 10,
    alignItems: "center",
    gap: 18,
  },
  railBtn: { alignItems: "center", gap: 4 },
  railLabel: { color: "#fff", fontSize: 12, fontWeight: "700" },
  giftBubble: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 22,
  },
  tabBtn: { alignItems: "center", paddingVertical: 4 },
  tabLabel: { fontWeight: "900", fontSize: 15 },
  tabUnderline: {
    marginTop: 3,
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: GOLD,
  },
  refreshBtn: { position: "absolute", right: 16 },
  emptyWrap: { flex: 1, paddingHorizontal: 24, alignItems: "center" },
  whyText: { color: "rgba(255,255,255,0.6)", fontSize: 12, flex: 1, lineHeight: 17 },
  followWrap: { width: 44, height: 44 },
  followPlus: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.6)",
  },
  milestone: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 12,
    backgroundColor: "rgba(20,20,24,0.82)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  milestoneTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  milestoneTitle: { color: "#fff", fontWeight: "900", fontSize: 14 },
  milestoneCount: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: "700" },
  milestoneTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.16)",
    marginTop: 8,
    overflow: "hidden",
  },
  milestoneFill: { height: 5, borderRadius: 3, backgroundColor: GOLD },
  sortRow: { position: "absolute", left: 16, zIndex: 12 },
  sortChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(20,20,24,0.82)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  sortChipText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  giftFeed: { position: 'absolute', left: 16, gap: 8, zIndex: 8 },
  giftChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(20,20,24,0.85)',
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  giftChipText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  toastWrap: { position: 'absolute', left: 16, right: 16, zIndex: 30, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(20,20,24,0.92)',
    borderRadius: radii.full,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  toastText: { color: '#fff', fontSize: 13, fontWeight: '700', flex: 1 },
  undoText: { color: GOLD, fontSize: 13, fontWeight: '900' },
});