/** Favorite Profile
 * View a Favorite, send Gifts, and see the Supporter Wall.
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
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, radii, type as typo, useLayout } from '@/constants/theme';
import { shareFavorite } from '@/hooks/useShare';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { OfflineBanner } from '@/components/OfflineBanner';
import { GradientButton, Avatar, GlassCard, SectionHeader, EmptyState } from '@/components/ui';
import { GiftBurst } from '@/components/GiftBurst';
import { LongPressMenu, MenuAction } from '@/components/LongPressMenu';
import { SwipeBack } from '@/components/SwipeBack';
import { SoundTextInput } from '@/components/SoundTextInput';

type CatalogItem = {
  id: string;
  slug: string;
  name: string;
  tokenCost: number;
};

export default function FavoriteScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const { colors } = useTheme();
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
  const [burstEmoji, setBurstEmoji] = useState('🎁');
  const [menu, setMenu] = useState<{ title: string; actions: MenuAction[] } | null>(null);
  const pulse = useState(() => new Animated.Value(1))[0];

  const load = useCallback(() => {
    return Promise.all([
      api<any>(`/api/favorites/${handle}`),
      api<{ items: CatalogItem[] }>('/api/gifts/catalog'),
    ])
      .then(([fav, cat]) => {
        setProfile(fav);
        setCatalog(cat.items || []);
      })
      .catch((e) => setStatus({ type: 'error', text: e.message }));
  }, [handle]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  function emojiFor(slug: string) {
    if (slug === 'heart') return '❤️';
    if (slug === 'clap') return '👏';
    if (slug === 'flame') return '🔥';
    return '🎁';
  }

  async function sendGift(options?: { anonymous?: boolean }) {
    if (!selected) return;
    setSending(true);
    setStatus(null);
    impact('medium');

    try {
      await api('/api/gifts/send', {
        method: 'POST',
        body: JSON.stringify({
          favoriteHandle: handle,
          catalogItemId: selected,
          message: message || undefined,
          isAnonymous: options?.anonymous || false,
        }),
      });

      const item = catalog.find((c) => c.id === selected);
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
          label: `Select · ${g.tokenCost} tokens`,
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
        <ActivityIndicator color={colors.primary} size="large" />
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
            padding: horizontalPad,
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
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListHeaderComponent={
            <>
              <Text style={[styles.hint, { color: colors.muted }]}>
                Pull down or swipe from left edge to go back
              </Text>

              {/* Profile header */}
              <View style={styles.headerRow}>
                <Avatar name={fav.displayName} size={64} ring />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={[styles.name, { color: colors.text }]}>
                    {fav.displayName}
                  </Text>
                  <Text style={[styles.handle, { color: colors.muted }]}>
                    @{fav.handle}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 13 }}>
                    {fav.supporterCount} supporters
                  </Text>
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
                  style={[
                    styles.shareBtn,
                    { borderColor: colors.primary },
                  ]}
                >
                  <Text style={[styles.shareText, { color: colors.primary }]}>
                    Share
                  </Text>
                </Pressable>
              </View>

              {fav.bio ? (
                <Text style={[styles.bio, { color: colors.text }]}>{fav.bio}</Text>
              ) : null}

              {/* Gift section */}
              <SectionHeader title="Send a Gift" style={{ marginTop: spacing.lg }} />
              <Text style={[styles.hint, { color: colors.muted, marginBottom: 10 }]}>
                Tap to select · hold for more options
              </Text>

              <Animated.View
                style={[
                  styles.giftRow,
                  { gap, transform: [{ scale: pulse }] },
                ]}
              >
                {catalog.map((g) => (
                  <Pressable
                    key={g.id}
                    onPress={() => {
                      click();
                      setSelected(g.id);
                    }}
                    onLongPress={() => openGiftOptions(g)}
                    delayLongPress={350}
                    style={[
                      styles.gift,
                      {
                        width: giftW,
                        backgroundColor:
                          selected === g.id ? colors.primaryMuted : colors.surface,
                        borderColor:
                          selected === g.id ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={styles.giftEmoji}>{emojiFor(g.slug)}</Text>
                    <Text
                      style={[styles.giftName, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {g.name}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 11 }}>
                      {g.tokenCost} tok
                    </Text>
                  </Pressable>
                ))}
              </Animated.View>

              <SoundTextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Optional message"
                placeholderTextColor={colors.muted}
                value={message}
                onChangeText={setMessage}
                maxLength={280}
              />

              <GradientButton
                label={sending ? 'Sending…' : 'Send Gift'}
                onPress={() => sendGift()}
                disabled={!selected || sending}
                loading={sending}
                fullWidth
              />

              {status && (
                <Text
                  style={{
                    marginTop: 10,
                    color: status.type === 'success' ? colors.success : colors.danger,
                    fontWeight: '600',
                    fontSize: 13,
                  }}
                >
                  {status.text}
                </Text>
              )}

              <SectionHeader title="Supporter Wall" style={{ marginTop: 28 }} />
            </>
          }
          data={profile.supporterWall?.recent || []}
          keyExtractor={(_: any, i: number) => String(i)}
          renderItem={({ item }: any) => (
            <Pressable
              onLongPress={() => {
                setMenu({
                  title: `@${item.sender?.handle}`,
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
                { borderBottomColor: colors.border },
              ]}
            >
              <Text style={[styles.wallName, { color: colors.text }]}>
                @{item.sender?.handle}
              </Text>
              {item.message ? (
                <Text style={[styles.wallMsg, { color: colors.muted }]}>
                  {item.message}
                </Text>
              ) : null}
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                {item.tokenCost} tok
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={{ color: colors.muted, marginTop: 8 }}>
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
  hint: {
    fontSize: 12,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    ...typo.h1,
    marginBottom: 2,
  },
  handle: {
    fontSize: 14,
    marginBottom: 2,
  },
  shareBtn: {
    borderWidth: 1.5,
    borderRadius: radii.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 40,
    justifyContent: 'center',
  },
  shareText: {
    fontWeight: '700',
    fontSize: 13,
  },
  bio: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
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
  wallName: {
    fontWeight: '600',
    fontSize: 15,
  },
  wallMsg: {
    marginTop: 2,
    fontSize: 14,
  },
});
