/** My Profile (mock 02) - full profile page.
 * Centered avatar, name, handle and city (city hidden when the
 * Show my city preference is off), level chip, bio, Edit profile +
 * Share, and Badges / Collections / Activity tabs. Badges come from
 * the real /api/badges endpoint for the Favorite you follow most
 * recently; Collections from /api/collections/me; Activity from
 * /api/notifications. Empty states say what is missing honestly.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#FFA726';
const TEAL = '#34D399';

type Badge = { slug: string; name: string; earned: boolean; context: string | null };
type Collection = { id: string; title: string; momentCount?: number };
type Notif = { id: string; title?: string; body?: string; createdAt?: string };

const BADGE_COLORS: Record<string, string> = {
  'first-supporter': '#FB923C',
  'day-one': '#2DD4BF',
  'top-10': '#8B5CF6',
  'one-year': '#60A5FA',
  streak: '#F87171',
  impact: '#34D399',
};

const BADGE_ICONS: Record<string, string> = {
  'first-supporter': 'star',
  'day-one': 'heart',
  'top-10': 'trophy',
  'one-year': 'calendar-outline',
  streak: 'flame',
  impact: 'water-outline',
};

const GRADS: [string, string][] = [
  ['#F59E0B', '#EF4444'],
  ['#3B82F6', '#8B5CF6'],
  ['#10B981', '#2DD4BF'],
  ['#EC4899', '#F97316'],
];

function initials(name: string): string {
  return (name || '?').slice(0, 2).toUpperCase();
}

export default function MyProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();

  const [tab, setTab] = useState<'badges' | 'collections' | 'activity'>('badges');
  const [me, setMe] = useState<any>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [levelName, setLevelName] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [showCity, setShowCity] = useState(true);

  const load = useCallback(async () => {
    if (!getToken()) return;
    try {
      const r = await api<{ user: any }>('/api/auth/me');
      setMe(r.user || null);
    } catch { /* offline */ }
    try {
      const c: any = await api('/api/collections/me');
      setCollections(c.collections || []);
    } catch { /* offline */ }
    try {
      const n: any = await api('/api/notifications');
      setNotifs((n.notifications || n.items || []).slice(0, 10));
    } catch { /* offline */ }
    try {
      const raw = await AsyncStorage.getItem('rally.myFavoriteHandle');
      const fav = raw ? JSON.parse(raw) : null;
      if (fav) {
        const b = await api<{ badges: Badge[]; level: { name: string } }>('/api/badges/' + fav);
        setBadges(b.badges || []);
        setLevelName(b.level && b.level.name ? b.level.name : null);
      }
    } catch { /* no badges yet */ }
    try {
      const p = await AsyncStorage.getItem('rally.profilePrefs');
      if (p) setShowCity(JSON.parse(p).showCity !== false);
    } catch { /* default */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function share() {
    if (!me) return;
    impact('light');
    try { await Share.share({ message: me.displayName + ' (@' + me.handle + ') on Rally' }); } catch { /* dismissed */ }
  }

  const earned = badges.filter((b) => b.earned);
  const city = me && me.countryCode ? me.countryCode : '';

  return (
    <SwipeBack>
      <Screen>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.center}>
            {me && me.avatarUrl ? (
              <LinearGradient colors={['#A855F7', '#EC4899'] as [string, string]} style={styles.avatar}>
                <Text style={styles.avatarText}>{initials(me.displayName)}</Text>
              </LinearGradient>
            ) : (
              <LinearGradient colors={['#A855F7', '#EC4899'] as [string, string]} style={styles.avatar}>
                <Text style={styles.avatarText}>{me ? initials(me.displayName) : '?'}</Text>
              </LinearGradient>
            )}
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 28, marginTop: 16 }}>
              {me ? me.displayName : 'Not signed in'}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 16, marginTop: 2 }}>
              {(me ? '@' + me.handle : '') + (showCity && city ? ' \u00b7 ' + city : '')}
            </Text>
            {levelName ? (
              <View style={[styles.levelChip, { backgroundColor: GOLD + '22' }]}>
                <Text style={{ color: GOLD, fontSize: 12, fontWeight: '900', letterSpacing: 0.8 }}>{levelName.toUpperCase() + ' SUPPORTER'}</Text>
              </View>
            ) : null}
            {me && me.bio ? (
              <Text style={{ color: colors.text, fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 12 }}>{me.bio}</Text>
            ) : null}
          </View>

          {/* Stats */}
          <View style={[styles.statsRow, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
            <View style={styles.stat}>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 22 }}>{String(earned.length)}</Text>
              <Text style={{ color: colors.muted, fontSize: 14 }}>Badges</Text>
            </View>
            <View style={styles.stat}>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 22 }}>{String(collections.length)}</Text>
              <Text style={{ color: colors.muted, fontSize: 14 }}>Collections</Text>
            </View>
            <View style={styles.stat}>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 22 }}>{me && me.favoriteProfile && me.favoriteProfile.isPublished ? String(Number(me.favoriteProfile.supporterCount || 0)) : '\u2014'}</Text>
              <Text style={{ color: colors.muted, fontSize: 14 }}>Supporters</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <Pressable onPress={() => { impact('light'); router.push('/edit-profile'); }} style={[styles.actionBtn, { backgroundColor: colors.surfaceElevated }]} accessibilityLabel="Edit profile">
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>Edit profile</Text>
            </Pressable>
            <Pressable onPress={share} style={[styles.actionBtn, { backgroundColor: colors.surfaceElevated }]} accessibilityLabel="Share">
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>Share</Text>
            </Pressable>
          </View>

          {/* Tabs */}
          <View style={[styles.tabBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {([
              ['badges', 'Badges'],
              ['collections', 'Collections'],
              ['activity', 'Activity'],
            ] as [typeof tab, string][]).map(([key, label]) => (
              <Pressable key={key} onPress={() => { impact('light'); setTab(key); }} style={[styles.tabBtn, tab === key && { backgroundColor: colors.bg, borderRadius: radii.md }]} accessibilityLabel={label}>
                <Text style={{ color: tab === key ? colors.text : colors.muted, fontWeight: '900', fontSize: 16 }}>{label}</Text>
              </Pressable>
            ))}
          </View>

          {tab === 'badges' ? (
            earned.length === 0 ? (
              <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: spacing.md, textAlign: 'center' }}>
                No badges yet. Support a Favorite and they appear here.
              </Text>
            ) : (
              <View style={styles.badgeGrid}>
                {earned.map((b, i) => {
                  const c = BADGE_COLORS[b.slug] || GRADS[i % GRADS.length][0];
                  return (
                    <View key={b.slug} style={styles.badgeTile}>
                      <View style={[styles.badgeIcon, { backgroundColor: c }]}>
                        <Ionicons name={(BADGE_ICONS[b.slug] || 'ribbon') as any} size={26} color="#fff" />
                      </View>
                      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15, marginTop: 10, textAlign: 'center' }}>{b.name}</Text>
                    </View>
                  );
                })}
              </View>
            )
          ) : null}

          {tab === 'collections' ? (
            collections.length === 0 ? (
              <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: spacing.md, textAlign: 'center' }}>
                No Collections yet. Start one from the Collections screen.
              </Text>
            ) : (
              <View style={styles.collGrid}>
                {collections.map((c, i) => (
                  <LinearGradient key={c.id} colors={GRADS[i % GRADS.length]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.collTile}>
                    <Text numberOfLines={2} style={{ color: '#fff', fontWeight: '900', fontSize: 16, marginTop: 'auto' }}>{c.title}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 3 }}>{(c.momentCount || 0) + ' Moments'}</Text>
                  </LinearGradient>
                ))}
              </View>
            )
          ) : null}

          {tab === 'activity' ? (
            notifs.length === 0 ? (
              <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: spacing.md, textAlign: 'center' }}>
                No recent activity yet.
              </Text>
            ) : (
              <View style={{ marginTop: spacing.md }}>
                {notifs.map((n) => (
                  <View key={n.id} style={{ paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }}>
                    <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>{n.title || 'Update'}</Text>
                    {n.body ? <Text style={{ color: colors.muted, fontSize: 14, marginTop: 2 }}>{n.body}</Text> : null}
                  </View>
                ))}
              </View>
            )
          ) : null}
        </ScrollView>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', paddingHorizontal: 20, paddingTop: spacing.md },
  avatar: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 40 },
  levelChip: { borderRadius: radii.full, paddingHorizontal: 12, paddingVertical: 5, marginTop: 10 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 16, marginTop: spacing.lg },
  stat: { alignItems: 'center', gap: 2 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: spacing.lg },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 15, borderRadius: radii.lg },
  tabBar: { flexDirection: 'row', borderWidth: 1, borderRadius: radii.lg, padding: 4, marginTop: spacing.lg },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: spacing.lg },
  badgeTile: { width: '30%', flexGrow: 1, alignItems: 'center' },
  badgeIcon: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  collGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: spacing.lg },
  collTile: { width: '47.5%', flexGrow: 1, height: 150, borderRadius: 16, padding: 12 },
});
