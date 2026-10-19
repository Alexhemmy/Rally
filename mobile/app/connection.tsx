import { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/components/ThemeProvider';
import { PrimaryButton } from '@/components/PrimaryButton';
import { getApiUrl, setApiUrl, hasBakedUrl } from '@/lib/config';
import { useNetwork } from '@/hooks/useNetwork';

/**
 * Connection settings — lets the app talk to a Rally server even when the
 * build had no EXPO_PUBLIC_API_URL baked in (the cause of the old
 * "you're offline" banner on real devices).
 */
export default function ConnectionScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { recheck } = useNetwork();
  const [url, setUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    getApiUrl().then(setUrl);
  }, []);

  const test = async (candidate?: string) => {
    const target = (candidate ?? url).trim().replace(/\/$/, '');
    if (!target) {
      setStatus({ ok: false, msg: 'Enter a server URL first, e.g. https://api.yourdomain.com' });
      return;
    }
    setTesting(true);
    setStatus(null);
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(target + '/health', { signal: ctrl.signal });
      clearTimeout(t);
      if (res.ok) setStatus({ ok: true, msg: 'Connected — server is healthy.' });
      else setStatus({ ok: false, msg: 'Server responded with error ' + res.status + '.' });
    } catch {
      clearTimeout;
      setStatus({ ok: false, msg: 'Could not reach that server. Check the URL and your network.' });
    } finally {
      setTesting(false);
    }
  };

  const save = async () => {
    await setApiUrl(url);
    await recheck();
    setStatus({ ok: true, msg: 'Saved. The app will use this server.' });
  };

  return (
    <KeyboardAvoidingView style={[styles.wrap, { backgroundColor: colors.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={[styles.h1, { color: colors.text }]}>Server connection</Text>
      <Text style={[styles.p, { color: colors.muted }]}>
        {hasBakedUrl()
          ? 'This build already has a server configured. You can override it below if you run your own backend.'
          : 'This build has no baked-in server. Enter the address of your Rally backend so the app can connect.'}
      </Text>

      <Text style={[styles.label, { color: colors.text }]}>Server URL</Text>
      <TextInput
        value={url}
        onChangeText={setUrl}
        placeholder="https://api.yourdomain.com"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
      />

      <View style={styles.row}>
        <View style={styles.grow}>
          <PrimaryButton label={testing ? 'Testing…' : 'Test connection'} onPress={() => test()} disabled={testing} />
        </View>
        <View style={styles.grow}>
          <PrimaryButton label="Save" variant="ghost" onPress={save} />
        </View>
      </View>

      {status && (
        <View style={[styles.status, { backgroundColor: status.ok ? colors.primaryMuted : 'rgba(220,38,38,0.12)' }]}>
          <Text style={[styles.statusText, { color: status.ok ? colors.primary : colors.danger }]}>{status.msg}</Text>
        </View>
      )}

      <Pressable onPress={() => router.push('/permissions')} style={styles.linkRow}>
        <Text style={[styles.link, { color: colors.primary }]}>App permissions →</Text>
      </Pressable>

      <Text style={[styles.hint, { color: colors.muted }]}>
        Tip: for local testing on the same Wi-Fi, use your computer's IP like http://192.168.1.20:4000
      </Text>
      {testing ? <ActivityIndicator color={colors.primary} style={styles.spinner} /> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 20, gap: 12 },
  h1: { fontSize: 24, fontWeight: '800', marginTop: 8 },
  p: { fontSize: 14, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '700', marginTop: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  row: { flexDirection: 'row', gap: 12, marginTop: 4 },
  grow: { flex: 1 },
  status: { borderRadius: 12, padding: 12 },
  statusText: { fontWeight: '700', fontSize: 13 },
  linkRow: { marginTop: 16 },
  link: { fontWeight: '700', fontSize: 15 },
  hint: { fontSize: 12, lineHeight: 17, marginTop: 12 },
  spinner: { marginTop: 8 },
});
