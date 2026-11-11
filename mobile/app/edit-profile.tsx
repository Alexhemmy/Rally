/** Edit Profile (UX 40) - Rally design
 * Display name, bio and avatar save to the real account (PATCH
 * /api/users/me, avatar via /api/media/upload). Usernames cannot be
 * changed yet. Visibility toggles are saved on this device for now.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, TextInput, Switch, ScrollView, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const TEAL = '#34D399';

type Prefs = { showLevel: boolean; showFollows: boolean; showCity: boolean };
const DEFAULT_PREFS: Prefs = { showLevel: true, showFollows: false, showCity: true };

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0] || 'R')[0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [handle, setHandle] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    if (getToken()) {
      try {
        const r: any = await api('/api/auth/me');
        const u = r.user;
        if (u) {
          setName(u.displayName || '');
          setBio(u.bio || '');
          setHandle(u.handle || '');
          setAvatarUrl(u.avatarUrl || null);
        }
      } catch { /* offline */ }
    }
    try {
      const raw = await AsyncStorage.getItem('rally.profilePrefs');
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
    } catch { /* local only */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function savePrefs(next: Prefs) {
    setPrefs(next);
    try {
      await AsyncStorage.setItem('rally.profilePrefs', JSON.stringify(next));
    } catch { /* local only */ }
  }

  async function pickAvatar() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Allow photo access to change your avatar.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });
      if (res.canceled || !res.assets || !res.assets[0] || !res.assets[0].base64) return;
      const asset = res.assets[0];
      setUploading(true);
      setMsg(null);
      const r: any = await api('/api/media/upload', {
        method: 'POST',
        body: JSON.stringify({ mimeType: asset.mimeType || 'image/jpeg', base64: asset.base64 }),
      });
      setAvatarUrl(r.media.url);
      setMsg({ type: 'success', text: 'Photo ready — tap Save to apply' });
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!name.trim()) {
      setMsg({ type: 'error', text: 'Display name cannot be empty' });
      return;
    }
    setSaving(true);
    setMsg(null);
    impact('medium');
    try {
      const body: any = { displayName: name.trim(), bio: bio.trim() };
      if (avatarUrl) body.avatarUrl = avatarUrl;
      await api('/api/users/me', { method: 'PATCH', body: JSON.stringify(body) });
      impact('success');
      Alert.alert('Profile saved', 'Your changes are live.');
      router.back();
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SwipeBack>
      <Screen>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Edit profile</Text>
          <Pressable onPress={save} disabled={saving} hitSlop={10} accessibilityLabel="Save">
            <Text style={{ color: GOLD, fontWeight: '900', fontSize: 16 }}>{saving ? 'Saving…' : 'Save'}</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {msg ? (
            <Text style={{ color: msg.type === 'success' ? TEAL : '#EF5350', fontSize: 13, fontWeight: '700', marginBottom: spacing.sm }}>
              {msg.text}
            </Text>
          ) : null}

          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <Pressable onPress={pickAvatar} accessibilityLabel="Change photo">
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: '#AB47BC' }]}>
                  <Text style={styles.avatarText}>{name ? initials(name) : 'R'}</Text>
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Ionicons name={uploading ? 'hourglass-outline' : 'camera-outline'} size={15} color="#111" />
              </View>
            </Pressable>
          </View>

          {/* Display name */}
          <Text style={[styles.label, { color: colors.muted }]}>Display name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.muted}
            maxLength={80}
          />

          {/* Username (read-only for now) */}
          <Text style={[styles.label, { color: colors.muted }]}>Username</Text>
          <View style={[styles.input, styles.usernameInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={{ color: colors.muted, fontSize: 16 }}>@</Text>
            <Text style={{ color: colors.text, fontSize: 16, marginLeft: 8 }}>{handle}</Text>
          </View>
          <Text style={[styles.hint, { color: colors.muted }]}>Usernames cannot be changed yet.</Text>

          {/* Bio */}
          <Text style={[styles.label, { color: colors.muted }]}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell fans about you"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={500}
          />

          {/* Visibility toggles (on-device for now) */}
          <View style={styles.toggleCard}>
            <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
              <Ionicons name="trophy-outline" size={20} color={GOLD} />
              <Text style={[styles.toggleLabel, { color: colors.text }]}>Show my level</Text>
              <Switch
                value={prefs.showLevel}
                onValueChange={(v) => savePrefs({ ...prefs, showLevel: v })}
                trackColor={{ true: TEAL, false: colors.surfaceElevated }}
              />
            </View>
            <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
              <Ionicons name="heart" size={20} color={GOLD_DEEP} />
              <Text style={[styles.toggleLabel, { color: colors.text }]}>Show Favorites I follow</Text>
              <Switch
                value={prefs.showFollows}
                onValueChange={(v) => savePrefs({ ...prefs, showFollows: v })}
                trackColor={{ true: TEAL, false: colors.surfaceElevated }}
              />
            </View>
            <View style={styles.toggleRow}>
              <Ionicons name="location-outline" size={20} color={GOLD_DEEP} />
              <Text style={[styles.toggleLabel, { color: colors.text }]}>Show my city</Text>
              <Switch
                value={prefs.showCity}
                onValueChange={(v) => savePrefs({ ...prefs, showCity: v })}
                trackColor={{ true: TEAL, false: colors.surfaceElevated }}
              />
            </View>
          </View>
          <Text style={[styles.hint, { color: colors.muted }]}>
            Visibility choices are saved on this device for now — server sync is coming.
          </Text>
        </ScrollView>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  h1: { fontSize: 18, fontWeight: '900' },
  avatarWrap: { alignItems: 'center', marginVertical: spacing.md },
  avatar: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 36 },
  cameraBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#111',
  },
  label: { fontSize: 13, fontWeight: '800', marginBottom: 8, marginTop: spacing.sm },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  usernameInput: { flexDirection: 'row', alignItems: 'center' },
  bioInput: { minHeight: 100, textAlignVertical: 'top', paddingTop: 14 },
  hint: { fontSize: 12, marginTop: 6 },
  toggleCard: { marginTop: spacing.lg, borderRadius: radii.lg, overflow: 'hidden' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toggleLabel: { flex: 1, fontSize: 15, fontWeight: '700' },
});
