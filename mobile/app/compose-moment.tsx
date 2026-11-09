/** New Moment - Rally design (exact spec)
 * Moments are VIDEOS ONLY. Draft pill, video player card with Replace,
 * Title, Tag chips, Who can see it, How long it lasts, Post Moment.
 * Posts (text, images, videos) use /compose-post instead.
 */
import { useState } from 'react';
import { View, Text, StyleSheet, Alert, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GradientButton } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, radii, type as typo } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { SwipeBack } from '@/components/SwipeBack';
import { SoundTextInput } from '@/components/SoundTextInput';
import { runWithAppTask } from '@/components/BiometricGate';
import { api } from '@/lib/api';
import { getApiUrl } from '@/lib/config';

const GOLD = '#FFA726';
const PURPLE = '#7C4DFF';
const MAX_BASE64 = 25 * 1024 * 1024;

const TAGS = ['Release', 'Behind the scenes', 'Milestone', 'Announcement'];
const AUDIENCES = ['Public', 'Followers', 'Supporters'];
const AUDIENCE_MAP: Record<string, string> = { Public: 'PUBLIC', Followers: 'FOLLOWERS', Supporters: 'SUPPORTERS' };
const DURATIONS = ['Permanent', '24-hour flash'];

function fmtDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m + ':' + (r < 10 ? '0' : '') + r;
}

