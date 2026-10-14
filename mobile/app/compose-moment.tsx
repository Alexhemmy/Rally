import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, spacing, radii } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { useRouter } from 'expo-router';
import { SwipeBack } from '@/components/SwipeBack';
import { SoundTextInput } from '@/components/SoundTextInput';
import { LongPressMenu } from '@/components/LongPressMenu';

export default function ComposeMoment() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [mediaLabel, setMediaLabel] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const { impact } = useHaptics();
  const { success, click } = useSounds();
  const router = useRouter();

  function pickMedia(source: 'camera' | 'library') {
    impact('medium');
    click();
    setMediaLabel(source === 'camera' ? 'Camera (wire expo-camera)' : 'Library (wire expo-image-picker)');
  }

  function publish() {
    if (!title) {
      Alert.alert('Moment', 'Add a title first');
      return;
    }
    impact('success');
    success();
    router.back();
  }

  return (
    <SwipeBack pullDown>
      <Screen>
        <LongPressMenu
          visible={menu}
          title="Add media"
          actions={[
            { label: 'Camera', onPress: () => pickMedia('camera') },
            { label: 'Photo library', onPress: () => pickMedia('library') },
          ]}
          onClose={() => setMenu(false)}
        />
        <Text style={styles.hint}>Pull down to go back</Text>
        <Text style={styles.h1}>New Moment</Text>
        <SoundTextInput
          style={styles.input}
          placeholder="Title"
          placeholderTextColor={colors.muted}
          value={title}
          onChangeText={setTitle}
          maxLength={120}
        />
        <SoundTextInput
          style={[styles.input, styles.area]}
          placeholder="What's happening?"
          placeholderTextColor={colors.muted}
          value={body}
          onChangeText={setBody}
          multiline
          maxLength={1000}
        />
        <PrimaryButton label="Hold for media options" variant="ghost" onPress={() => setMenu(true)} />
        {mediaLabel && <Text style={styles.muted}>{mediaLabel}</Text>}
        <PrimaryButton label="Publish" onPress={publish} style={{ marginTop: 16 }} />
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  hint: { color: colors.muted, fontSize: 12, marginTop: spacing.sm },
  h1: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 12 },
  muted: { color: colors.muted, marginTop: 8 },
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
});
