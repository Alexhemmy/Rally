import { useState } from 'react';
import { Text, TextInput, StyleSheet } from 'react-native';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, spacing, radii } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';

export default function Support() {
  const [msg, setMsg] = useState('');
  const { impact } = useHaptics();
  return (
    <Screen>
      <Text style={styles.h1}>Support</Text>
      <TextInput
        style={[styles.input, { minHeight: 120, textAlignVertical: 'top' }]}
        multiline
        value={msg}
        onChangeText={setMsg}
        placeholder="Describe the issue…"
        placeholderTextColor={colors.muted}
      />
      <PrimaryButton
        label="Send"
        onPress={() => {
          impact('success');
          setMsg('');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 12, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 14,
    color: colors.text,
    marginBottom: 12,
  },
});