export default function ComposeMomentScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();
  const { success, click, error: errSound } = useSounds();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('Release');
  const [audience, setAudience] = useState('Public');
  const [duration, setDuration] = useState('Permanent');
  const [video, setVideo] = useState<{ url: string; seconds: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [publishing, setPublishing] = useState(false);

  async function ensurePermission(camera: boolean): Promise<boolean> {
    const res = camera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!res.granted) {
      Alert.alert('Permission needed', camera ? 'Rally needs camera access to record a video.' : 'Rally needs photo library access to pick a video.');
      return false;
    }
    return true;
  }

  async function pickVideo(source: 'camera' | 'library') {
    if (uploading || publishing) return;
    impact('medium');
    click();
    if (!(await ensurePermission(source === 'camera'))) return;
    try {
      const opts: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 0.7,
        base64: true,
        durationLimit: 180,
      };
      const res =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(opts)
          : await ImagePicker.launchImageLibraryAsync(opts);
      if (res.canceled || !res.assets || res.assets.length === 0) return;
      const asset = res.assets[0];
      if (!asset.base64 || asset.base64.length > MAX_BASE64) {
        throw new Error('That video is too large (max 25MB). Pick a shorter clip.');
      }
      setUploading(true);
      setUploadProgress('Uploading video...');
      await runWithAppTask(async () => {
        const mimeType = asset.mimeType || 'video/mp4';
        const up = await api<{ media: { url: string } }>('/api/media/upload', {
          method: 'POST',
          body: JSON.stringify({ mimeType, base64: asset.base64 }),
        });
        const rawUrl = up.media.url || '';
        const url = rawUrl.startsWith('http') ? rawUrl : (await getApiUrl()) + rawUrl;
        const seconds = (asset.duration || 0) as number;
        setVideo({ url, seconds });
        success();
        impact('success');
      });
    } catch (e: any) {
      errSound();
      impact('error');
      Alert.alert('Video upload', e.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  }

  async function publish() {
    if (!title.trim() || !video) return;
    setPublishing(true);
    impact('medium');
    try {
      await runWithAppTask(async () => {
        await api('/api/moments', {
          method: 'POST',
          body: JSON.stringify({
            title: title.trim(),
            categoryTag: tag,
            visibility: AUDIENCE_MAP[audience],
            isFlash: duration === '24-hour flash',
            mediaUrl: video.url,
            mediaType: 'video',
          }),
        });
      });
      success();
      impact('success');
      Alert.alert('Posted', 'Your Moment is live.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      errSound();
      impact('error');
      Alert.alert('Could not post', e.message || 'Please try again.');
    } finally {
      setPublishing(false);
    }
  }

  const canPost = !!title.trim() && !!video && !uploading;

  return (
    <SwipeBack pullDown>
      <Screen>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel={'Back'}>
            <Ionicons name={'chevron-back'} size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>New Moment</Text>
          <View style={[styles.draftPill, { borderColor: colors.border }]}>
            <Text style={[styles.draftText, { color: colors.muted }]}>Draft</Text>
          </View>
        </View>

        {/* Video player card */}
        <LinearGradient
          colors={[PURPLE, GOLD] as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.player}
        >
          <View style={styles.playCircle}>
            <Ionicons name={'play'} size={30} color={'#fff'} />
          </View>
          {video && (
            <View style={styles.durationChip}>
              <Text style={styles.durationText}>{video ? fmtDuration(video.seconds) : ''}</Text>
            </View>
          )}
          <Text style={styles.playerHint}>
            {video ? 'Video ready' : uploading ? (uploadProgress || 'Uploading...') : 'Pick a video for this Moment'}
          </Text>
        </LinearGradient>

        {/* Replace / pick row */}
        <View style={styles.pickRow}>
          <Pressable onPress={() => pickVideo('library')} disabled={uploading || publishing} style={[styles.replaceBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.replaceText, { color: colors.text }]}>{video ? 'Replace' : 'Choose video'}</Text>
          </Pressable>
          <Pressable onPress={() => pickVideo('camera')} disabled={uploading || publishing} style={[styles.replaceBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.replaceText, { color: colors.text }]}>Record</Text>
          </Pressable>
          {video && (
            <Pressable onPress={() => setVideo(null)} disabled={uploading || publishing} style={styles.removeBtn}>
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          )}
        </View>

        {/* Title */}
        <Text style={[styles.label, { color: colors.muted }]}>Title</Text>
        <SoundTextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder={'Choir session, take 3'}
          placeholderTextColor={colors.muted}
          value={title}
          onChangeText={setTitle}
          maxLength={120}
        />

        {/* Tag */}
        <Text style={[styles.label, { color: colors.muted }]}>Tag</Text>
        <View style={styles.chipRow}>
          {TAGS.map((t) => (
            <Pressable
              key={t}
              onPress={() => {
                impact('light');
                setTag(t);
              }}
              style={[styles.chip, tag === t ? { backgroundColor: GOLD, borderColor: 'transparent' } : { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={{ color: tag === t ? '#111' : colors.muted, fontWeight: '700', fontSize: 13 }}>{t}</Text>
            </Pressable>
          ))}
        </View>

        {/* Who can see it */}
        <Text style={[styles.label, { color: colors.muted }]}>Who can see it</Text>
        <View style={styles.chipRow}>
          {AUDIENCES.map((a) => (
            <Pressable
              key={a}
              onPress={() => {
                impact('light');
                setAudience(a);
              }}
              style={[styles.chip, audience === a ? { backgroundColor: GOLD, borderColor: 'transparent' } : { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={{ color: audience === a ? '#111' : colors.muted, fontWeight: '700', fontSize: 13 }}>{a}</Text>
            </Pressable>
          ))}
        </View>

        {/* How long it lasts */}
        <Text style={[styles.label, { color: colors.muted }]}>How long it lasts</Text>
        <View style={styles.chipRow}>
          {DURATIONS.map((d) => (
            <Pressable
              key={d}
              onPress={() => {
                impact('light');
                setDuration(d);
              }}
              style={[styles.chip, duration === d ? { backgroundColor: GOLD, borderColor: 'transparent' } : { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={{ color: duration === d ? '#111' : colors.muted, fontWeight: '700', fontSize: 13 }}>{d}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={[styles.note, { color: colors.muted }]}>
          {duration === 'Permanent' ? 'Permanent Moments join your Timeline.' : 'Flash Moments disappear after 24 hours.'}
        </Text>

        {/* Post */}
        <View style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>
          <GradientButton
            label={publishing ? 'Posting...' : 'Post Moment'}
            onPress={publish}
            loading={publishing}
            disabled={!canPost || publishing}
            fullWidth
          />
        </View>
        <Text style={[styles.footnote, { color: colors.muted }]}>
          Original, posted by you {'\u00b7'} edits are labeled automatically
        </Text>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { ...typo.h2, fontWeight: '900' },
  draftPill: { borderWidth: 1, borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 3 },
  draftText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  player: { borderRadius: radii.lg, height: 190, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  playCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.24)', alignItems: 'center', justifyContent: 'center' },
  durationChip: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: radii.full, paddingHorizontal: 8, paddingVertical: 3 },
  durationText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  playerHint: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '700', marginTop: 10 },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.lg },
  replaceBtn: { borderWidth: 1, borderRadius: radii.full, paddingHorizontal: 16, paddingVertical: 8 },
  replaceText: { fontWeight: '700', fontSize: 13 },
  removeBtn: { paddingHorizontal: 6, paddingVertical: 8 },
  removeText: { color: '#EF5350', fontWeight: '700', fontSize: 13 },
  label: { fontSize: 12, fontWeight: '800', letterSpacing: 0.4, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, marginBottom: spacing.lg, minHeight: 50 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
  chip: { borderWidth: 1, borderRadius: radii.full, paddingHorizontal: 14, paddingVertical: 8 },
  note: { fontSize: 12, marginTop: -8, marginBottom: spacing.md },
  footnote: { fontSize: 11, textAlign: 'center', marginBottom: spacing.lg },
});
