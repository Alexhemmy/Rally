/** Edit Page - Favorite page editor (mock 04)
 * Avatar with camera badge, display name, bio, specialty chips with
 * Add, pinned Moment card, and links. Name, bio and avatar persist
 * via PATCH /api/users/me. Specialties and links have no backend
 * fields yet, so they persist locally via AsyncStorage.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView, TextInput, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { spacing, radii } from '@/constants/theme';
import { api } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const MAX_BASE64 = 10 * 1024 * 1024;

type Me = { displayName: string; bio?: string | null; avatarUrl?: string | null; handle?: string };
type Moment = { id: string; title: string; likeCount?: number };

export default function EditPageScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const { success, click, error: errSound } = useSounds();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [links, setLinks] = useState('');
  const [pinned, setPinned] = useState<Moment | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const me = await api<{ user: Me }>('/api/auth/me');
      const u = (me.user as any) || (me as any);
      setName(u.displayName || '');
      setBio(u.bio || '');
      setAvatar(u.avatarUrl || null);
    } catch {
      // offline - keep local edits
    }
    try {
      const raw = await AsyncStorage.getItem('rally.specialties');
      if (raw) {
        const p = JSON.parse(raw);
        setSpecialties([p.primary].concat(p.secondaries || []).filter(Boolean));
      }
    } catch { /* none saved */ }
    try {
      const handle = (await AsyncStorage.getItem('rally.myHandle')) || '';
      const m = await api<{ moments: Moment[] }>('/api/moments/favorite/' + handle, { skipAuth: true });
      setPinned(m.moments && m.moments[0] ? m.moments[0] : null);
    } catch { /* no moments yet */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function pickAvatar() {
    if (uploading) return;
    impact('medium');
    click();
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Rally needs photo library access to change your photo.');
      return;
    }
    try {
      setUploading(true);
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        base64: true,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (res.canceled || !res.assets || res.assets.length === 0) return;
      const asset = res.assets[0];
      if (!asset.base64 || asset.base64.length > MAX_BASE64) {
        throw new Error('That file is too large (max 10MB).');
      }
      const up = await api<{ media: { url: string } }>('/api/media/upload', {
        method: 'POST',
        body: JSON.stringify({ mimeType: asset.mimeType || 'image/jpeg', base64: asset.base64 }),
      });
      setAvatar(up.media.url || null);
      success();
      impact('success');
    } catch (e: any) {
      errSound();
      impact('error');
      Alert.alert('Upload', e.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    impact('medium');
    try {
      const body: Record<string, unknown> = {};
      if (name.trim()) body.displayName = name.trim();
      body.bio = bio.trim();
      if (avatar) body.avatarUrl = avatar;
      await api('/api/users/me', { method: 'PATCH', body: JSON.stringify(body) });
      try {
        await AsyncStorage.setItem('rally.pageLinks', links.trim());
      } catch { /* local only */ }
      success();
      impact('success');
      router.back();
    } catch (e: any) {
      errSound();
      impact('error');
      Alert.alert('Save', e.message || 'Could not save your page.');
    } finally {
      setSaving(false);
    }
  }

  const initials = name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'MA';

  function addSpecialty() {
    impact('light');
    router.push('/setup-specialty');
  }

  return (
    <SwipeBack>
      <Screen>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Edit page</Text>
          <Pressable onPress={save} disabled={saving || uploading} style={[styles.saveBtn, (saving || uploading) && { opacity: 0.5 }]} accessibilityLabel="Save">
            <Text style={[styles.saveText, { color: GOLD }]}>{saving ? 'Saving...' : 'Save'}</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <LinearGradient
              colors={[GOLD, '#ef5350'] as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
            </LinearGradient>
            <Pressable onPress={pickAvatar} style={styles.camBadge} accessibilityLabel="Change photo">
              <Ionicons name="camera" size={14} color="#111" />
            </Pressable>
          </View>

          {/* Display name */}
          <Text style={[styles.label, { color: colors.muted }]}>Display name</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
            placeholder="Mia Adebayo"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
            maxLength={80}
          />

          {/* Bio */}
          <Text style={[styles.label, { color: colors.muted }]}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
            placeholder="Worship leader and songwriter from Lagos."
            placeholderTextColor={colors.muted}
            value={bio}
            onChangeText={setBio}
            multiline
            maxLength={500}
          />

          {/* Specialties */}
          <Text style={[styles.label, { color: colors.muted }]}>Specialties</Text>
          <View style={styles.chipRow}>
            {specialties.map((s) => (
              <View key={s} style={[styles.specChip, { borderColor: GOLD, backgroundColor: GOLD + '18' }]}>
                <Text style={{ color: GOLD, fontWeight: '800', fontSize: 14 }}>{s}</Text>
              </View>
            ))}
            <Pressable onPress={addSpecialty} style={[styles.specChip, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]} accessibilityLabel="Add specialty">
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }}>+ Add</Text>
            </Pressable>
          </View>

          {/* Pinned Moment */}
          <Text style={[styles.label, { color: colors.muted }]}>Pinned Moment</Text>
          <Pressable
            onPress={() => router.push('/compose-moment')}
            style={[styles.pinnedCard, { borderColor: colors.border }]}
            accessibilityLabel="Pinned Moment"
          >
            <LinearGradient
              colors={[GOLD_DEEP, GOLD] as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.pinnedThumb}
            >
              <Ionicons name="videocam" size={20} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text numberOfLines={1} style={[styles.pinnedTitle, { color: colors.text }]}>
                {pinned ? pinned.title : 'No Moments yet'}
              </Text>
              <Text style={[styles.pinnedSub, { color: colors.muted }]}>
                {pinned ? ((pinned.likeCount || 0) >= 1000 ? ((pinned.likeCount || 0) / 1000).toFixed(1) + 'K likes' : (pinned.likeCount || 0) + ' likes') : 'Post one to pin it here'}
              </Text>
            </View>
            <Text style={{ color: GOLD, fontWeight: '900', fontSize: 15 }}>{pinned ? 'Change' : 'Add'}</Text>
          </Pressable>

          {/* Links */}
          <Text style={[styles.label, { color: colors.muted }]}>Links</Text>
          <View style={[styles.linkRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Ionicons name="link-outline" size={18} color={colors.muted} />
            <TextInput
              style={[styles.linkInput, { color: colors.text }]}
              placeholder="youtube.com/@miasings"
              placeholderTextColor={colors.muted}
              value={links}
              onChangeText={setLinks}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>
          <Text style={[styles.helper, { color: colors.muted }]}>
            Separate multiple links with commas. Links live on your page, below the bio.
          </Text>
        </ScrollView>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  saveBtn: { paddingHorizontal: 6, paddingVertical: 6 },
  saveText: { fontWeight: '900', fontSize: 16 },
  avatarWrap: { alignItems: 'center', marginVertical: spacing.md },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 110, height: 110 },
  avatarText: { color: '#fff', fontSize: 38, fontWeight: '900' },
  camBadge: {
    position: 'absolute',
    right: '32%',
    bottom: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: GOLD,
    borderWidth: 3,
    borderColor: '#141418',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 15, fontWeight: '800', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    marginBottom: spacing.md,
    minHeight: 52,
  },
  bioInput: { minHeight: 100, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: spacing.md },
  specChip: { borderWidth: 1.5, borderRadius: radii.full, paddingHorizontal: 16, paddingVertical: 10 },
  pinnedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radii.lg,
    padding: 12,
    marginBottom: spacing.md,
  },
  pinnedThumb: { width: 52, height: 52, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  pinnedTitle: { fontSize: 16, fontWeight: '900' },
  pinnedSub: { fontSize: 13, marginTop: 2 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  linkInput: { flex: 1, fontSize: 16, paddingVertical: 13 },
  helper: { fontSize: 12, marginTop: 8, lineHeight: 17 },
});
