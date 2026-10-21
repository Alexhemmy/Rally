/** Compose Moment
 * Create a new Moment with title, body, optional category tag and real
 * multi-media upload (up to 10 photos and/or videos) via /api/media/upload.
 * Uploads and publishing are wrapped in runWithAppTask() so the biometric
 * lock never interrupts them.
 */
import { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Pressable } from 'react-native';
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
import { runWithAppTask } from '@/components/BiometricGate';
import { api } from '@/lib/api';
import { getApiUrl } from '@/lib/config';

const MAX_BASE64 = 25 * 1024 * 1024; // 25MB per file (matches backend limit)
const MAX_ITEMS = 10;

type MediaItem = { url: string; type: 'image' | 'video' };

export default function ComposeMomentScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();
  const { success, click, error: errSound } = useSounds();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [categoryTag, setCategoryTag] = useState('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
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

  async function uploadOne(asset: ImagePicker.Asset): Promise<MediaItem> {
    if (!asset.base64) throw new Error('Could not read the selected media.');
    if (asset.base64.length > MAX_BASE64) {
      throw new Error('One of the files is too large (max 25MB). Please pick smaller media.');
    }
    const mimeType = asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg');
    const up = await api<{ media: { url: string } }>('/api/media/upload', {
      method: 'POST',
      body: JSON.stringify({ mimeType, base64: asset.base64 }),
    });
    // Uploads return absolute bucket URLs; only legacy relative
    // /api/media/<id> URLs need the server base prepended.
    const rawUrl = up.media.url || '';
    const url = rawUrl.startsWith('http') ? rawUrl : (await getApiUrl()) + rawUrl;
    return { url, type: asset.type === 'video' ? 'video' : 'image' };
  }

  async function pickMedia(source: 'camera' | 'library') {
    if (mediaItems.length >= MAX_ITEMS) {
      Alert.alert('Media', 'You can attach up to ' + MAX_ITEMS + ' files.');
      return;
    }
    impact('medium');
    click();
    if (!(await ensurePermission(source === 'camera'))) return;
    try {
      const remaining = MAX_ITEMS - mediaItems.length;
      const opts: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.7,
        base64: true,
        // Multi-select from the gallery (single shot from the camera).
        allowsMultipleSelection: source === 'library',
        selectionLimit: source === 'library' ? remaining : 1,
      };
      const res =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(opts)
          : await ImagePicker.launchImageLibraryAsync(opts);
      if (res.canceled || !res.assets || res.assets.length === 0) return;
      const assets = res.assets.slice(0, remaining);

      setUploading(true);
      // runWithAppTask: the biometric lock will not trigger during uploads.
      await runWithAppTask(async () => {
        const uploaded: MediaItem[] = [];
        for (let i = 0; i < assets.length; i++) {
          setUploadProgress('Uploading ' + (i + 1) + ' of ' + assets.length + '…');
          uploaded.push(await uploadOne(assets[i]));
        }
        setMediaItems((prev) => [...prev, ...uploaded].slice(0, MAX_ITEMS));
        success();
        impact('success');
      });
    } catch (e: any) {
      errSound();
      impact('error');
      Alert.alert('Media upload', e.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  }

  function removeItem(index: number) {
    click();
    setMediaItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function publish() {
    if (!title.trim()) {
      Alert.alert('Moment', 'Please add a title first');
      return;
    }
    setPublishing(true);
    impact('medium');
    try {
      await runWithAppTask(async () => {
        await api('/api/moments', {
          method: 'POST',
          body: JSON.stringify({
            title: title.trim(),
            description: body.trim() || undefined,
            categoryTag: categoryTag.trim() || undefined,
            // Multi-media array (the API shape), plus single-media fields
            // for backward compatibility with older readers.
            media: mediaItems.length > 0 ? mediaItems : undefined,
            mediaUrl: mediaItems.length > 0 ? mediaItems[0].url : undefined,
            mediaType: mediaItems.length > 0 ? mediaItems[0].type : undefined,
          }),
        });
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
            style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
            placeholder="Give your Moment a title"
            placeholderTextColor={colors.muted}
            value={title}
            onChangeText={setTitle}
            maxLength={120}
          />

          <Text style={[styles.label, { color: colors.muted }]}>What is happening?</Text>
          <SoundTextInput
            style={[styles.input, styles.area, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
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
            style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
            placeholder="e.g. music, art, football"
            placeholderTextColor={colors.muted}
            value={categoryTag}
            onChangeText={setCategoryTag}
            maxLength={40}
            autoCapitalize="none"
          />

          <View style={{ gap: 10 }}>
            <GradientButton
              label={uploading ? (uploadProgress || 'Uploading…') : 'Take photo or video'}
              variant="ghost"
              icon="camera-outline"
              onPress={() => pickMedia('camera')}
              loading={uploading}
              disabled={uploading || publishing || mediaItems.length >= MAX_ITEMS}
              fullWidth
            />
            <GradientButton
              label={
                uploading
                  ? (uploadProgress || 'Uploading…')
                  : 'Choose from library (' + mediaItems.length + '/' + MAX_ITEMS + ')'
              }
              variant="ghost"
              icon="images-outline"
              onPress={() => pickMedia('library')}
              loading={uploading}
              disabled={uploading || publishing || mediaItems.length >= MAX_ITEMS}
              fullWidth
            />
          </View>

          {mediaItems.length > 0 && (
            <View style={{ marginTop: 14 }}>
              <Text style={[styles.label, { color: colors.muted }]}>
                Attached media ({mediaItems.length})
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {mediaItems.map((item, i) => (
                  <Pressable
                    key={i}
                    onPress={() => removeItem(i)}
                    style={[styles.chip, { backgroundColor: colors.bg, borderColor: colors.border }]}
                  >
                    <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>
                      {item.type === 'video' ? '🎬' : '🖼'} {item.type === 'video' ? 'Video' : 'Photo'} {i + 1}
                    </Text>
                    <Text style={{ color: colors.primary, fontSize: 12, marginLeft: 6 }}>✕</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Text style={[styles.label, { color: colors.muted, marginTop: 6, fontWeight: '400' }]}>
                Tap a chip to remove it. Mix photos and videos freely.
              </Text>
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
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
