import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Image, Alert } from 'react-native';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, spacing, radii } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useRouter } from 'expo-router';

/**
 * Mobile-only compose: camera/gallery hooks via placeholder.
 * Production: expo-image-picker + expo-camera permissions.
 */
export default function ComposeMoment() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [mediaLabel, setMediaLabel] = useState<string | null>(null);
  const { impact } = useHaptics();
  const router = useRouter();

  function pickMedia(source: 'camera' | 'library') {
    impact('medium');
    setMediaLabel(source === 'camera' ? 'Camera capture (wire expo-camera)' : 'Library pick (wire expo-image-picker)');
    Alert.alert(
      'Media',
      'Add expo-image-picker / expo-camera for production. Placeholder attached for layout testing.'
    );
  }

  function publish() {
    impact('success');
    Alert.alert('Moment', title ? `Queued: ${title}` : 'Add a title first');
    if (title) router.back();
  }

  return (
    <Screen>
      <Text style={styles.h1}>New Moment</Text>
      <Text style={styles.muted}>Mobile capture flow · under 30s publish (PRD)</Text>
      <TextInput
        style={styles.input}
        placeholder="Title"
        placeholderTextColor={colors.muted}
        value={title}
        onChangeText={setTitle}
        maxLength={120}
      />
      <TextInput
        style={[styles.input, styles.area]}
        placeholder="What's happening?"
        placeholderTextColor={colors.muted}
        value={body}
        onChangeText={setBody}
        multiline
        maxLength={1000}
      />
      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <PrimaryButton label="Camera" variant="ghost" onPress={() => pickMedia('camera')} />
        </View>
        <View style={{ flex: 1 }}>
          <PrimaryButton label="Library" variant="ghost" onPress={() => pickMedia('library')} />
        </View>
      </View>
      {mediaLabel && (
        <View style={styles.media}>
          <Text style={styles.muted}>{mediaLabel}</Text>
          <View style={styles.placeholder}>
            <Text style={{ color: colors.primary }}>🖼</Text>
          </View>
        </View>
      )}
      <PrimaryButton label="Publish" onPress={publish} style={{ marginTop: 16 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  muted: { color: colors.muted, marginBottom: 12 },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 14,
    color: colors.text,
    marginBottom: 12,
    minHeight: 48,
    fontSize: 16,
  },
  area: { minHeight: 120, textAlignVertical: 'top' },
  row: { flexDirection: 'row', marginBottom: 12 },
  media: { marginTop: 8 },
  placeholder: {
    height: 160,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginTop: 8,
  },
});
