/** FavoriteQuickView - Rally design (mock 17)
 * Quick view sheet over the Moment player: avatar, verified check,
 * FAVORITE badge, Fans / Moments / Level stats, three recent media
 * tiles, Follow + Gift buttons, and View full profile.
 */
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '@/components/ThemeProvider';
import { radii } from '@/constants/theme';
import { api } from '@/lib/api';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const TEAL = '#34D399';

const GRADIENTS: [string, string][] = [
  ['#C2410C', '#F59E0B'],
  ['#4F46E5', '#818CF8'],
  ['#EA580C', '#FBBF24'],
];

type ProfileRes = {
  user: {
    handle: string;
    displayName: string;
    avatarUrl?: string | null;
    verificationStatus?: string;
    isFollowing?: boolean;
    favoriteProfile?: { supporterCount?: number; isPublished?: boolean } | null;
  };
};

function level(supporters: number): string {
  if (supporters >= 500) return 'Legend';
  if (supporters >= 50) return 'Established';
  return 'Rising';
}

function compact(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

export function FavoriteQuickView({
  visible,
  onClose,
  handle,
  displayName,
  avatarUrl,
  isFollowing,
  onToggleFollow,
  onGift,
}: {
  visible: boolean;
  onClose: () => void;
  handle: string;
  displayName: string;
  avatarUrl?: string | null;
  isFollowing: boolean;
  onToggleFollow: () => void;
  onGift: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fans, setFans] = useState<number | null>(null);
  const [momentCount, setMomentCount] = useState<number | null>(null);
  const [tiles, setTiles] = useState<string[]>([]);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!visible || !handle) return;
    setLoading(true);
    setFans(null);
    setMomentCount(null);
    setTiles([]);
    (async () => {
      try {
        const p = await api<ProfileRes>('/api/users/' + handle, { skipAuth: true });
        setFans(p.user.favoriteProfile ? p.user.favoriteProfile.supporterCount || 0 : null);
        setVerified(p.user.verificationStatus === 'verified');
      } catch {
        // keep the sheet usable with what the caller passed
      }
      try {
        const m = await api<{ moments: { mediaUrl?: string | null; media?: { url: string }[] }[] }>(
          '/api/moments/favorite/' + handle,
          { skipAuth: true }
        );
        const list = m.moments || [];
        setMomentCount(list.length);
        const urls: string[] = [];
        for (const mm of list) {
          const u = mm.mediaUrl || (mm.media && mm.media[0] && mm.media[0].url) || null;
          if (u && urls.length < 3) urls.push(u);
        }
        setTiles(urls);
      } catch {
        setMomentCount(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [visible, handle]);

  const initials = (displayName || handle || '?').slice(0, 2).toUpperCase();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: Math.max(20, insets.bottom + 8) }]}
          onPress={() => undefined}
        >
          <View style={styles.grabHandle} />

          {/* Identity */}
          <View style={styles.idRow}>
            <LinearGradient
              colors={[GOLD, GOLD_DEEP] as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarWrap}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
            </LinearGradient>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <View style={styles.nameRow}>
                <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>{displayName || handle}</Text>
                {verified ? (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={11} color="#fff" />
                  </View>
                ) : null}
              </View>
              <Text numberOfLines={1} style={[styles.sub, { color: colors.muted }]}>
                {'@' + handle}
              </Text>
              <View style={[styles.favBadge, { backgroundColor: TEAL + '22' }]}>
                <Text style={[styles.favBadgeText, { color: TEAL }]}>FAVORITE</Text>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text }]}>{fans === null ? '\u2014' : compact(fans)}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Fans</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text }]}>{momentCount === null ? '\u2014' : String(momentCount)}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Moments</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text }]}>{fans === null ? '\u2014' : level(fans)}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Level</Text>
            </View>
          </View>

          {/* Recent media tiles */}
          {loading ? (
            <ActivityIndicator color={GOLD} style={{ marginVertical: 18 }} />
          ) : (
            <View style={styles.tilesRow}>
              {[0, 1, 2].map((i) =>
                tiles[i] ? (
                  <Image key={i} source={{ uri: tiles[i] }} style={styles.tile} resizeMode="cover" />
                ) : (
                  <LinearGradient
                    key={i}
                    colors={GRADIENTS[i] as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.tile}
                  />
                )
              )}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsRow}>
            <Pressable
              onPress={onToggleFollow}
              style={({ pressed }) => [styles.followBtn, pressed && { opacity: 0.85 }]}
              accessibilityLabel={isFollowing ? 'Following' : 'Follow'}
            >
              <Text style={styles.followText}>{isFollowing ? 'Following' : 'Follow'}</Text>
            </Pressable>
            <Pressable
              onPress={onGift}
              style={[styles.giftBtn, { backgroundColor: colors.surfaceElevated }]}
              accessibilityLabel="Send a gift"
            >
              <Ionicons name="gift-outline" size={18} color={colors.text} />
              <Text style={[styles.giftText, { color: colors.text }]}>Gift</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => {
              onClose();
              router.push('/favorite/' + handle);
            }}
            hitSlop={8}
            accessibilityLabel="View full profile"
          >
            <Text style={[styles.fullProfile, { color: GOLD }]}>View full profile</Text>
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
    marginBottom: 16,
  },
  idRow: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 64, height: 64 },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 20 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 19, fontWeight: '900' },
  checkBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sub: { fontSize: 14, marginTop: 1 },
  favBadge: {
    alignSelf: 'flex-start',
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 6,
  },
  favBadgeText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  statsRow: { flexDirection: 'row', marginTop: 16, marginBottom: 14 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 13, marginTop: 2 },
  tilesRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  tile: { flex: 1, height: 110, borderRadius: radii.md },
  actionsRow: { flexDirection: 'row', gap: 12 },
  followBtn: {
    flex: 1,
    backgroundColor: GOLD,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  followText: { color: '#111', fontWeight: '900', fontSize: 16 },
  giftBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  giftText: { fontWeight: '800', fontSize: 16 },
  fullProfile: { textAlign: 'center', fontWeight: '800', fontSize: 15, marginTop: 14 },
});
