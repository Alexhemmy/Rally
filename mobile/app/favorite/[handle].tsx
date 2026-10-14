import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { api } from '@/lib/api';

type CatalogItem = { id: string; slug: string; name: string; tokenCost: number };

export default function FavoriteScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
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
      // Token would come from secure storage in production
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
        <ActivityIndicator color="#a78bfa" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{status || 'Not found'}</Text>
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
                style={[styles.gift, selected === g.id && styles.giftSelected]}
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
            placeholderTextColor="#71717a"
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
  container: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 24, fontWeight: '700', color: '#f4f4f5' },
  handle: { color: '#a1a1aa', marginBottom: 8 },
  bio: { color: '#d4d4d8', marginBottom: 4 },
  meta: { color: '#71717a', marginBottom: 16 },
  section: { fontSize: 18, fontWeight: '600', color: '#f4f4f5', marginBottom: 12 },
  giftRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  gift: {
    width: 90,
    backgroundColor: '#16161d',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 10,
    alignItems: 'center',
  },
  giftSelected: { borderColor: '#a78bfa' },
  giftEmoji: { fontSize: 22, marginBottom: 4 },
  giftName: { color: '#f4f4f5', fontSize: 12, fontWeight: '600' },
  giftCost: { color: '#a1a1aa', fontSize: 11 },
  input: {
    backgroundColor: '#16161d',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    padding: 12,
    color: '#f4f4f5',
    marginBottom: 12,
  },
  btn: {
    backgroundColor: '#a78bfa',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#000', fontWeight: '600' },
  status: { color: '#34d399', marginTop: 8 },
  error: { color: '#f87171' },
  wallItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  wallName: { color: '#f4f4f5', fontWeight: '600' },
  wallMsg: { color: '#a1a1aa', marginTop: 2 },
  wallCost: { color: '#71717a', fontSize: 12, marginTop: 2 },
});
