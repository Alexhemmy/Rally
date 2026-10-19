import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, TextInput } from 'react-native';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SwipeBack } from '@/components/SwipeBack';
import { api } from '@/lib/api';
import { colors, spacing, radii } from '@/constants/theme';

type Progress = {
  signals: Record<string, boolean>;
  passed: number;
  total: number;
  eligible: boolean;
};

const LABELS: Record<string, string> = {
  accountAge30Days: 'Account 30+ days old',
  verifiedAdult: 'Verified + 18+',
  tenPublished: '10+ published works',
  hundredFollowers: '100+ followers',
  fiftyEngagers: '50+ engagers in 60d',
  noStrikes: 'No moderation strikes',
};

export default function Page() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [pitch, setPitch] = useState('');
  const [samples, setSamples] = useState('');
  const [msg, setMsg] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const p = await api<Progress>('/api/upgrades/progress');
      setProgress(p);
    } catch { /* offline */ } finally { setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function apply() {
    setMsg('');
    try {
      await api('/api/upgrades/request', {
        method: 'POST',
        body: JSON.stringify({
          pitch,
          samples: samples.split(/[\n,]/).map((s) => s.trim()).filter(Boolean),
        }),
      });
      setMsg('Application submitted!');
      setPitch(''); setSamples('');
    } catch (e: any) {
      setMsg(e.message || 'Submit failed');
    }
  }

  return (
    <SwipeBack>
      <Screen refreshing={refreshing} onRefresh={load}>
        <Text style={styles.h1}>Become a Favorite</Text>
        <Text style={styles.muted}>
          Upgrade by community standing — money never counts.
        </Text>
        {msg ? <Text style={styles.badge}>{msg}</Text> : null}
        {progress ? (
          <View style={styles.card}>
            <Text style={styles.name}>Progress · {progress.passed}/{progress.total}</Text>
            {Object.entries(progress.signals).map(([k, ok]) => (
              <Text key={k} style={styles.muted}>
                {ok ? '✅' : '⬜'} {LABELS[k] ?? k}
              </Text>
            ))}
          </View>
        ) : (
          <Text style={styles.muted}>Log in to check your progress.</Text>
        )}
        {progress?.eligible ? (
          <View style={styles.card}>
            <TextInput
              style={styles.input}
              placeholder="Your pitch (50+ chars)"
              placeholderTextColor={colors.muted}
              multiline
              value={pitch}
              onChangeText={setPitch}
            />
            <TextInput
              style={styles.input}
              placeholder="Sample URLs (comma separated)"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              value={samples}
              onChangeText={setSamples}
            />
            <PrimaryButton label="Submit application" onPress={apply} />
          </View>
        ) : null}
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
