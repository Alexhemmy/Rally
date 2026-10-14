import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { colors, spacing, radii } from '@/constants/theme';

export default function Support() {
  return (
    <View style={styles.pad}>
      <Text style={styles.h1}>Support</Text>
      <TextInput
        style={[styles.input, { minHeight: 120, textAlignVertical: 'top' }]}
        multiline
        placeholder="Describe the issue…"
        placeholderTextColor={colors.muted}
      />
      <Pressable style={styles.btn}>
        <Text style={styles.btnText}>Send</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { flex: 1, padding: spacing.md },
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 12 },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 14,
    color: colors.text,
    marginBottom: 12,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: { color: '#04101F', fontWeight: '700' },
});
