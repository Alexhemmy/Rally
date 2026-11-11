/** My Profile (UX 39) - Rally design
 * The fan's own profile: avatar, handle, bio, real stats, and quick
 * links. Stats come from the live account and collections; anything
 * that has no backend yet is omitted rather than faked.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { Avatar } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#FFA726';

type Me = {
  handle: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  countryCode?: string | null;
  tokenWallet?: { balance?: number | string } | null;
  favoriteProfile?: { isPublished?: boolean; supporterCount?: number } | null;
};

export default function ProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();

  const [me, setMe] = useState<Me | null>(null);
  const [collectionsCount, setCollectionsCount] = useState(0);
  const [favHandle, setFavHandle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    try {
      const r: any = await api('/api/auth/me');
      setMe(r.user || null);
    } catch { /* offline */ }
    try {
      const c: any = await api('/api/collections/me');
      setCollectionsCount((c.collections || []).length);
    } catch { /* offline */ }
    try {
      const raw = await AsyncStorage.getItem('rally.myFavoriteHandle');
      if (raw) setFavHandle(JSON.parse(raw));
    } catch { /* local only */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function shareProfile() {
    if (!me) return;
    impact('light');
    try {
      await Share.share({ message: me.displayName + ' (@' + me.handle + ') on Rally' });
    } catch { /* dismissed */ }
  }

  const balance = me && me.tokenWallet ? Number(me.tokenWallet.balance || 0) : 0;
  const supporters = me && me.favoriteProfile && me.favoriteProfile.isPublished
    ? Number(me.favoriteProfile.supporterCount || 0)
    : null;

  return (
    <SwipeBack>
      <Screen>
        {/* Header actions */}
        <View style={styles.topBar}>
          <Pressable onPress={shareProfile} hitSlop={10} accessibilityLabel="Share profile">
            <Ionicons name="share-social-outline" size={24} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }} />
          <Pressable onPress={() => router.push('/settings')} hitSlop={10} accessibilityLabel="Settings">
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </Pressable>
        </View>

        {loading ? (
          <Text style={{ color: colors.muted, fontSize: 14, marginTop: spacing.lg }}>Loading…</Text>
        ) : !me ? (
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: spacing.lg }}>
            Sign in to see your profile.
          </Text>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Identity */}
            <View style={styles.identity}>
              <Avatar uri={me.avatarUrl || undefined} name={me.displayName} size={96} />
              <Text style={[styles.name, { color: colors.text }]}>{me.displayName}</Text>
              <Text style={[styles.sub, { color: colors.muted }]}>
                @{me.handle}{me.countryCode ? ' · ' + me.countryCode : ''}
              </Text>
              <View style={[styles.levelChip, { backgroundColor: GOLD + '22' }]}>
                <Text style={{ color: GOLD, fontSize: 11, fontWeight: '900', letterSpacing: 1 }}>SUPPORTER</Text>
              </View>
              {me.bio ? (
                <Text style={[styles.bio, { color: colors.textSecondary }]}>{me.bio}</Text>
              ) : null}
            </View>

            {/* Stats */}
            <View style={[styles.statsRow, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.text }]}>{balance.toLocaleString('en-US')}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Tokens</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.text }]}>{collectionsCount}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Collections</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.text }]}>{supporters === null ? '—' : supporters.toLocaleString('en-US')}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Supporters</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionRow}>
              <Pressable
                onPress={() => router.push('/edit-profile')}
                style={[styles.actionBtn, { backgroundColor: colors.surfaceElevated }]}
                accessibilityLabel="Edit profile"
              >
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>Edit profile</Text>
              </Pressable>
              <Pressable onPress={shareProfile} style={[styles.actionBtn, { backgroundColor: colors.surfaceElevated }]} accessibilityLabel="Share">
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>Share</Text>
              </Pressable>
            </View>

            {/* Quick links */}
            <View style={[styles.linksCard, { borderColor: colors.border }]}>
              <Pressable
                style={styles.linkRow}
                onPress={() => router.push(favHandle ? '/badges?handle=' + favHandle : '/search')}
                accessibilityLabel="Badges"
              >
                <Ionicons name="ribbon-outline" size={20} color={GOLD} />
                <Text style={[styles.linkText, { color: colors.text, flex: 1 }]}>Badges</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </Pressable>
              <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />
              <Pressable
                style={styles.linkRow}
                onPress={() => router.push('/collections')}
                accessibilityLabel="Collections"
              >
                <Ionicons name="albums-outline" size={20} color={GOLD} />
                <Text style={[styles.linkText, { color: colors.text, flex: 1 }]}>Collections</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </Pressable>
              {supporters !== null ? (
                <>
                  <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />
                  <Pressable
                    style={styles.linkRow}
                    onPress={() => router.push('/supporters')}
                    accessibilityLabel="My supporters"
                  >
                    <Ionicons name="people-outline" size={20} color={GOLD} />
                    <Text style={[styles.linkText, { color: colors.text, flex: 1 }]}>My supporters</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                  </Pressable>
                </>
              ) : null}
            </View>
          </ScrollView>
        )}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, marginBottom: spacing.sm },
  identity: { alignItems: 'center', paddingHorizontal: 20 },
  name: { fontSize: 24, fontWeight: '900', marginTop: 14 },
  sub: { fontSize: 14, marginTop: 3 },
  levelChip: { borderRadius: radii.full, paddingHorizontal: 12, paddingVertical: 5, marginTop: 10 },
  bio: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 12 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 16,
    marginTop: spacing.lg,
  },
  stat: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 12 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: spacing.lg },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: radii.full },
  linksCard: { borderWidth: 1, borderRadius: radii.lg, marginTop: spacing.lg, overflow: 'hidden' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 15 },
  linkText: { fontSize: 15, fontWeight: '600' },
});
