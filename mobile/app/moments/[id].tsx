/** Moment Detail - Rally design
 * Real Moment data from GET /api/moments/:id with author row, media,
 * badges, engagement stats, react/comment/share/report actions,
 * the Comments bottom sheet and the Report sheet.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { GlassCard, Avatar, EmptyState } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { CommentsSheet } from '@/components/CommentsSheet';
import { ReportSheet } from '@/components/ReportSheet';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { shareMoment } from '@/hooks/useShare';
import { spacing, radii, type as typo } from '@/constants/theme';
import { api } from '@/lib/api';
import { getApiUrl } from '@/lib/config';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const TEAL = '#00897B';

function timeAgo(iso: string) {
  const t = new Date(iso).getTime();
  if (!t) return "";
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return Math.floor(s / 60) + "m";
  if (s < 86400) return Math.floor(s / 3600) + "h";
  return Math.floor(s / 86400) + "d";
}

export default function MomentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const { click } = useSounds();
  const momentId = String(id || "");

  const [moment, setMoment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reacted, setReacted] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [base, setBase] = useState('');

  const load = useCallback(async () => {
    if (!momentId) return;
    setLoading(true);
    setFailed(false);
    try {
      const res = await api<{ moment: any }>('/api/moments/' + momentId, { skipAuth: true });
      setMoment(res.moment);
      setCommentCount(res.moment?.commentCount || 0);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [momentId]);

  useEffect(() => {
    load();
    getApiUrl().then((b) => setBase(b || '')).catch(() => undefined);
  }, [load]);

  async function react() {
    if (reacted) return;
    impact("light");
    setReacted(true);
    try {
      await api('/api/moments/' + momentId + '/react', {
        method: 'POST',
        body: JSON.stringify({ type: 'like' }),
      });
    } catch {
      setReacted(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={GOLD} style={{ marginTop: 80 }} />
      </Screen>
    );
  }

  if (failed || !moment) {
    return (
      <SwipeBack>
        <Screen>
          <Text style={[styles.h1, { color: colors.text }]}>Moment</Text>
          <View style={{ marginTop: spacing.lg }}>
            <EmptyState
              icon="cloud-offline-outline"
              title="Moment not found"
              body="It may have been removed or is no longer available."
            />
          </View>
          <Pressable onPress={() => router.back()} style={styles.backLink}>
            <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 15 }}>Go back</Text>
          </Pressable>
        </Screen>
      </SwipeBack>
    );
  }

  const author = moment.favorite?.user || null;
  const handle = author?.handle || "rally";
  const displayName = author?.displayName || "@" + handle;
  const mediaUrl: string | null = moment.mediaUrl || null;
  const mediaType: string | null = moment.mediaType || null;
  const fullUrl =
    mediaUrl && mediaUrl.indexOf("http") === 0 ? mediaUrl : mediaUrl ? base + mediaUrl : null;
  const isImage = mediaType === "image" && !!fullUrl;

  return (
    <SwipeBack>
      <Screen>
        {/* Header */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text, flex: 1 }]}>Moment</Text>
        </View>

        {/* Moment card */}
        <GlassCard style={{ marginTop: spacing.sm }}>
          <Pressable
            style={styles.authorRow}
            onPress={() => {
              click();
              router.push('/favorite/' + handle);
            }}
          >
            <Avatar name={handle} size={44} ring uri={author?.avatarUrl || undefined} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text numberOfLines={1} style={[styles.authorName, { color: colors.text }]}>
                {displayName}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 13 }}>
                {"@" + handle} {"\u00b7"} {timeAgo(String(moment.createdAt || ""))}
              </Text>
            </View>
            {moment.isFlash ? (
              <View style={styles.flashBadge}>
                <Ionicons name="flash" size={12} color="#111" />
                <Text style={styles.flashText}>FLASH</Text>
              </View>
            ) : null}
          </Pressable>

          <Text style={[styles.body, { color: colors.text }]}>{moment.title}</Text>
          {moment.description ? (
            <Text style={[styles.desc, { color: colors.muted }]}>{moment.description}</Text>
          ) : null}

          {isImage ? (
            <Image source={{ uri: fullUrl }} style={styles.media} resizeMode="cover" />
          ) : mediaType === "audio" ? (
            <View style={[styles.mediaPlaceholder, { borderColor: colors.border }]}>
              <Ionicons name="disc" size={30} color={GOLD} />
              <Text style={[styles.mediaLabel, { color: colors.text }]}>Audio Moment</Text>
            </View>
          ) : mediaType === "video" ? (
            <View style={[styles.mediaPlaceholder, { borderColor: colors.border }]}>
              <Ionicons name="videocam" size={30} color={GOLD} />
              <Text style={[styles.mediaLabel, { color: colors.text }]}>Video Moment</Text>
            </View>
          ) : null}

          {/* Stats row */}
          <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
            <View style={styles.stat}>
              <Ionicons name="heart" size={16} color={GOLD} />
              <Text style={[styles.statText, { color: colors.muted }]}>{moment.reactionCount || 0}</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="chatbubble" size={16} color={TEAL} />
              <Text style={[styles.statText, { color: colors.muted }]}>{commentCount}</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="flash" size={16} color={GOLD} />
              <Text style={[styles.statText, { color: colors.muted }]}>{moment.supportCount || 0}</Text>
            </View>
            {moment.categoryTag ? (
              <View style={[styles.tagPill, { borderColor: GOLD }]}>
                <Text style={[styles.tagText, { color: GOLD }]}>{moment.categoryTag}</Text>
              </View>
            ) : null}
          </View>
        </GlassCard>

        {/* Actions */}
        <GlassCard style={{ marginTop: spacing.md }}>
          <View style={styles.actionRow}>
            <Pressable onPress={react} style={styles.action} accessibilityLabel="React to Moment">
              <Ionicons name={reacted ? "heart" : "heart-outline"} size={22} color={reacted ? GOLD : colors.muted} />
              <Text style={[styles.actionLabel, { color: reacted ? GOLD : colors.muted }]}>React</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                click();
                setCommentsOpen(true);
              }}
              style={styles.action}
              accessibilityLabel="Open comments"
            >
              <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.muted} />
              <Text style={[styles.actionLabel, { color: colors.muted }]}>{commentCount}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                impact("light");
                shareMoment(moment.title, moment.id);
              }}
              style={styles.action}
              accessibilityLabel="Share Moment"
            >
              <Ionicons name="share-social-outline" size={22} color={colors.muted} />
              <Text style={[styles.actionLabel, { color: colors.muted }]}>Share</Text>
            </Pressable>
            <Pressable
              onPress={() => setReportOpen(true)}
              style={styles.action}
              accessibilityLabel="Report Moment"
            >
              <Ionicons name="flag-outline" size={22} color={colors.muted} />
              <Text style={[styles.actionLabel, { color: colors.muted }]}>Report</Text>
            </Pressable>
          </View>
        </GlassCard>

        <CommentsSheet
          visible={commentsOpen}
          onClose={() => setCommentsOpen(false)}
          momentId={momentId}
          count={commentCount}
          onCountChange={setCommentCount}
        />
        <ReportSheet
          visible={reportOpen}
          onClose={() => setReportOpen(false)}
          targetType="moment"
          targetId={momentId}
          subjectLabel={moment.title}
        />
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: spacing.sm },
  h1: { ...typo.h1, marginBottom: 0 },
  authorRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  authorName: { fontWeight: "800", fontSize: 15 },
  flashBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: GOLD,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  flashText: { color: "#111", fontWeight: "900", fontSize: 11 },
  body: { fontSize: 18, fontWeight: "800", lineHeight: 25, marginBottom: 8 },
  desc: { fontSize: 15, lineHeight: 22, marginBottom: 4 },
  media: {
    width: "100%",
    height: 240,
    borderRadius: radii.md,
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  mediaPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: radii.md,
    height: 120,
    marginTop: 10,
    marginBottom: 10,
  },
  mediaLabel: { fontWeight: "800", fontSize: 14 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 12,
  },
  stat: { flexDirection: "row", alignItems: "center", gap: 5 },
  statText: { fontSize: 13, fontWeight: "700" },
  tagPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginLeft: "auto",
  },
  tagText: { fontSize: 11, fontWeight: "800" },
  actionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  action: { alignItems: "center", gap: 5, paddingVertical: 4, paddingHorizontal: 6 },
  actionLabel: { fontSize: 12, fontWeight: "700" },
  backLink: { marginTop: spacing.md, alignSelf: "center" },
});