/** Favorite Profile - Rally design
 * Gradient banner header, stats row, gold Send a Gift + Follow
 * + bell actions, gift tray, and Supporter Wall.
 */
import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api, getToken } from '@/lib/api';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, radii, type as typo, useLayout } from '@/constants/theme';
import { shareFavorite } from '@/hooks/useShare';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { OfflineBanner } from '@/components/OfflineBanner';
import { GradientButton, Avatar } from '@/components/ui';
import { GiftBurst } from '@/components/GiftBurst';
import { GiftTraySheet } from '@/components/GiftTraySheet';
import { LongPressMenu, MenuAction } from '@/components/LongPressMenu';
import { SwipeBack } from '@/components/SwipeBack';
import { SoundTextInput } from '@/components/SoundTextInput';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const PURPLE = '#7B1FA2';

type CatalogItem = {
  id: string;
  slug: string;
  name: string;
  tokenCost: number;
};

export default function FavoriteScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const { width, isTablet, horizontalPad } = useLayout();
  const cols = isTablet ? 4 : width < 360 ? 2 : 3;
  const gap = 10;
  const giftW =
    (Math.min(width, isTablet ? 560 : width) - horizontalPad * 2 - gap * (cols - 1)) / cols;

  const { impact } = useHaptics();
  const { click, success, error } = useSounds();

  const [profile, setProfile] = useState<any>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [burst, setBurst] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [burstEmoji, setBurstEmoji] = useState('\uD83C\uDF81');
  const [menu, setMenu] = useState<{ title: string; actions: MenuAction[] } | null>(null);
  const [following, setFollowing] = useState<boolean | null>(null);
  const [followBusy, setFollowBusy] = useState(false);
  const pulse = useState(() => new Animated.Value(1))[0];

  const load = useCallback(() => {
    return Promise.all([
      api<any>('/api/favorites/' + handle),
      api<{ items: CatalogItem[] }>('/api/gifts/catalog'),
    ])
      .then(([fav, cat]) => {
        setProfile(fav);
        setCatalog(cat.items || []);
        if (following === null) setFollowing(!!fav?.favorite?.isFollowing);
      })
      .catch((e) => setStatus({ type: 'error', text: e.message }));
  }, [handle, following]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  function emojiFor(slug: string) {
    if (slug === 'heart') return '\u2764\uFE0F';
    if (slug === 'clap') return '\uD83D\uDC4F';
    if (slug === 'flame') return '\uD83D\uDD25';
    return '\uD83C\uDf81';
  }

  async function toggleFollow() {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    setFollowBusy(true);
    impact('light');
    try {
      if (following) {
        await api('/api/users/' + handle + '/follow', { method: 'DELETE', body: '{}' });
        setFollowing(false);
      } else {
        await api('/api/users/' + handle + '/follow', { method: 'POST', body: '{}' });
        setFollowing(true);
        success();
      }
    } catch (e: any) {
      setStatus({ type: 'error', text: e.message || 'Follow failed' });
    } finally {
      setFollowBusy(false);
    }
  }

  async function sendGiftFromSheet(giftId: string, msg: string, anon: boolean, qty: number) {
    setSelected(giftId);
    setMessage(msg);
    await sendGift({ anonymous: anon, giftId: giftId, quantity: qty });
  }

  async function sendGift(options?: { anonymous?: boolean; giftId?: string; quantity?: number }) {
    const gid = options?.giftId || selected;
    if (!gid) return;
    setSending(true);
    setStatus(null);
    impact('medium');

    try {
      await api('/api/gifts/send', {
        method: 'POST',
        body: JSON.stringify({
          favoriteHandle: handle,
          catalogItemId: gid,
          message: message || undefined,
          isAnonymous: options?.anonymous || false,
          quantity: options?.quantity || 1,
        }),
      });

      const item = catalog.find((c) => c.id === gid);
      setBurstEmoji(emojiFor(item?.slug || ''));
      setBurst(true);
      success();
      impact('success');
      setStatus({ type: 'success', text: 'Gift sent!' });
      setMessage('');
      await load();
    } catch (e: any) {
      error();
      setStatus({ type: 'error', text: e.message || 'Gift failed' });
    } finally {
      setSending(false);
    }
  }

  function openGiftOptions(g: CatalogItem) {
    impact('medium');
    setMenu({
      title: g.name,
      actions: [
        {
          label: 'Select \u00b7 ' + g.tokenCost + ' tokens',
          onPress: () => {
            setSelected(g.id);
            click();
            Animated.sequence([
              Animated.timing(pulse, {
                toValue: 1.08,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.spring(pulse, {
                toValue: 1,
                useNativeDriver: true,
              }),
            ]).start();
          },
        },
        {
          label: 'Send now',
          onPress: () => {
            setSelected(g.id);
            setTimeout(() => sendGift(), 50);
          },
        },
        {
          label: 'Send anonymously',
          onPress: () => {
            setSelected(g.id);
            setTimeout(() => sendGift({ anonymous: true }), 50);
          },
        },
      ],
    });
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={GOLD} size="large" />
      </View>
    );
  }

  if (!profile?.favorite) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.danger, fontWeight: '600' }}>
          {status?.text || 'Favorite not found'}
        </Text>
      </View>
    );
  }

  const fav = profile.favorite;
  const tags: string[] = Array.isArray(fav.specialties) ? fav.specialties : [];

  return (
    <SwipeBack pullDown edgeSwipe>
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.bg }]}
        edges={['left', 'right', 'bottom']}
      >
        <OfflineBanner />
        <GiftBurst visible={burst} emoji={burstEmoji} onDone={() => setBurst(false)} />
        <LongPressMenu
          visible={!!menu}
          title={menu?.title}
          actions={menu?.actions || []}
          onClose={() => setMenu(null)}
        />

        <FlatList
          contentContainerStyle={{
            paddingBottom: 48,
            maxWidth: isTablet ? 560 : undefined,
            alignSelf: isTablet ? 'center' : undefined,
            width: '100%',
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                impact('selection');
                await load();
                setRefreshing(false);
                impact('light');
              }}
              tintColor={GOLD}
              colors={[GOLD]}
            />
          }
          ListHeaderComponent={
            <>
              {/* Gradient banner + identity */}
              <View>
                <LinearGradient
                  colors={[GOLD, PURPLE] as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.banner}
                />
                <View style={[styles.identity, { paddingHorizontal: horizontalPad }]}>
                  <View style={styles.avatarWrap}>
                    <LinearGradient
                      colors={[GOLD, GOLD_DEEP] as [string, string]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.avatarRing}
                    >
                      <View style={[styles.avatarInner, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.avatarInitials, { color: GOLD }]}>
                          {(fav.displayName || fav.handle || '?').slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                    </LinearGradient>
                  </View>

                  <View style={styles.nameRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.name, { color: colors.text }]}>
                        {fav.displayName}
                      </Text>
                      <Text style={[styles.handle, { color: colors.muted }]}>
                        @{fav.handle}
                      </Text>
                      {fav.location ? (
                        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
                          {fav.location}
                        </Text>
                      ) : null}
                    </View>
                    <Pressable
                      onPress={() => {
                        click();
                        shareFavorite(fav.handle, fav.displayName);
                      }}
                      onLongPress={() => {
                        setMenu({
                          title: 'Share options',
                          actions: [
                            {
                              label: 'Share profile',
                              onPress: () => shareFavorite(fav.handle, fav.displayName),
                            },
                            {
                              label: 'Copy link',
                              onPress: () => shareFavorite(fav.handle, fav.displayName),
                            },
                          ],
                        });
                      }}
                      delayLongPress={350}
                      style={[styles.iconBtn, { borderColor: colors.border }]}
                      accessibilityLabel="Share profile"
                    >
                      <Ionicons name="share-social-outline" size={18} color={colors.text} />
                    </Pressable>
                  </View>

                  {tags.length > 0 && (
                    <View style={styles.tagRow}>
                      {tags.slice(0, 4).map((tg) => (
                        <View key={tg} style={[styles.tag, { borderColor: colors.border }]}>
                          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700' }}>
                            {tg}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {fav.bio ? (
                    <Text style={[styles.bio, { color: colors.text }]}>{fav.bio}</Text>
                  ) : null}
                </View>
              </View>

              {/* Stats row */}
              <View style={[styles.statsRow, { paddingHorizontal: horizontalPad }]}>
                <View style={[styles.stat, { borderColor: colors.border }]}>
                  <Text style={[styles.statNum, { color: colors.text }]}>{fav.supporterCount ?? 0}</Text>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>Supporters</Text>
                </View>
                <View style={[styles.stat, { borderColor: colors.border }]}>
                  <Text style={[styles.statNum, { color: colors.text }]}>{fav.momentCount ?? '\u2014'}</Text>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>Moments</Text>
                </View>
                <View style={[styles.stat, { borderColor: colors.border }]}>
                  <Text style={[styles.statNum, { color: GOLD }]}>{fav.rankLabel ?? '\u2014'}</Text>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>Rank</Text>
                </View>
              </View>

              {/* Actions: Send a Gift / Follow / bell */}
              <View style={[styles.actionRow, { paddingHorizontal: horizontalPad }]}>
                <Pressable
                  style={({ pressed }) => [styles.giftBtn, pressed && { opacity: 0.8 }]}
                  onPress={() => {
                    impact('light');
                    click();
                    setSheetOpen(true);
                  }}
                  accessibilityLabel="Send a Gift"
                >
                  <LinearGradient
                    colors={[GOLD, GOLD_DEEP] as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.giftGradient}
                  >
                    <Ionicons name="gift" size={17} color="#fff" />
                    <Text style={styles.giftBtnText}>Send a Gift</Text>
                  </LinearGradient>
                </Pressable>
                <Pressable
                  onPress={toggleFollow}
                  disabled={followBusy}
                  style={[styles.followBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                  accessibilityLabel={following ? 'Following' : 'Follow'}
                >
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>
                    {followBusy ? '\u2026' : following ? 'Following' : 'Follow'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    impact('light');
                    setStatus({ type: 'success', text: 'Post notifications are coming soon.' });
                  }}
                  style={[styles.iconBtn, { borderColor: colors.border }]}
                  accessibilityLabel="Notifications"
                >
                  <Ionicons name="notifications-outline" size={18} color={colors.text} />
                </Pressable>
              </View>

              {/* Gift Tray bottom sheet */}
              <GiftTraySheet
                visible={sheetOpen}
                onClose={() => setSheetOpen(false)}
                name={fav.displayName || fav.handle}
                sending={sending}
                onSend={(giftId, msg, anon, qty) => {
                  setSheetOpen(false);
                  sendGiftFromSheet(giftId, msg, anon, qty);
                }}
              />

              {status ? (
                <Text
                  style={{
                    marginTop: 10,
                    color: status.type === 'success' ? colors.success : colors.danger,
                    fontWeight: '600',
                    fontSize: 13,
                    paddingHorizontal: horizontalPad,
                  }}
                >
                  {status.text}
                </Text>
              ) : null}

              <Text style={[styles.sectionLabel, { color: colors.muted, marginTop: 24, paddingHorizontal: horizontalPad }]}>
                SUPPORTER WALL
              </Text>
            </>
          }
          data={profile.supporterWall?.recent || []}
          keyExtractor={(_: any, i: number) => String(i)}
          renderItem={({ item }: any) => (
            <Pressable
              onLongPress={() => {
                setMenu({
                  title: '@' + item.sender?.handle,
                  actions: [
                    {
                      label: 'Report',
                      destructive: true,
                      onPress: () =>
                        setStatus({ type: 'success', text: 'Report queued' }),
                    },
                  ],
                });
              }}
              delayLongPress={400}
              style={[
                styles.wallItem,
                { borderBottomColor: colors.border, paddingHorizontal: horizontalPad },
              ]}
            >
              <View style={styles.wallTop}>
                <Avatar name={item.sender?.handle || 'fan'} size={32} ring uri={item.sender?.avatarUrl || undefined} />
                <Text style={[styles.wallName, { color: colors.text }]}>
                  @{item.sender?.handle}
                </Text>
                <View style={{ flex: 1 }} />
                <Text style={{ color: GOLD, fontWeight: '800', fontSize: 12 }}>
                  {item.tokenCost} tok
                </Text>
              </View>
              {item.message ? (
                <Text style={[styles.wallMsg, { color: colors.muted }]}>
                  {item.message}
                </Text>
              ) : null}
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={{ color: colors.muted, marginTop: 8, paddingHorizontal: horizontalPad }}>
              Be the first supporter
            </Text>
          }
        />
      </SafeAreaView>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  banner: {
    height: 120,
  },
  identity: {
    marginTop: -44,
  },
  avatarWrap: {
    marginBottom: 12,
  },
  avatarRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontWeight: '900',
    fontSize: 22,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  name: {
    ...typo.h1,
    marginBottom: 2,
  },
  handle: {
    fontSize: 14,
    marginBottom: 2,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  tag: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  bio: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  stat: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 17,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    marginBottom: 20,
    alignItems: 'center',
  },
  giftBtn: {
    flex: 1,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  giftGradient: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
  },
  giftBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  followBtn: {
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: 18,
    paddingVertical: 12,
    minHeight: 46,
    justifyContent: 'center',
  },
  iconBtn: {
    width: 46,
    height: 46,
    borderWidth: 1,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
  },
  giftRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  gift: {
    borderRadius: radii.md,
    borderWidth: 1.5,
    padding: 10,
    alignItems: 'center',
    marginBottom: 4,
  },
  giftEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  giftName: {
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
    minHeight: 48,
  },
  wallItem: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  wallTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wallName: {
    fontWeight: '600',
    fontSize: 14,
  },
  wallMsg: {
    marginTop: 4,
    fontSize: 14,
    marginLeft: 42,
  },
});
