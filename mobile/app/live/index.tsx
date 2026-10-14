import { useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { api, getToken } from '@/lib/api';
import { colors, spacing, radii } from '@/constants/theme';
import { SwipeBack } from '@/components/SwipeBack';

export default function LiveScreen() {
  const [room, setRoom] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function startRoom() {
    const token = getToken();
    if (!token) { setError('Log in as a Favorite to host'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api<{ room: any }>('/api/providers/live/rooms', { method: 'POST', token });
      setRoom(res.room);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SwipeBack>
      <Screen>
        <Text style={styles.h1}>Live sessions</Text>
        <Text style={styles.muted}>LiveKit / Agora · live gifting</Text>
        <View style={styles.card}>
          <PrimaryButton label={loading ? 'Creating…' : 'Create live room'} onPress={startRoom} loading={loading} />
          {!!error && <Text style={styles.err}>{error}</Text>}
          {room && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.muted}>Provider: {room.provider}</Text>
              <Text style={styles.muted}>Room: {room.roomName}</Text>
            </View>
          )}
        </View>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  muted: { color: colors.muted, marginBottom: 8, fontSize: 14 },
  err: { color: colors.danger, marginTop: 8 },
  card: {
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1,
    borderColor: colors.border, padding: spacing.md, marginTop: 8,
  },
});
