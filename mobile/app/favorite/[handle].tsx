import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import { colors, spacing, radii, useLayout } from '@/constants/theme';
import { shareFavorite } from '@/hooks/useShare';
import { useHaptics } from '@/hooks/useHaptics';
import { OfflineBanner } from '@/components/OfflineBanner';
import { PrimaryButton } from '@/components/PrimaryButton';

type CatalogItem = { id: string; slug: string; name: string; tokenCost: number };

export default function FavoriteScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const { width, isTablet, horizontalPad } = useLayout();
  const cols = isTablet ? 4 : width < 360 ? 2 : 3;
  const gap = 10;
  const giftW = (Math.min(width, isTablet ? 560 : width) - horizontalPad * 2 - gap * (cols - 1)) / cols;
  const { impact } = useHaptics();

  const [profile, setProfile] = useState<any>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');
  const [refreshing, setRefreshing] = useState(false);

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
      impact('success');
      setStatus('Gift sent!');
      setMessage('');
      await load();
    } catch (e: any) {
      impact('error');
      setStatus(e.message);
    } finally {
      setSending(false);
    }
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
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <OfflineBanner />
      <FlatList
        contentContainerStyle={{ padding: horizontalPad, paddingBottom: 48, maxWidth: isTablet ? 560 : undefined, alignSelf: isTablet ? 'center' : undefined, width: '100%' }}
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
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{fav.displayName}</Text>
                <Text style={styles.handle}>@{fav.handle}</Text>
              </View>
              <Pressable
                onPress={() => {
                  impact('light');
                  shareFavorite(fav.handle, fav.displayName);
                }}
                style={styles.shareBtn}
                accessibilityLabel="Share profile"
              >
                <Text style={styles.shareText}>Share</Text>
              </Pressable>
            </View>
            {fav.bio ? <Text style={styles.bio}>{fav.bio}</Text> : null}
            <Text style={styles.meta}>{fav.supporterCount} supporters</Text>

            <Text style={styles.section}>Send a Gift</Text>
            <View style={[styles.giftRow, { gap }]}>
              {catalog.map((g) => (
                <Pressable
                  key={g.id}
                  style={[
                    styles.gift,
                    { width: giftW },
                    selected === g.id && styles.giftSelected,
                  ]}
                  onPress={() => {
                    impact('light');
                    setSelected(g.id);
                  }}
                >
                  <Text style={styles.giftEmoji}>
                    {g.slug === 'heart' ? '❤️' : g.slug === 'clap' ? '👏' : g.slug === 'flame' ? '🔥' : '🎁'}
                  </Text>
                  <Text style={styles.giftName} numberOfLines={1}>{g.name}</Text>
                  <Text style={styles.giftCost}>{g.tokenCost}</Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Message (optional)"
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
          <View style={styles.wallItem}>
            <Text style={styles.wallName}>@{item.sender?.handle}</Text>
            {item.message ? <Text style={styles.wallMsg}>{item.message}</Text> : null}
            <Text style={styles.wallCost}>{item.tokenCost} tok</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.meta}>Be the first supporter</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
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
  section: { fontSize: 18, fontWeight: '600', color: colors.primaryHover, marginBottom: 12 },
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
  wallItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  wallName: { color: colors.text, fontWeight: '600' },
  wallMsg: { color: colors.muted, marginTop: 2 },
  wallCost: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
