import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl, Animated,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import { colors, spacing, radii, useLayout } from '@/constants/theme';
import { shareFavorite } from '@/hooks/useShare';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { OfflineBanner } from '@/components/OfflineBanner';
import { PrimaryButton } from '@/components/PrimaryButton';
import { GiftBurst } from '@/components/GiftBurst';
import { LongPressMenu, MenuAction } from '@/components/LongPressMenu';
import { SwipeBack } from '@/components/SwipeBack';
import { SoundTextInput } from '@/components/SoundTextInput';

type CatalogItem = { id: string; slug: string; name: string; tokenCost: number };

export default function FavoriteScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const { width, isTablet, horizontalPad } = useLayout();
  const cols = isTablet ? 4 : width < 360 ? 2 : 3;
  const gap = 10;
  const giftW = (Math.min(width, isTablet ? 560 : width) - horizontalPad * 2 - gap * (cols - 1)) / cols;
  const { impact } = useHaptics();
  const { click, success, error } = useSounds();

  const [profile, setProfile] = useState<any>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');
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
      .catch((e) => setStatus(e.message));
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

  async function sendGift() {
    if (!selected) return;
    setSending(true);
    impact('medium');
    try {
      await api('/api/gifts/send', {
        method: 'POST',
        body: JSON.stringify({
          favoriteHandle: handle,
          catalogItemId: selected,
          message: message || undefined,
        }),
      });
      const item = catalog.find((c) => c.id === selected);
      setBurstEmoji(emojiFor(item?.slug || ''));
      setBurst(true);
      success();
      setStatus('Gift sent!');
      setMessage('');
      await load();
    } catch (e: any) {
      error();
      setStatus(e.message);
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
              Animated.timing(pulse, { toValue: 1.08, duration: 100, useNativeDriver: true }),
              Animated.spring(pulse, { toValue: 1, useNativeDriver: true }),
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
          onPress: async () => {
            setSelected(g.id);
            setSending(true);
            try {
              await api('/api/gifts/send', {
                method: 'POST',
                body: JSON.stringify({
                  favoriteHandle: handle,
                  catalogItemId: g.id,
                  isAnonymous: true,
                }),
              });
              setBurstEmoji(emojiFor(g.slug));
              setBurst(true);
              success();
              await load();
            } catch (e: any) {
              error();
              setStatus(e.message);
            } finally {
              setSending(false);
            }
          },
        },
      ],
    });
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!profile?.favorite) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.danger }}>{status || 'Not found'}</Text>
      </View>
    );
  }

  const fav = profile.favorite;

  return (
    <SwipeBack pullDown edgeSwipe>
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
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
              <Text style={styles.hint}>Pull down or swipe from left edge to go back</Text>
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{fav.displayName}</Text>
                  <Text style={styles.handle}>@{fav.handle}</Text>
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
                        { label: 'Share profile', onPress: () => shareFavorite(fav.handle, fav.displayName) },
                        { label: 'Copy link', onPress: () => shareFavorite(fav.handle, fav.displayName) },
                      ],
                    });
                  }}
                  delayLongPress={350}
                  style={styles.shareBtn}
                >
                  <Text style={styles.shareText}>Share</Text>
                </Pressable>
              </View>
              {fav.bio ? <Text style={styles.bio}>{fav.bio}</Text> : null}
              <Text style={styles.meta}>{fav.supporterCount} supporters</Text>

              <Text style={styles.section}>Send a Gift</Text>
              <Text style={styles.hint}>Tap to select · hold for options</Text>
              <Animated.View style={[styles.giftRow, { gap, transform: [{ scale: pulse }] }]}>
                {catalog.map((g) => (
                  <Pressable
                    key={g.id}
                    style={[styles.gift, { width: giftW }, selected === g.id && styles.giftSelected]}
                    onPress={() => {
                      click();
                      setSelected(g.id);
                    }}
                    onLongPress={() => openGiftOptions(g)}
                    delayLongPress={350}
                  >
                    <Text style={styles.giftEmoji}>{emojiFor(g.slug)}</Text>
                    <Text style={styles.giftName} numberOfLines={1}>{g.name}</Text>
                    <Text style={styles.giftCost}>{g.tokenCost}</Text>
                  </Pressable>
                ))}
              </Animated.View>

              <SoundTextInput
                style={styles.input}
                placeholder="Message (optional) · type ticks"
                placeholderTextColor={colors.muted}
                value={message}
                onChangeText={setMessage}
                maxLength={280}
              />

              <PrimaryButton
                label={sending ? 'Sending…' : 'Send Gift'}
                onPress={sendGift}
                disabled={!selected || sending}
                loading={sending}
              />
              {status ? <Text style={styles.status}>{status}</Text> : null}
              <Text style={[styles.section, { marginTop: 24 }]}>Supporter Wall</Text>
            </>
          }
          data={profile.supporterWall?.recent || []}
          keyExtractor={(_: any, i: number) => String(i)}
          renderItem={({ item }: any) => (
            <Pressable
              style={styles.wallItem}
              onLongPress={() => {
                setMenu({
                  title: `@${item.sender?.handle}`,
                  actions: [
                    { label: 'Report', destructive: true, onPress: () => setStatus('Report queued') },
                  ],
                });
              }}
              delayLongPress={400}
            >
              <Text style={styles.wallName}>@{item.sender?.handle}</Text>
              {item.message ? <Text style={styles.wallMsg}>{item.message}</Text> : null}
              <Text style={styles.wallCost}>{item.tokenCost} tok</Text>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.meta}>Be the first supporter</Text>}
        />
      </SafeAreaView>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  hint: { color: colors.muted, fontSize: 12, marginBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  name: { fontSize: 24, fontWeight: '700', color: colors.text },
  handle: { color: colors.muted, marginBottom: 8 },
  shareBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 40,
    justifyContent: 'center',
  },
  shareText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  bio: { color: colors.text, marginBottom: 4 },
  meta: { color: colors.muted, marginBottom: 16 },
  section: { fontSize: 18, fontWeight: '600', color: colors.primaryHover, marginBottom: 8 },
  giftRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  gift: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    alignItems: 'center',
    marginBottom: 4,
  },
  giftSelected: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  giftEmoji: { fontSize: 22, marginBottom: 4 },
  giftName: { color: colors.text, fontSize: 12, fontWeight: '600' },
  giftCost: { color: colors.muted, fontSize: 11 },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 12,
    color: colors.text,
    marginBottom: 12,
    minHeight: 48,
  },
  status: { color: colors.success, marginTop: 8 },
  wallItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  wallName: { color: colors.text, fontWeight: '600' },
  wallMsg: { color: colors.muted, marginTop: 2 },
  wallCost: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
