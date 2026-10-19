import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, TextInput } from 'react-native';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SwipeBack } from '@/components/SwipeBack';
import { api } from '@/lib/api';
import { colors, spacing, radii } from '@/constants/theme';

type Tier = { id: string; name: string; priceCents: number; currency: string; perks: string[] };
type Sub = { id: string; status: string; currentPeriodEnd: string; tier: Tier | null };

export default function Page() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [handle, setHandle] = useState('');
  const [msg, setMsg] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await api<{ subscriptions: Sub[] }>('/api/subscriptions/me');
      setSubs(r.subscriptions || []);
    } catch { /* offline */ } finally { setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function act(id: string, action: 'cancel' | 'pause') {
    try {
      await api(`/api/subscriptions/${id}/${action}`, { method: 'POST' });
      load();
    } catch (e: any) {
      setMsg(e.message || 'Action failed');
    }
  }

  return (
    <SwipeBack>
      <Screen refreshing={refreshing} onRefresh={load}>
        <Text style={styles.h1}>Fan Clubs</Text>
        <Text style={styles.muted}>Join a Favorite's monthly fan club. Cancel anytime — no dark patterns.</Text>
        {msg ? <Text style={styles.badge}>{msg}</Text> : null}
        <View style={styles.card}>
          <Text style={styles.name}>Tip</Text>
          <Text style={styles.muted}>
            Browse tiers from any Favorite's profile page, then join here or on the web.
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.name}>My subscriptions</Text>
          {subs.map((s) => (
            <View key={s.id} style={{ marginBottom: 12 }}>
              <Text style={styles.badge}>
                {s.tier?.name ?? 'Tier'} · {s.status} · renews {new Date(s.currentPeriodEnd).toLocaleDateString()}
              </Text>
              <View style={styles.row}>
                <PrimaryButton label={s.status === 'paused' ? 'Resume' : 'Pause'} onPress={() => act(s.id, 'pause')} />
                <PrimaryButton label="Cancel" onPress={() => act(s.id, 'cancel')} />
              </View>
            </View>
          ))}
          {subs.length === 0 && <Text style={styles.muted}>No memberships yet.</Text>}
        </View>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: spacing.sm, marginBottom: 8 },
  muted: { color: colors.muted, marginBottom: 12, fontSize: 14 },
  name: { color: colors.text, fontWeight: '700', fontSize: 16, marginBottom: 4 },
  badge: { color: colors.primaryHover, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: 10,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    color: colors.text,
    padding: 12,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
});
