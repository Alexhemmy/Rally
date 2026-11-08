/** Fan Profile - Rally design
 * Unified with the Favorite profile look: gradient banner, gold-ring
 * avatar, role chips, follow / share / report actions, and
 * supporter progress. Data from GET /api/users/:handle.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { GlassCard, SectionHeader, Avatar, EmptyState } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { ReportSheet } from '@/components/ReportSheet';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { shareMoment } from '@/hooks/useShare';
import { spacing, radii, type as typo } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const PURPLE = '#7C4DFF';

export default function FanProfileScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const { click } = useSounds();
  const userHandle = String(handle || "").toLowerCase();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [following, setFollowing] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const res = await api<{ user: any }>('/api/users/' + userHandle, {
        skipAuth: !getToken(),
      });
      setUser(res.user);
      setFollowing(!!res.user?.isFollowing);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [userHandle]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleFollow() {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    impact("medium");
    const next = !following;
    setFollowing(next);
    try {
      if (next) {
        await api('/api/users/' + userHandle + '/follow', { method: 'POST' });
      } else {
        await api('/api/users/' + userHandle + '/follow', { method: 'DELETE' });
      }
    } catch {
      setFollowing(!next);
    }
  }

  if (loading) {
    return (
      <SwipeBack>
        <Screen>
          <ActivityIndicator color={GOLD} style={{ marginTop: 80 }} />
        </Screen>
      </SwipeBack>
    );
  }

  if (failed || !user) {
    return (
      <SwipeBack>
        <Screen>
          <View style={{ marginTop: spacing.lg }}>
            <EmptyState
              icon="person-outline"
              title="Profile not found"
              body="This fan may have changed their handle or left Rally."
            />
          </View>
        </Screen>
      </SwipeBack>
    );
  }

  const name = user.displayName || "@" + user.handle;
  const roles: string[] = user.roles || [];
  const favProfile = user.favoriteProfile || null;
  const isFavorite = !!(favProfile && favProfile.id);
  const verified = user.verificationStatus === "verified";

  return (
    <SwipeBack>
      <Screen>
        {/* Banner + header */}
        <GlassCard padded={false} style={styles.profileCard}>
          <LinearGradient
            colors={[GOLD, GOLD_DEEP, PURPLE] as [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.banner}
          />
          <View style={styles.profileBody}>
            <View style={styles.avatarWrap}>
              <Avatar name={user.handle} size={80} ring uri={user.avatarUrl || undefined} />
            </View>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
              {verified ? <Ionicons name="checkmark-circle" size={17} color={GOLD} /> : null}
            </View>
            <Text style={[styles.handleText, { color: colors.muted }]}>@{user.handle}</Text>
            <View style={styles.chipRow}>
              {roles.map((r) => (
                <View
                  key={r}
                  style={[styles.chip, { borderColor: r === "FAVORITE" ? GOLD : colors.border }]}
                >
                  <Text style={[styles.chipText, { color: r === "FAVORITE" ? GOLD : colors.muted }]}>{r}</Text>
                </View>
              ))}
            </View>
            {user.bio ? (
              <Text style={[styles.bio, { color: colors.muted }]}>{user.bio}</Text>
            ) : null}
          </View>
        </GlassCard>

        {/* Actions */}
        <View style={styles.actionRow}>
          <Pressable onPress={toggleFollow} style={{ flex: 1 }} accessibilityLabel={following ? "Unfollow" : "Follow"}>
            <LinearGradient
              colors={following ? ([colors.surface, colors.surface] as [string, string]) : ([GOLD, GOLD_DEEP] as [string, string])}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.followBtn, following && { borderWidth: 1, borderColor: colors.border }]}
            >
              <Ionicons name={following ? "checkmark" : "person-add"} size={17} color={following ? colors.text : "#111"} />
              <Text style={[styles.followText, { color: following ? colors.text : "#111" }]}>
                {following ? "Following" : "Follow"}
              </Text>
            </LinearGradient>
          </Pressable>
          <Pressable
            onPress={() => {
              impact("light");
              shareMoment(name, user.handle);
            }}
            style={[styles.iconBtn, { borderColor: colors.border }]}
            accessibilityLabel="Share profile"
          >
            <Ionicons name="share-social-outline" size={19} color={colors.text} />
          </Pressable>
          <Pressable
            onPress={() => setReportOpen(true)}
            style={[styles.iconBtn, { borderColor: colors.border }]}
            accessibilityLabel="Report user"
          >
            <Ionicons name="flag-outline" size={19} color={colors.text} />
          </Pressable>
        </View>

        {/* Favorite page shortcut */}
        {isFavorite ? (
          <GlassCard style={{ marginTop: spacing.md }} padded={false}>
            <Pressable
              onPress={() => {
                click();
                router.push('/favorite/' + user.handle);
              }}
              style={({ pressed }) => [styles.favoriteLink, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={styles.favoriteLeft}>
                <View style={styles.starBubble}>
                  <Ionicons name="star" size={16} color="#111" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.favoriteTitle, { color: colors.text }]}>Open Favorite page</Text>
                  <Text style={[styles.favoriteSub, { color: colors.muted }]}>
                    Moments, gifts and supporter wall
                  </Text>
                </View>
              </View>
              <Text style={{ color: GOLD, fontSize: 18 }}>{"\u203a"}</Text>
            </Pressable>
          </GlassCard>
        ) : null}

        {/* Supporter progress */}
        <GlassCard style={{ marginTop: spacing.md }}>
          <SectionHeader title="Supporter progress" />
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
            Levels unlock as you gift and engage with Favorites.
          </Text>
          <View style={{ marginTop: spacing.md, gap: 12 }}>
            {['Bronze', 'Silver', 'Gold'].map((level, i) => (
              <View key={level}>
                <View style={styles.levelRow}>
                  <Text style={{ color: colors.text, fontWeight: "600", fontSize: 14 }}>{level}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>{i === 0 ? "Unlocked" : "Locked"}</Text>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: i === 0 ? "100%" : i === 1 ? "35%" : "0%",
                        backgroundColor: GOLD,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </GlassCard>

        <ReportSheet
          visible={reportOpen}
          onClose={() => setReportOpen(false)}
          targetType="user"
          targetId={user.id}
          subjectLabel={name}
        />
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  profileCard: { overflow: "hidden" },
  banner: {
    height: 96,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
  },
  profileBody: { alignItems: "center", paddingHorizontal: 16 },
  avatarWrap: { marginTop: -40 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  name: { fontSize: 21, fontWeight: "900" },
  handleText: { fontSize: 13, marginTop: 3 },
  chipRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  chipText: { fontSize: 11, fontWeight: "800" },
  bio: { fontSize: 13, lineHeight: 19, marginTop: 10, textAlign: "center" },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  },
  followBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radii.full,
    paddingVertical: 13,
  },
  followText: { fontWeight: "800", fontSize: 15 },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  favoriteLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  starBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteTitle: { fontWeight: "800", fontSize: 15 },
  favoriteSub: { fontSize: 12, marginTop: 2 },
  levelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
});