/** Support
 * Simple feedback / issue reporting screen.
 * Clean, friendly, and ready for real submission later.
 */
import { useState } from 'react';
import { Text, TextInput, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { GradientButton, GlassCard } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, radii, type as typo } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';

export default function SupportScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();

  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;

    setSending(true);
    impact('medium');

    // Simulate sending (replace with real API call later)
    await new Promise((r) => setTimeout(r, 600));

    setSending(false);
    setSent(true);
    setMessage('');
    impact('success');

    // Reset success message after a few seconds
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <Screen>
      <Text style={[styles.h1, { color: colors.text }]}>Support</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Tell us what’s going on. We’re here to help.
      </Text>

      <GlassCard style={{ marginTop: spacing.sm }}>
        <Text style={[styles.label, { color: colors.muted }]}>
          Describe the issue
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
          multiline
          value={message}
          onChangeText={setMessage}
          placeholder="What happened? Steps to reproduce, screenshots, etc."
          placeholderTextColor={colors.muted}
          textAlignVertical="top"
          maxLength={1200}
        />

        <View style={{ marginTop: spacing.md }}>
          <GradientButton
            label={sending ? 'Sending…' : sent ? 'Sent!' : 'Send message'}
            onPress={handleSend}
            loading={sending}
            disabled={sending || !message.trim() || sent}
            fullWidth
            icon={sent ? 'checkmark-circle' : undefined}
          />
        </View>

        {sent && (
          <Text
            style={{
              marginTop: 12,
              textAlign: 'center',
              color: colors.success,
              fontWeight: '600',
              fontSize: 13,
            }}
          >
            Thanks! We’ll get back to you soon.
          </Text>
        )}
      </GlassCard>
    </Screen>
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
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 130,
    fontSize: 15,
    lineHeight: 22,
  },
});
