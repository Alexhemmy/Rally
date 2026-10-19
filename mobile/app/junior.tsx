import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, TextInput } from 'react-native';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SwipeBack } from '@/components/SwipeBack';
import { api, getToken } from '@/lib/api';
import { colors, spacing, radii } from '@/constants/theme';

type Application = { id: string; status: string; guardianName: string; note: string | null };

export default function JuniorScreen() {
  const [app, setApp] = useState<Application | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!getToken()) return;
    setRefreshing(true);
    try {
      const r = await api<{ application: Application | null }>('/api/junior/me');
      setApp(r.application || null);
    } catch { /* ignore */ } finally { setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function apply() {
    setError(''); setMsg('');
    try {
      const r = await api<{ devConsentCode?: string }>('/api/junior/apply', {
        method: 'POST',
        body: JSON.stringify({ guardianName: name, guardianPhone: phone }),
      });
      setMsg('Application submitted. Guardian consent is next.');
      if (r.devConsentCode) setMsg('Dev consent code: ' + r.devConsentCode);
      load();
    } catch (e: any) { setError(e.message); }
  }

  async function verify() {
    if (!app) return;
    setError(''); setMsg('');
    try {
      await api('/api/junior/' + app.id + '/verify', { method: 'POST', body: JSON.stringify({ code }) });
      setMsg('Guardian consent verified!');
      setCode('');
      load();
    } catch (e: any) { setError(e.message); }
  }

  return (
    <SwipeBack>
      <Screen refreshing={refreshing} onRefresh={load}>
        <Text style={styles.h1}>Junior Favorite program</Text>
        <Text style={styles.muted}>
          16–17 year-olds become Junior Favorites with guardian consent (UPG-7). No payouts, no giveaways, no cash prizes.
        </Text>
        {!!msg && <Text style={styles.ok}>{msg}</Text>}
        {!!error && <Text style={styles.err}>{error}</Text>}
        {app ? (
          <View style={styles.card}>
            <Text style={styles.name}>Status: {app.status}</Text>
            <Text style={styles.muted}>Guardian: {app.guardianName}</Text>
            {!!app.note && <Text style={styles.muted}>Note: {app.note}</Text>}
            {app.status === 'pending' && (
              <View style={{ marginTop: 10 }}>
                <TextInput
                  style={styles.input}
                  placeholder="6-digit consent code"
                  placeholderTextColor={colors.muted}
                  maxLength={6}
                  value={code}
                  onChangeText={setCode}
                />
                <PrimaryButton label="Verify guardian consent" onPress={verify} />
              </View>
            )}
          </View>
        ) : (
          <View style={styles.card}>
            <TextInput
              style={styles.input}
              placeholder="Guardian full name"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Guardian phone"
              placeholderTextColor={colors.muted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
            <PrimaryButton label="Submit application" onPress={apply} />
          </View>
        )}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: spacing.sm, marginBottom: 8 },
  muted: { color: colors.muted, marginBottom: 12, fontSize: 14 },
  name: { color: colors.text, fontWeight: '700', fontSize: 16, marginBottom: 4 },
  ok: { color: '#16a34a', marginBottom: 8 },
  err: { color: colors.danger, marginBottom: 8 },
  card: {
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1,
    borderColor: colors.border, padding: spacing.md, marginBottom: 10,
  },
  input: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.sm, color: colors.text, padding: 12, marginBottom: 10,
  },
});
