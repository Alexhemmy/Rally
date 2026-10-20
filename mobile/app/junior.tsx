/** Junior Favorite program
 * 16–17 year-olds can become Junior Favorites with guardian consent.
 * No payouts, no giveaways, no cash prizes.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, TextInput } from 'react-native';
import { Screen } from '@/components/Screen';
import { GradientButton, GlassCard, SectionHeader } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { api, getToken } from '@/lib/api';
import { spacing, radii, type as typo } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';

type Application = {
  id: string;
  status: string;
  guardianName: string;
  note: string | null;
};

export default function JuniorScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();

  const [app, setApp] = useState<Application | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!getToken()) return;
    setRefreshing(true);
    try {
      const r = await api<{ application: Application | null }>('/api/junior/me');
      setApp(r.application || null);
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function apply() {
    if (!name.trim() || !phone.trim()) {
      setMsg({ type: 'error', text: 'Please fill in both guardian name and phone' });
      return;
    }

    setMsg(null);
    setSubmitting(true);
    impact('medium');

    try {
      const r = await api<{ devConsentCode?: string }>('/api/junior/apply', {
        method: 'POST',
        body: JSON.stringify({
          guardianName: name.trim(),
          guardianPhone: phone.trim(),
        }),
      });

      let successText = 'Application submitted. Guardian consent is next.';
      if (r.devConsentCode) {
        successText = `Application submitted. Dev consent code: ${r.devConsentCode}`;
      }

      setMsg({ type: 'success', text: successText });
      impact('success');
      setName('');
      setPhone('');
      await load();
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Submission failed' });
    } finally {
      setSubmitting(false);
    }
  }

  async function verify() {
    if (!app || code.length < 6) return;

    setMsg(null);
    setSubmitting(true);
    impact('medium');

    try {
      await api(`/api/junior/${app.id}/verify`, {
        method: 'POST',
        body: JSON.stringify({ code }),
      });

      setMsg({ type: 'success', text: 'Guardian consent verified!' });
      impact('success');
      setCode('');
      await load();
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Verification failed' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SwipeBack>
      <Screen refreshing={refreshing} onRefresh={load}>
        {/* Header */}
        <Text style={[styles.h1, { color: colors.text }]}>
          Junior Favorite program
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          16–17 year-olds become Junior Favorites with guardian consent. No payouts, no giveaways, no cash prizes.
        </Text>

        {/* Feedback */}
        {msg && (
          <View
            style={[
              styles.feedback,
              {
                backgroundColor:
                  msg.type === 'success'
                    ? colors.success + '18'
                    : colors.danger + '18',
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

        {/* Existing application */}
        {app ? (
          <GlassCard>
            <SectionHeader title="Your application" />

            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      app.status === 'approved'
                        ? colors.success
                        : app.status === 'rejected'
                        ? colors.danger
                        : colors.warning,
                  },
                ]}
              />
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>
                Status: {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
              </Text>
            </View>

            <Text style={{ color: colors.muted, marginTop: 6 }}>
              Guardian: {app.guardianName}
            </Text>

            {!!app.note && (
              <Text style={{ color: colors.muted, marginTop: 4 }}>
                Note: {app.note}
              </Text>
            )}

            {app.status === 'pending' && (
              <View style={{ marginTop: spacing.md, gap: 10 }}>
                <Text style={{ color: colors.muted, fontSize: 13 }}>
                  Enter the 6-digit consent code sent to your guardian
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
                  placeholder="123456"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={code}
                  onChangeText={setCode}
                />
                <GradientButton
                  label="Verify guardian consent"
                  onPress={verify}
                  loading={submitting}
                  disabled={submitting || code.length < 6}
                  fullWidth
                />
              </View>
            )}
          </GlassCard>
        ) : (
          /* New application form */
          <GlassCard>
            <SectionHeader title="Submit application" />

            <Text style={[styles.label, { color: colors.muted }]}>
              Guardian full name
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
              placeholder="Full legal name"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.label, { color: colors.muted }]}>
              Guardian phone
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
              placeholder="+1 555 000 0000"
              placeholderTextColor={colors.muted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <View style={{ marginTop: spacing.sm }}>
              <GradientButton
                label="Submit application"
                onPress={apply}
                loading={submitting}
                disabled={submitting || !name.trim() || !phone.trim()}
                fullWidth
              />
            </View>
          </GlassCard>
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
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
  },
});
