/** Become a Favorite
 * Community-based upgrade path — money never counts.
 * Clean progress tracking + application form when eligible.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  Text,
  StyleSheet,
  View,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { GradientButton } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { GlassCard, SectionHeader } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { api } from '@/lib/api';
import { spacing, radii, type as typo } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';

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

export default function BecomeFavoriteScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();

  const [progress, setProgress] = useState<Progress | null>(null);
  const [pitch, setPitch] = useState('');
  const [samples, setSamples] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const p = await api<Progress>('/api/upgrades/progress');
      setProgress(p);
    } catch {
      // offline or not logged in
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function apply() {
    if (pitch.trim().length < 50) {
      setMsg({ type: 'error', text: 'Pitch must be at least 50 characters' });
      return;
    }

    setMsg(null);
    setSubmitting(true);
    impact('medium');

    try {
      await api('/api/upgrades/request', {
        method: 'POST',
        body: JSON.stringify({
          pitch: pitch.trim(),
          samples: samples
            .split(/[\n,]/)
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });

      setMsg({ type: 'success', text: 'Application submitted successfully!' });
      setPitch('');
      setSamples('');
      impact('success');
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Submission failed' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SwipeBack>
      <Screen refreshing={refreshing} onRefresh={load}>
        {/* Header */}
        <Text style={[styles.h1, { color: colors.text }]}>
          Become a Favorite
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Upgrade by community standing — money never counts.
        </Text>

        {/* Feedback message */}
        {msg && (
          <View
            style={[
              styles.badge,
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

        {/* Progress Card */}
        {progress ? (
          <GlassCard style={{ marginBottom: spacing.md }}>
            <SectionHeader
              title={`Progress  ·  ${progress.passed}/${progress.total}`}
            />

            <View style={{ gap: 10, marginTop: 4 }}>
              {Object.entries(progress.signals).map(([key, ok]) => (
                <View key={key} style={styles.signalRow}>
                  <Text style={{ fontSize: 16 }}>{ok ? '✅' : '⬜'}</Text>
                  <Text
                    style={[
                      styles.signalLabel,
                      { color: ok ? colors.text : colors.muted },
                    ]}
                  >
                    {LABELS[key] ?? key}
                  </Text>
                </View>
              ))}
            </View>

            {progress.eligible && (
              <View
                style={[
                  styles.eligibleBadge,
                  { backgroundColor: colors.primaryMuted },
                ]}
              >
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>
                  You’re eligible to apply!
                </Text>
              </View>
            )}
          </GlassCard>
        ) : (
          <GlassCard style={{ marginBottom: spacing.md }}>
            <Text style={{ color: colors.muted, textAlign: 'center' }}>
              Log in to check your progress.
            </Text>
          </GlassCard>
        )}

        {/* Application Form (only when eligible) */}
        {progress?.eligible && (
          <GlassCard>
            <SectionHeader title="Submit Application" />

            <Text style={[styles.label, { color: colors.muted }]}>
              Your pitch (min. 50 characters)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                  color: colors.text,
                  minHeight: 100,
                  textAlignVertical: 'top',
                },
              ]}
              placeholder="Tell us why you should be a Favorite..."
              placeholderTextColor={colors.muted}
              multiline
              value={pitch}
              onChangeText={setPitch}
              maxLength={600}
            />

            <Text style={[styles.label, { color: colors.muted, marginTop: 12 }]}>
              Sample links (optional)
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
              placeholder="https://..., https://..."
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
              value={samples}
              onChangeText={setSamples}
            />

            <View style={{ marginTop: spacing.md }}>
              <GradientButton
                label={submitting ? 'Submitting…' : 'Submit application'}
                onPress={apply}
                loading={submitting}
                disabled={submitting || pitch.trim().length < 50}
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
  badge: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  signalLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  eligibleBadge: {
    marginTop: spacing.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.sm,
    alignSelf: 'flex-start',
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
  },
});
