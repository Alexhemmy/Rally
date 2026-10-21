/** Compose Moment
 * Create a new Moment with title, body, optional category tag and real
 * media upload (camera or photo library) via /api/media/upload.
 */
import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '@/components/Screen';
import { GradientButton, GlassCard } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, radii, type as typo } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { useRouter } from 'expo-router';
import { SwipeBack } from '@/components/SwipeBack';
import { SoundTextInput } from '@/components/SoundTextInput';
import { api } from '@/lib/api';
import { getApiUrl } from '@/lib/config';

const MAX_BASE64 = 12 * 1024 * 1024;

export default function ComposeMomentScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();
  const { success, click, error: errSound } = useSounds();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [categoryTag, setCategoryTag] = useState('');
  const [media, setMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  async function ensurePermission(camera: boolean): Promise<boolean> {
    const res = camera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!res.granted) {
      Alert.alert(
        'Permission needed',
        camera
          ? 'Rally needs camera access to take photos and videos. Enable it in Settings.'
          : 'Rally needs photo library access to pick media. Enable it in Settings.'
      );
      return false;
    }
    return true;
  }

  async function pickMedia(source: 'camera' | 'library') {
    impact('medium');
    click();
    if (!(await ensurePermission(source === 'camera'))) return;
    try {
      const opts: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.7,
        base64: true,
      };
      const res =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(opts)
          : await ImagePicker.launchImageLibraryAsync(opts);
      if (res.canceled || !res.assets || res.assets.length === 0) return;
      const asset = res.assets[0];
      if (!asset.base64) {
        Alert.alert('Media', 'Could not read the selected media.');
        return;
      }
      if (asset.base64.length > MAX_BASE64) {
        Alert.alert('Too large', 'Please choose media smaller than 12 MB.');
        return;
      }
      const mimeType = asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg');
      setUploading(true);
      const up = await api<{ media: { url: string; absoluteUrl?: string } }>('/api/media/upload', {
        method: 'POST',
        body: JSON.stringify({ mimeType, base64: asset.base64 }),
      });
      const base = await getApiUrl();
      const url = up.media && (up.media.absoluteUrl || base + up.media.url);
      if (!url) throw new Error('Upload failed');
      setMedia({ url, type: asset.type === 'video' ? 'video' : 'image' });
      success();
      impact('success');
    } catch (e: any) {
      errSound();
      impact('error');
      Alert.alert('Media upload', e.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  async function publish() {
    if (!title.trim()) {
      Alert.alert('Moment', 'Please add a title first');
      return;
    }
    setPublishing(true);
    impact('medium');
    try {
      await api('/api/moments', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: body.trim() || undefined,
          categoryTag: categoryTag.trim() || undefined,
          mediaUrl: media ? media.url : undefined,
          mediaType: media ? media.type : undefined,
        }),
      });
      success();
      impact('success');
      Alert.alert('Published', 'Your Moment is live.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      errSound();
      impact('error');
      Alert.alert('Publish failed', e.message || 'Could not publish your Moment.');
    } finally {
      setPublishing(false);
    }
  }

  return (
    <SwipeBack pullDown>
      <Screen>
        <Text style={[styles.hint, { color: colors.muted }]}>
          Pull down to go back
        </Text>

        <Text style={[styles.h1, { color: colors.text }]}>New Moment</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Share what is happening with your audience.
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
            What is happening?
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

          <Text style={[styles.label, { color: colors.muted }]}>Category tag (optional)</Text>
          <SoundTextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.bg,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="e.g. music, art, football"
            placeholderTextColor={colors.muted}
            value={categoryTag}
            onChangeText={setCategoryTag}
            maxLength={40}
            autoCapitalize="none"
          />

          <View style={{ gap: 10 }}>
            <GradientButton
              label={uploading ? 'Uploading…' : 'Take photo or video'}
              variant="ghost"
              icon="camera-outline"
              onPress={() => pickMedia('camera')}
              loading={uploading}
              disabled={uploading || publishing}
              fullWidth
            />
            <GradientButton
              label={uploading ? 'Uploading…' : 'Choose from library'}
              variant="ghost"
              icon="images-outline"
              onPress={() => pickMedia('library')}
              loading={uploading}
              disabled={uploading || publishing}
              fullWidth
            />
          </View>

          {media && (
            <View style={styles.mediaRow}>
              <Text
                style={{ color: colors.primary, fontSize: 13, fontWeight: '600', flex: 1 }}
                numberOfLines={1}
              >
                {media.type === 'video' ? 'Video' : 'Photo'} attached
              </Text>
              <GradientButton
                label="Remove"
                variant="ghost"
                onPress={() => setMedia(null)}
              />
            </View>
          )}

          <View style={{ marginTop: spacing.lg }}>
            <GradientButton
              label={publishing ? 'Publishing…' : 'Publish Moment'}
              onPress={publish}
              loading={publishing}
              disabled={publishing || uploading || !title.trim()}
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
  mediaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 10,
  },
});
