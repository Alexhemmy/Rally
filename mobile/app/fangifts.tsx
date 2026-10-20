/** Fan Gifts
 * Send Tokens to fellow fans.
 * Received Tokens are spend-only on Gifts — never cashed out.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, TextInput } from 'react-native';
import { Screen } from '@/components/Screen';
import { GradientButton, GlassCard, SectionHeader, EmptyState } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { api } from '@/lib/api';
import { spacing, radii, type as typo } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';

type FanGift = {
  id: string;
  kind: string;
  tokens: number | null;
  status: string;
};

export default function FanGiftsScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();

  const [received, setReceived] = useState<FanGift[]>([]);
  const [sent, setSent] = useState<FanGift[]>([]);
  const [handle, setHandle] = useState('');
  const [amount, setAmount] = useState('10');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [r1, r2] = await Promise.all([
        api<{ gifts: FanGift[] }>('/api/fangifts/received'),
        api<{ gifts: FanGift[] }>('/api/fangifts/sent'),
      ]);
      setReceived(r1.gifts || []);
      setSent(r2.gifts || []);
    } catch {
      // offline
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function sendTokens() {
    const parsedAmount = parseInt(amount, 10);
    if (!handle.trim()) {
      setMsg({ type: 'error', text: 'Please enter a recipient handle' });
      return;
    }
    if (!parsedAmount || parsedAmount < 1 || parsedAmount > 1000) {
      setMsg({ type: 'error', text: 'Amount must be between 1 and 1000' });
      return;
    }

    setMsg(null);
    setSending(true);
    impact('medium');

    try {
      await api('/api/fangifts/tokens', {
        method: 'POST',
        body: JSON.stringify({
          recipientHandle: handle.trim(),
          amount: parsedAmount,
        }),
      });

      setMsg({
        type: 'success',
        text: 'Sent! Recipient has 72 hours to accept.',
      });
      impact('success');
      setHandle('');
      setAmount('10');
      await load();
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Send failed' });
    } finally {
      setSending(false);
    }
  }

  async function act(id: string, action: 'accept' | 'decline') {
    setActingId(id);
    setMsg(null);
    impact('medium');

    try {
      await api(`/api/fangifts/${id}/${action}`, { method: 'POST' });
      setMsg({
        type: 'success',
        text: action === 'accept' ? 'Gift accepted' : 'Gift declined',
      });
      impact('success');
      await load();
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Action failed' });
    } finally {
      setActingId(null);
    }
  }

  return (
    <SwipeBack>
      <Screen refreshing={refreshing} onRefresh={load}>
        {/* Header */}
        <Text style={[styles.h1, { color: colors.text }]}>Fan Gifts</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Send Tokens to fellow fans. Received Tokens are spend-only on Gifts — never cashed out.
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

        {/* Send form */}
        <GlassCard style={{ marginBottom: spacing.md }}>
          <SectionHeader title="Send Tokens" />

          <Text style={[styles.label, { color: colors.muted }]}>
            Recipient handle
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
            placeholder="@handle"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            value={handle}
            onChangeText={setHandle}
          />

          <Text style={[styles.label, { color: colors.muted }]}>
            Amount (1–1000)
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
            placeholder="10"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            value={amount}
            onChangeText={setAmount}
          />

          <GradientButton
            label="Send Tokens"
            onPress={sendTokens}
            loading={sending}
            disabled={sending || !handle.trim()}
            fullWidth
          />
        </GlassCard>

        {/* Received */}
        <GlassCard style={{ marginBottom: spacing.md }}>
          <SectionHeader title="Received" />

          {received.length === 0 ? (
            <Text style={{ color: colors.muted, fontSize: 14 }}>
              Nothing yet.
            </Text>
          ) : (
            <View style={{ gap: 12 }}>
              {received.map((g) => (
                <View
                  key={g.id}
                  style={[
                    styles.giftRow,
                    {
                      backgroundColor: colors.bg,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '600' }}>
                      {g.kind === 'tokens' ? `${g.tokens} Tokens` : 'Cosmetic'}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
                      {g.status.charAt(0).toUpperCase() + g.status.slice(1)}
                    </Text>
                  </View>

                  {g.status === 'pending' && g.kind === 'tokens' && (
                    <View style={styles.actions}>
                      <GradientButton
                        label="Accept"
                        size="sm"
                        onPress={() => act(g.id, 'accept')}
                        loading={actingId === g.id}
                        disabled={!!actingId}
                      />
                      <GradientButton
                        label="Decline"
                        size="sm"
                        variant="ghost"
                        onPress={() => act(g.id, 'decline')}
                        loading={actingId === g.id}
                        disabled={!!actingId}
                      />
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </GlassCard>

        {/* Sent */}
        <GlassCard>
          <SectionHeader title="Sent" />

          {sent.length === 0 ? (
            <Text style={{ color: colors.muted, fontSize: 14 }}>
              Nothing yet.
            </Text>
          ) : (
            <View style={{ gap: 10 }}>
              {sent.map((g) => (
                <View key={g.id} style={styles.sentRow}>
                  <Text style={{ color: colors.text, fontWeight: '500' }}>
                    {g.kind === 'tokens' ? `${g.tokens} Tokens` : 'Cosmetic'}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 13 }}>
                    {g.status.charAt(0).toUpperCase() + g.status.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          )}
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
  feedback: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    marginBottom: spacing.md,
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
  giftRow: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  sentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
