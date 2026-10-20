/** Compose Moment
 * Create a new Moment with title, body, and optional media.
 */
import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Screen } from '@/components/Screen';
import { GradientButton, GlassCard } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, radii, type as typo } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { useRouter } from 'expo-router';
import { SwipeBack } from '@/components/SwipeBack';
import { SoundTextInput } from '@/components/SoundTextInput';
import { LongPressMenu } from '@/components/LongPressMenu';

export default function ComposeMomentScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();
  const { success, click } = useSounds();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [mediaLabel, setMediaLabel] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [publishing, setPublishing] = useState(false);

  function pickMedia(source: 'camera' | 'library') {
    impact('medium');
    click();
    setMediaLabel(
      source === 'camera'
        ? 'Camera selected (wire expo-camera)'
        : 'Library selected (wire expo-image-picker)',
    );
  }

  function publish() {
    if (!title.trim()) {
      Alert.alert('Moment', 'Please add a title first');
      return;
    }

    setPublishing(true);
    impact('success');
    success();

    // Simulate publish delay
    setTimeout(() => {
      setPublishing(false);
      router.back();
    }, 400);
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

        <Text style={[styles.hint, { color: colors.muted }]}>
          Pull down to go back
        </Text>

        <Text style={[styles.h1, { color: colors.text }]}>New Moment</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Share what’s happening with your audience.
        </Text>

        <GlassCard style={{ marginTop: spacing.sm }}>
          <Text style={[styles.label, { color: colors.muted }]}>Title</Text>
          <SoundTextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.bg,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Give your Moment a title"
            placeholderTextColor={colors.muted}
            value={title}
            onChangeText={setTitle}
            maxLength={120}
          />

          <Text style={[styles.label, { color: colors.muted }]}>
            What’s happening?
          </Text>
          <SoundTextInput
            style={[
              styles.input,
              styles.area,
              {
                backgroundColor: colors.bg,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Write something interesting..."
            placeholderTextColor={colors.muted}
            value={body}
            onChangeText={setBody}
            multiline
            maxLength={1000}
            textAlignVertical="top"
          />

          <GradientButton
            label="Add media"
            variant="ghost"
            icon="image-outline"
            onPress={() => setMenu(true)}
            fullWidth
          />

          {mediaLabel && (
            <Text
              style={{
                color: colors.primary,
                marginTop: 10,
                fontSize: 13,
                fontWeight: '600',
              }}
            >
              {mediaLabel}
            </Text>
          )}

          <View style={{ marginTop: spacing.lg }}>
            <GradientButton
              label={publishing ? 'Publishing…' : 'Publish Moment'}
              onPress={publish}
              loading={publishing}
              disabled={publishing || !title.trim()}
              fullWidth
            />
          </View>
        </GlassCard>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  hint: {
    fontSize: 12,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  h1: {
    ...typo.h1,
    marginBottom: 6,
  },
  subtitle: {
    ...typo.body,
    marginBottom: spacing.md,
    lineHeight: 21,
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
  area: {
    minHeight: 130,
  },
});
