import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, TextInput, Pressable } from 'react-native';
import { api, setToken } from '@/lib/api';
import { colors, spacing, radii } from '@/constants/theme';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SwipeBack } from '@/components/SwipeBack';

type Overview = {
  security: { twoFactorEnabled: boolean; recoveryCodesRemaining: number; locked: boolean };
  events: { id: string; type: string; createdAt: string }[];
  phishingTips: string;
};

const EVENT_LABELS: Record<string, string> = {
  login: 'Signed in',
  login_2fa: 'Signed in (2FA)',
  login_failed: 'Failed sign-in',
  lockout: 'Account locked',
  password_changed: 'Password changed',
  '2fa_enabled': 'Two-factor enabled',
  '2fa_disabled': 'Two-factor disabled',
  sessions_revoked: 'Sessions signed out',
};

export default function SecurityScreen() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [setupSecret, setSetupSecret] = useState<string | null>(null);
  const [totp, setTotp] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await api<Overview>('/api/security/me');
      setOverview(r);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function startSetup() {
    setErr(''); setMsg('');
    try {
      const r = await api<{ secret: string }>('/api/security/2fa/setup', { method: 'POST' });
      setSetupSecret(r.secret);
    } catch (e: any) { setErr(e.message); }
  }

  async function enable() {
    setErr(''); setMsg('');
    try {
      const r = await api<{ recoveryCodes: string[] }>('/api/security/2fa/enable', {
        method: 'POST',
        body: JSON.stringify({ code: totp }),
      });
      setSetupSecret(null);
      setTotp('');
      setRecoveryCodes(r.recoveryCodes);
      setMsg('Two-factor enabled. Save your recovery codes.');
      load();
    } catch (e: any) { setErr(e.message); }
  }

  async function changePassword() {
    setErr(''); setMsg('');
    if (pw.next !== pw.confirm) { setErr('New passwords do not match'); return; }
    try {
      const r = await api<{ token: string }>('/api/security/password/change', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
      });
      setToken(r.token);
      setPw({ current: '', next: '', confirm: '' });
      setMsg('Password changed. Other sessions signed out.');
      load();
    } catch (e: any) { setErr(e.message); }
  }

  async function revokeAll() {
    setErr(''); setMsg('');
    try {
      const r = await api<{ token: string }>('/api/security/sessions/revoke-all', { method: 'POST' });
      setToken(r.token);
      setMsg('All other sessions signed out.');
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <SwipeBack>
      <Screen refreshing={refreshing} onRefresh={load}>
        <Text style={styles.h1}>Security</Text>
        <Text style={styles.muted}>
          Two-factor, password, and session controls. Rally never asks for your password or a code in a message.
        </Text>
        {!!msg && <Text style={styles.ok}>{msg}</Text>}
        {!!err && <Text style={styles.err}>{err}</Text>}

        {overview && (
          <View style={styles.card}>
            <Text style={styles.name}>
              Two-factor: {overview.security.twoFactorEnabled ? 'ON' : 'OFF'}
            </Text>
            {overview.security.twoFactorEnabled && (
              <Text style={styles.muted}>
                {overview.security.recoveryCodesRemaining} recovery codes remaining
              </Text>
            )}
            {!overview.security.twoFactorEnabled && !setupSecret && (
              <PrimaryButton label="Set up two-factor" onPress={startSetup} />
            )}
            {!!setupSecret && (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.muted}>Add this secret to your authenticator app:</Text>
                <Text style={styles.code}>{setupSecret}</Text>
                <Text style={styles.muted}>Then enter the 6-digit code:</Text>
                <TextInput
                  style={styles.input}
                  value={totp}
                  onChangeText={setTotp}
                  placeholder="123456"
                  keyboardType="number-pad"
                  placeholderTextColor={colors.muted}
                />
                <PrimaryButton label="Enable" onPress={enable} />
              </View>
            )}
            {!!recoveryCodes && (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.name}>Recovery codes (shown once):</Text>
                {recoveryCodes.map((c) => (
                  <Text key={c} style={styles.code}>{c}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {overview?.security.twoFactorEnabled && (
          <View style={styles.card}>
            <PrimaryButton label="Sign out all other sessions" variant="ghost" onPress={revokeAll} />
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.name}>Change password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={pw.current}
            onChangeText={(v) => setPw({ ...pw, current: v })}
            placeholder="Current password"
            placeholderTextColor={colors.muted}
          />
          <TextInput
            style={styles.input}
            secureTextEntry
            value={pw.next}
            onChangeText={(v) => setPw({ ...pw, next: v })}
            placeholder="New password (8+ chars)"
            placeholderTextColor={colors.muted}
          />
          <TextInput
            style={styles.input}
            secureTextEntry
            value={pw.confirm}
            onChangeText={(v) => setPw({ ...pw, confirm: v })}
            placeholder="Confirm new password"
            placeholderTextColor={colors.muted}
          />
          <PrimaryButton label="Change password" onPress={changePassword} />
        </View>

        {overview && (
          <View style={styles.card}>
            <Text style={styles.name}>Recent activity</Text>
            {overview.events.slice(0, 6).map((e) => (
              <Text key={e.id} style={styles.muted}>
                {EVENT_LABELS[e.type] || e.type} · {new Date(e.createdAt).toLocaleDateString()}
              </Text>
            ))}
            <Text style={styles.muted}>{overview.phishingTips}</Text>
          </View>
        )}

        {!overview && !err && <Text style={styles.muted}>Loading…</Text>}
        {!overview && !!err && (
          <Pressable onPress={() => ({})}>
            <Text style={styles.muted}>Log in to manage security settings.</Text>
          </Pressable>
        )}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: spacing.sm, marginBottom: 8 },
  muted: { color: colors.muted, marginBottom: 8, fontSize: 14 },
  name: { color: colors.text, fontWeight: '700', fontSize: 16, marginBottom: 4 },
  code: { fontFamily: 'monospace', color: colors.text, marginBottom: 4, fontSize: 13 },
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
