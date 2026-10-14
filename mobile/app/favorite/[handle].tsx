import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { api } from '@/lib/api';
import { colors, spacing, radii } from '@/constants/theme';

type CatalogItem = { id: string; slug: string; name: string; tokenCost: number };

export default function FavoriteScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const { width } = useWindowDimensions();
  const giftW = width < 360 ? (width - 48) / 2 : (width - 56) / 3;
  const [profile, setProfile] = useState<any>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    Promise.all([
      api<any>(`/api/favorites/${handle}`),
      api<{ items: CatalogItem[] }>('/api/gifts/catalog'),
    ])
      .then(([fav, cat]) => {
        setProfile(fav);
        setCatalog(cat.items);
      })
      .catch((e) => setStatus(e.message))
      .finally(() => setLoading(false));
  }, [handle]);

  async function sendGift() {
    if (!selected) return;
    setSending(true);
    try {
      await api('/api/gifts/send', {
        method: 'POST',
        body: JSON.stringify({
          favoriteHandle: handle,
          catalogItemId: selected,
          message: message || undefined,
        }),
      });
      setStatus('Gift sent!');
      setMessage('');
    } catch (e: any) {
      setStatus(e.message);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.danger }}>{status || 'Not found'}</Text>
      </View>
    );
  }

  const fav = profile.favorite;

  return (
    <FlatList
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <>
          <Text style={styles.name}>{fav.displayName}</Text>
          <Text style={styles.handle}>@{fav.handle}</Text>
          {fav.bio ? <Text style={styles.bio}>{fav.bio}</Text> : null}
          <Text style={styles.meta}>{fav.supporterCount} supporters</Text>

          <Text style={styles.section}>Send a Gift</Text>
          <View style={styles.giftRow}>
            {catalog.map((g) => (
              <Pressable
                key={g.id}
                style={[
                  styles.gift,
                  { width: giftW },
                  selected === g.id && styles.giftSelected,
                ]}
                onPress={() => setSelected(g.id)}
              >
                <Text style={styles.giftEmoji}>
                  {g.slug === 'heart' ? '❤️' : g.slug === 'clap' ? '👏' : g.slug === 'flame' ? '🔥' : '🎁'}
                </Text>
                <Text style={styles.giftName}>{g.name}</Text>
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

          <Pressable
            style={[styles.btn, (!selected || sending) && styles.btnDisabled]}
            onPress={sendGift}
            disabled={!selected || sending}
          >
            <Text style={styles.btnText}>{sending ? 'Sending…' : 'Send Gift'}</Text>
          </Pressable>
          {status ? <Text style={styles.status}>{status}</Text> : null}

          <Text style={[styles.section, { marginTop: 24 }]}>Supporter Wall</Text>
        </>
      }
      data={profile.supporterWall?.recent || []}
      keyExtractor={(_: any, i: number) => String(i)}
      renderItem={({ item }: any) => (
        <View style={styles.wallItem}>
          <Text style={styles.wallName}>@{item.sender.handle}</Text>
          {item.message ? <Text style={styles.wallMsg}>{item.message}</Text> : null}
          <Text style={styles.wallCost}>{item.tokenCost} tok</Text>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.meta}>Be the first supporter</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  name: { fontSize: 24, fontWeight: '700', color: colors.text },
  handle: { color: colors.muted, marginBottom: 8 },
  bio: { color: colors.text, marginBottom: 4 },
  meta: { color: colors.muted, marginBottom: 16 },
  section: { fontSize: 18, fontWeight: '600', color: colors.primaryHover, marginBottom: 12 },
  giftRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  gift: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    alignItems: 'center',
  },
  giftSelected: { borderColor: colors.primary },
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
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
    minHeight: 48,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#04101F', fontWeight: '700' },
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
