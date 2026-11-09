/** New post - Rally design (exact spec)
 * Feed POSTS: text + images/videos/link + poll. Moments (video only) use
 * /compose-moment. Publishes POST /api/posts.
 */
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, Pressable, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Avatar } from '@/components/ui';
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
const MAX_BASE64 = 25 * 1024 * 1024;
const MAX_MEDIA = 4;

type MediaItem = { url: string; kind: 'image' | 'video' | 'link' };

const SEE = ['Public', 'Followers', 'All supporters', 'Tier supporters'];
const SEE_MAP: Record<string, string> = { Public: 'PUBLIC', Followers: 'FOLLOWERS', 'All supporters': 'SUPPORTERS', 'Tier supporters': 'TIER' };
const COMMENT = ['Everyone', 'Followers', 'Nobody'];
const COMMENT_MAP: Record<string, string> = { Everyone: 'everyone', Followers: 'followers', Nobody: 'nobody' };

export default function ComposePostScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();
  const { success, click, error: errSound } = useSounds();
  const router = useRouter();

  const [me, setMe] = useState<{ displayName: string; avatarUrl?: string } | null>(null);
  const [body, setBody] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [see, setSee] = useState('Public');
  const [tierName, setTierName] = useState('');
  const [comment, setComment] = useState('Everyone');
  const [linkInput, setLinkInput] = useState('');
  const [showLink, setShowLink] = useState(false);
  const [pollOn, setPollOn] = useState(false);
  const [options, setOptions] = useState(['', '']);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    api<{ user?: { displayName: string; avatarUrl?: string } }>('/api/auth/me')
      .then((r) => { setMe((r.user as any) || r as any); })
      .catch(() => {});
  }, []);

  async function uploadOne(asset: ImagePicker.ImagePickerAsset, kind: 'image' | 'video') {
    if (!asset.base64 || asset.base64.length > MAX_BASE64) {
      throw new Error('That file is too large (max 25MB).');
    }
    const mimeType = asset.mimeType || (kind === 'video' ? 'video/mp4' : 'image/jpeg');
    const up = await api<{ media: { url: string } }>('/api/media/upload', {
      method: 'POST',
      body: JSON.stringify({ mimeType, base64: asset.base64 }),
    });
    const raw = up.media.url || '';
    return raw.startsWith('http') ? raw : (await getApiUrl()) + raw;
  }

  async function pickMedia(kind: 'image' | 'video') {
    if (uploading || publishing) return;
    if (media.length >= MAX_MEDIA) {
      Alert.alert('Attachments', 'Up to 4 attachments per post.');
      return;
    }
    impact('medium');
    click();
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Rally needs photo library access to attach media.');
      return;
    }
    try {
      setUploading(true);
      await runWithAppTask(async () => {
        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: kind === 'image' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
          quality: 0.7,
          base64: true,
          selectionLimit: kind === 'image' ? MAX_MEDIA - media.length : 1,
          allowsMultipleSelection: kind === 'image',
        });
        if (res.canceled || !res.assets || res.assets.length === 0) return;
        const urls: MediaItem[] = [];
        for (const asset of res.assets.slice(0, MAX_MEDIA - media.length)) {
          urls.push({ url: await uploadOne(asset, kind), kind });
        }
        setMedia((m) => [...m, ...urls]);
        success();
        impact('success');
      });
    } catch (e: any) {
      errSound();
      impact('error');
      Alert.alert('Upload', e.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  function addLink() {
    const v = linkInput.trim();
    if (!v) { setShowLink(false); return; }
    const url = /^https?:\/\//.test(v) ? v : 'https://' + v;
    if (media.length >= MAX_MEDIA) {
      Alert.alert('Attachments', 'Up to 4 attachments per post.');
      return;
    }
    impact('light');
    setMedia((m) => [...m, { url, kind: 'link' }]);
    setLinkInput('');
    setShowLink(false);
  }

  function setOption(i: number, v: string) {
    setOptions((o) => o.map((x, j) => (j === i ? v : x)));
  }

  async function publish() {
    if (!body.trim()) return;
    setPublishing(true);
    impact('medium');
    try {
      const filled = options.map((o) => o.trim()).filter(Boolean);
      const poll = pollOn && filled.length >= 2 ? { options: filled, lengthHours: 24 } : undefined;
      await runWithAppTask(async () => {
        await api('/api/posts', {
          method: 'POST',
          body: JSON.stringify({
            body: body.trim(),
            mediaUrls: media.map((m) => m.url),
            visibility: SEE_MAP[see],
            tierName: see === 'Tier supporters' ? tierName.trim() || undefined : undefined,
            commentPolicy: COMMENT_MAP[comment],
            poll,
          }),
        });
      });
      success();
      impact('success');
      Alert.alert('Posted', 'Your post is live.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      errSound();
      impact('error');
      Alert.alert('Could not post', e.message || 'Please try again.');
    } finally {
      setPublishing(false);
    }
  }

  const canPost = !!body.trim() && !uploading;
  const name = (me && me.displayName) || 'You';

  return (
    <SwipeBack pullDown>
      <Screen>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel={'Back'}>
            <Ionicons name={'chevron-back'} size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>New post</Text>
          <View style={styles.spacer} />
          <Pressable
            onPress={publish}
            disabled={!canPost || publishing}
            style={[styles.postBtn, (!canPost || publishing) && { opacity: 0.45 }]}
            accessibilityLabel={'Post'}
          >
            <Text style={styles.postBtnText}>{publishing ? 'Posting...' : 'Post'}</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
          {/* Author + body */}
          <View style={styles.authorRow}>
            <Avatar name={name} uri={me && me.avatarUrl} size={44} ring />
            <SoundTextInput
              style={[styles.bodyInput, { color: colors.text }]}
              placeholder={'Share something with your fans...'}
              placeholderTextColor={colors.muted}
              value={body}
              onChangeText={setBody}
              multiline
            />
          </View>

          {/* Media previews */}
          {media.length > 0 && (
            <View style={styles.previewRow}>
              {media.map((m, i) => (
                <View key={i} style={[styles.previewChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name={m.kind === 'link' ? 'link' : m.kind === 'video' ? 'videocam' : 'image'} size={14} color={GOLD} />
                  <Text style={[styles.previewText, { color: colors.text }]} numberOfLines={1}>{m.kind === 'link' ? m.url.replace(/^https?:\/\//, '') : (m.kind === 'video' ? 'Video' : 'Photo') + ' ' + (i + 1)}</Text>
                  <Pressable onPress={() => { impact('light'); setMedia((arr) => arr.filter((_, j) => j !== i)); }} hitSlop={8} accessibilityLabel={'Remove attachment'}>
                    <Ionicons name={'close'} size={14} color={colors.muted} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Link input */}
          {showLink && (
            <View style={[styles.linkRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name={'link-outline'} size={16} color={colors.muted} />
              <SoundTextInput
                style={[styles.linkInput, { color: colors.text }]}
                placeholder={'Paste a link...'}
                placeholderTextColor={colors.muted}
                value={linkInput}
                onChangeText={setLinkInput}
                onSubmitEditing={addLink}
                returnKeyType={'done'}
                autoCapitalize={'none'}
                autoCorrect={false}
              />
              <Pressable onPress={addLink} hitSlop={8} accessibilityLabel={'Add link'}>
                <Ionicons name={'add'} size={18} color={GOLD} />
              </Pressable>
            </View>
          )}

          {/* POLL block */}
          {pollOn && (
            <View style={[styles.pollBlock, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.pollHeader}>
                <Text style={[styles.pollLabel, { color: colors.text }]}>POLL</Text>
                <Pressable onPress={() => { impact('light'); setPollOn(false); setOptions(['', '']); }} hitSlop={8} accessibilityLabel={'Remove poll'}>
                  <Ionicons name={'close'} size={16} color={colors.muted} />
                </Pressable>
              </View>
              {options.map((o, i) => (
                <View key={i} style={[styles.pollOption, { borderColor: colors.border }]}>
                  <SoundTextInput
                    style={[styles.pollInput, { color: colors.text }]}
                    placeholder={'Option ' + (i + 1)}
                    placeholderTextColor={colors.muted}
                    value={o}
                    onChangeText={(v: string) => setOption(i, v)}
                    maxLength={80}
                  />
                </View>
              ))}
              {options.length < 4 && (
                <Pressable onPress={() => { impact('light'); setOptions((o) => [...o, '']); }} style={styles.addOption}>
                  <Text style={styles.addOptionText}>Add option</Text>
                </Pressable>
              )}
              <View style={[styles.pollLen, { borderColor: colors.border }]}>
                <Ionicons name={'time-outline'} size={14} color={colors.muted} />
                <Text style={[styles.pollLenText, { color: colors.muted }]}>24 hours</Text>
              </View>
            </View>
          )}

          {/* Attachment circle buttons */}
          <View style={styles.attachRow}>
            <Pressable onPress={() => pickMedia('image')} disabled={uploading} style={[styles.circleBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} accessibilityLabel={'Attach image'}>
              <Ionicons name={'image-outline'} size={20} color={colors.text} />
            </Pressable>
            <Pressable onPress={() => pickMedia('video')} disabled={uploading} style={[styles.circleBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} accessibilityLabel={'Attach video'}>
              <Ionicons name={'videocam-outline'} size={20} color={colors.text} />
            </Pressable>
            <Pressable onPress={() => { impact('light'); setShowLink((s) => !s); }} style={[styles.circleBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} accessibilityLabel={'Attach link'}>
              <Ionicons name={'link-outline'} size={20} color={colors.text} />
            </Pressable>
            <Pressable onPress={() => { impact('light'); setPollOn((p) => !p); if (!pollOn) setOptions(['', '']); }} style={[styles.circleBtn, pollOn ? { backgroundColor: GOLD, borderColor: 'transparent' } : { backgroundColor: colors.surface, borderColor: colors.border }]} accessibilityLabel={'Toggle poll'}>
              <Ionicons name={'bar-chart-outline'} size={20} color={pollOn ? '#111' : colors.text} />
            </Pressable>
          </View>

          {/* Who can see it */}
          <Text style={[styles.label, { color: colors.muted }]}>Who can see it</Text>
          <View style={styles.chipRow}>
            {SEE.map((s) => (
              <Pressable
                key={s}
                onPress={() => { impact('light'); setSee(s); }}
                style={[styles.chip, see === s ? { backgroundColor: GOLD, borderColor: 'transparent' } : { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={{ color: see === s ? '#111' : colors.muted, fontWeight: '700', fontSize: 13 }}>{s}</Text>
              </Pressable>
            ))}
          </View>
          {see === 'Tier supporters' && (
            <SoundTextInput
              style={[styles.tierInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder={'Chorister and above'}
              placeholderTextColor={colors.muted}
              value={tierName}
              onChangeText={setTierName}
              maxLength={60}
            />
          )}

          {/* Who can comment */}
          <Text style={[styles.label, { color: colors.muted }]}>Who can comment</Text>
          <View style={styles.chipRow}>
            {COMMENT.map((c) => (
              <Pressable
                key={c}
                onPress={() => { impact('light'); setComment(c); }}
                style={[styles.chip, comment === c ? { backgroundColor: GOLD, borderColor: 'transparent' } : { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={{ color: comment === c ? '#111' : colors.muted, fontWeight: '700', fontSize: 13 }}>{c}</Text>
              </Pressable>
            ))}
          </View>

          {/* Language note */}
          <View style={styles.globeRow}>
            <Ionicons name={'globe-outline'} size={15} color={colors.muted} />
            <Text style={[styles.globeText, { color: colors.muted }]}>Language detected: English. Fans who read other languages can translate it in one tap.</Text>
          </View>
        </ScrollView>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { ...typo.h2, fontWeight: '900', flex: 1 },
  spacer: { flex: 1 },
  postBtn: { backgroundColor: GOLD, borderRadius: radii.full, paddingHorizontal: 20, paddingVertical: 9 },
  postBtnText: { color: '#111', fontWeight: '900', fontSize: 14 },
  authorRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: spacing.md },
  bodyInput: { flex: 1, minHeight: 110, fontSize: 16, paddingTop: 10 },
  previewRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  previewChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 6, maxWidth: 200 },
  previewText: { fontSize: 12, fontWeight: '600', flexShrink: 1 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 9, marginBottom: spacing.md },
  linkInput: { flex: 1, fontSize: 14 },
  pollBlock: { borderWidth: 1, borderRadius: radii.md, padding: 14, marginBottom: spacing.md },
  pollHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  pollLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  pollOption: { borderWidth: 1, borderRadius: radii.full, paddingHorizontal: 14, paddingVertical: 4, marginBottom: 8 },
  pollInput: { fontSize: 14, minHeight: 36 },
  addOption: { paddingVertical: 4 },
  addOptionText: { color: GOLD, fontWeight: '800', fontSize: 13 },
  pollLen: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderWidth: 1, borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 4, marginTop: 4 },
  pollLenText: { fontSize: 12, fontWeight: '700' },
  attachRow: { flexDirection: 'row', gap: 14, marginBottom: spacing.lg },
  circleBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12, fontWeight: '800', letterSpacing: 0.4, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
  chip: { borderWidth: 1, borderRadius: radii.full, paddingHorizontal: 14, paddingVertical: 8 },
  tierInput: { borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: spacing.lg, marginTop: -8 },
  globeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  globeText: { fontSize: 12, flex: 1 },
});
