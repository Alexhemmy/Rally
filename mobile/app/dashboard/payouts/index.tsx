/** Payouts
 * Request a payout of available Gift Points balance.
 */
import { useEffect, useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { GradientButton, GlassCard, SectionHeader } from '@/components/ui';
import { SoundTextInput } from '@/components/SoundTextInput';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { api, getToken } from '@/lib/api';
import { spacing, radii, type as typo } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';

export default function PayoutsScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();

  const [data, setData] = useState<any>(null);
  const [amount, setAmount] = useState('10');
  const [destination, setDestination] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  function load() {
    const token = getToken();
    if (!token) return;
    api('/api/payouts/me', { token })
      .then(setData)
      .catch((e: any) => setMsg({ type: 'error', text: e.message }));
  }

  useEffect(() => {
    load();
  }, []);

  async function request() {
    const token = getToken();
    if (!token) {
      setMsg({ type: 'error', text: 'Please log in first' });
      return;
    }

    const parsed = Number(amount);
    if (!parsed || parsed <= 0) {
      setMsg({ type: 'error', text: 'Enter a valid amount' });
      return;
    }
    if (!destination.trim()) {
      setMsg({ type: 'error', text: 'Enter a destination' });
      return;
    }

    setLoading(true);
    setMsg(null);
    impact('medium');

    try {
      await api('/api/payouts/request', {
        method: 'POST',
        token,
        body: JSON.stringify({
          amount: parsed,
          method: 'bank',
          destination: destination.trim(),
          onDemand: false,
        }),
      });

      setMsg({ type: 'success', text: 'Payout requested successfully' });
      impact('success');
      setAmount('');
      setDestination('');
      load();
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Request failed' });
    } finally {
      setLoading(false);
    }
  }

  const available = data?.balance?.available ?? '—';

  return (
    <SwipeBack>
      <Screen>
        <Text style={[styles.h1, { color: colors.text }]}>Payouts</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Withdraw your available Gift Points balance.
        </Text>

        {/* Balance card */}
        <GlassCard style={{ marginBottom: spacing.md }}>
          <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '600' }}>
            Available balance
          </Text>
          <Text style={[styles.balance, { color: colors.primary }]}>
            {String(available)}
          </Text>
        </GlassCard>

        {/* Request form */}
        <GlassCard>
          <SectionHeader title="Request payout" />

          <Text style={[styles.label, { color: colors.muted }]}>Amount</Text>
          <SoundTextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.bg,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="e.g. 50"
            placeholderTextColor={colors.muted}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />

          <Text style={[styles.label, { color: colors.muted }]}>
            Destination (bank / mobile money)
          </Text>
          <SoundTextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.bg,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Account number or mobile money number"
            placeholderTextColor={colors.muted}
            value={destination}
            onChangeText={setDestination}
          />

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

          <GradientButton
            label="Request payout"
            onPress={request}
            loading={loading}
            disabled={loading}
            fullWidth
          />
        </GlassCard>
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
  balance: {
    fontWeight: '800',
    fontSize: 28,
    marginTop: 4,
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
    paddingVertical: 13,
    fontSize: 16,
    marginBottom: 14,
    minHeight: 50,
  },
  feedback: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    marginBottom: 14,
  },
});
