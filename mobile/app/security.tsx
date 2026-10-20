/** Security
 * Two-factor authentication, password change, session control & recent activity.
 * Clean, trustworthy, and theme-aware.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  Text,
  StyleSheet,
  View,
  TextInput,
  Pressable,
} from 'react-native';
import { api, setToken } from '@/lib/api';
import { Screen } from '@/components/Screen';
import { GradientButton, GlassCard, SectionHeader } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, radii, type as typo } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';

type Overview = {
  security: {
    twoFactorEnabled: boolean;
    recoveryCodesRemaining: number;
    locked: boolean;
  };
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
  const { colors } = useTheme();
  const { impact } = useHaptics();

  const [overview, setOverview] = useState<Overview | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [setupSecret, setSetupSecret] = useState<string | null>(null);
  const [totp, setTotp] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [refreshing, setRefreshing] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await api<Overview>('/api/security/me');
      setOverview(r);
      setMsg(null);
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Failed to load security settings' });
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function startSetup() {
    setMsg(null);
    setLoadingAction('setup');
    try {
      const r = await api<{ secret: string }>('/api/security/2fa/setup', { method: 'POST' });
      setSetupSecret(r.secret);
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setLoadingAction(null);
    }
  }

  async function enable() {
    if (totp.length < 6) return;
    setMsg(null);
    setLoadingAction('enable');
    impact('medium');

    try {
      const r = await api<{ recoveryCodes: string[] }>('/api/security/2fa/enable', {
        method: 'POST',
        body: JSON.stringify({ code: totp }),
      });
      setSetupSecret(null);
      setTotp('');
      setRecoveryCodes(r.recoveryCodes);
      setMsg({ type: 'success', text: 'Two-factor enabled. Save your recovery codes now.' });
      impact('success');
      load();
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setLoadingAction(null);
    }
  }

  async function changePassword() {
    setMsg(null);
    if (pw.next !== pw.confirm) {
      setMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (pw.next.length < 8) {
      setMsg({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setLoadingAction('password');
    impact('medium');

    try {
      const r = await api<{ token: string }>('/api/security/password/change', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: pw.current,
          newPassword: pw.next,
        }),
      });
      setToken(r.token);
      setPw({ current: '', next: '', confirm: '' });
      setMsg({ type: 'success', text: 'Password changed. Other sessions signed out.' });
      impact('success');
      load();
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setLoadingAction(null);
    }
  }

  async function revokeAll() {
    setMsg(null);
    setLoadingAction('revoke');
    impact('medium');

    try {
      const r = await api<{ token: string }>('/api/security/sessions/revoke-all', {
        method: 'POST',
      });
      setToken(r.token);
      setMsg({ type: 'success', text: 'All other sessions signed out.' });
      impact('success');
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <SwipeBack>
      <Screen refreshing={refreshing} onRefresh={load}>
        {/* Header */}
        <Text style={[styles.h1, { color: colors.text }]}>Security</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Two-factor, password, and session controls. Rally never asks for your password or a code in a message.
        </Text>

        {/* Feedback */}
        {msg && (
          <View
            style={[
              styles.feedback,
              {
                backgroundColor:
                  msg.type === 'success' ? colors.success + '18' : colors.danger + '18',
              },
            ]}
          >
            <Text
              style={{
                color: msg.type === 'success' ? colors.success : colors.danger,
                fontWeight: '700',
                fontSize: 13,
              }}
            >
              {msg.text}
            </Text>
          </View>
        )}

        {/* Two-Factor */}
        {overview && (
          <GlassCard style={{ marginBottom: spacing.md }}>
            <SectionHeader title="Two-factor authentication" />

            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: overview.security.twoFactorEnabled
                      ? colors.success
                      : colors.muted,
                  },
                ]}
              />
              <Text style={{ color: colors.text, fontWeight: '600' }}>
                {overview.security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </Text>
            </View>

            {overview.security.twoFactorEnabled && (
              <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
                {overview.security.recoveryCodesRemaining} recovery codes remaining
              </Text>
            )}

            {!overview.security.twoFactorEnabled && !setupSecret && (
              <View style={{ marginTop: spacing.md }}>
                <GradientButton
                  label="Set up two-factor"
                  onPress={startSetup}
                  loading={loadingAction === 'setup'}
                  fullWidth
                />
              </View>
            )}

            {!!setupSecret && (
              <View style={{ marginTop: spacing.md, gap: 10 }}>
                <Text style={{ color: colors.muted, fontSize: 13 }}>
                  Add this secret to your authenticator app:
                </Text>
                <View
                  style={[
                    styles.secretBox,
                    { backgroundColor: colors.bg, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.code, { color: colors.text }]} selectable>
                    {setupSecret}
                  </Text>
                </View>

                <Text style={{ color: colors.muted, fontSize: 13 }}>
                  Then enter the 6-digit code:
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.bg,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={totp}
                  onChangeText={setTotp}
                  placeholder="123456"
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholderTextColor={colors.muted}
                />
                <GradientButton
                  label="Enable two-factor"
                  onPress={enable}
                  loading={loadingAction === 'enable'}
                  disabled={totp.length < 6}
                  fullWidth
                />
              </View>
            )}

            {!!recoveryCodes && (
              <View style={{ marginTop: spacing.md }}>
                <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 8 }}>
                  Recovery codes (shown once)
                </Text>
                <View
                  style={[
                    styles.secretBox,
                    { backgroundColor: colors.bg, borderColor: colors.border },
                  ]}
                >
                  {recoveryCodes.map((code) => (
                    <Text key={code} style={[styles.code, { color: colors.text }]} selectable>
                      {code}
                    </Text>
                  ))}
                </View>
              </View>
            )}
          </GlassCard>
        )}

        {/* Sign out other sessions */}
        {overview?.security.twoFactorEnabled && (
          <GlassCard style={{ marginBottom: spacing.md }}>
            <GradientButton
              label="Sign out all other sessions"
              variant="ghost"
              onPress={revokeAll}
              loading={loadingAction === 'revoke'}
              fullWidth
            />
          </GlassCard>
        )}

        {/* Change Password */}
        <GlassCard style={{ marginBottom: spacing.md }}>
          <SectionHeader title="Change password" />

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.bg,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            secureTextEntry
            value={pw.current}
            onChangeText={(v) => setPw({ ...pw, current: v })}
            placeholder="Current password"
            placeholderTextColor={colors.muted}
          />
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.bg,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            secureTextEntry
            value={pw.next}
            onChangeText={(v) => setPw({ ...pw, next: v })}
            placeholder="New password (8+ characters)"
            placeholderTextColor={colors.muted}
          />
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.bg,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            secureTextEntry
            value={pw.confirm}
            onChangeText={(v) => setPw({ ...pw, confirm: v })}
            placeholder="Confirm new password"
            placeholderTextColor={colors.muted}
          />

          <View style={{ marginTop: 4 }}>
            <GradientButton
              label="Change password"
              onPress={changePassword}
              loading={loadingAction === 'password'}
              fullWidth
            />
          </View>
        </GlassCard>

        {/* Recent Activity */}
        {overview && (
          <GlassCard>
            <SectionHeader title="Recent activity" />

            <View style={{ gap: 8 }}>
              {overview.events.slice(0, 6).map((event) => (
                <View key={event.id} style={styles.eventRow}>
                  <Text style={{ color: colors.text, fontSize: 14, flex: 1 }}>
                    {EVENT_LABELS[event.type] || event.type}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>
                    {new Date(event.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>

            <Text
              style={{
                color: colors.muted,
                fontSize: 13,
                marginTop: spacing.md,
                lineHeight: 18,
              }}
            >
              {overview.phishingTips}
            </Text>
          </GlassCard>
        )}

        {!overview && !msg && (
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 24 }}>
            Loading security settings…
          </Text>
        )}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: {
    ...typo.h1,
    marginTop: spacing.sm,
    marginBottom: 6,
  },
  subtitle: {
    ...typo.body,
    marginBottom: spacing.lg,
    lineHeight: 21,
  },
  feedback: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  secretBox: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 12,
    gap: 4,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 10,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
});
