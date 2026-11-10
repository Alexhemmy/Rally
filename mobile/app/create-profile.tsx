/** Create Profile - Rally design (screen 56)
 * Step 4 of 6. Avatar placeholder with initials, display name,
 * username with availability hint, optional bio with 120 counter.
 * Saves via PATCH /api/users/me then continues to Follow Favorites.
 */
import { useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GradientButton } from '@/components/ui';
import { SoundTextInput } from '@/components/SoundTextInput';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { spacing, radii, type as typo } from '@/constants/theme';
import { api } from '@/lib/api';

const GOLD = '#FFA726';
const GREEN = '#34D399';

function Bar() {
  return (
    <View style={styles.track}>
      <View style={{ flex: 0.66, backgroundColor: GOLD, borderRadius: 2 }} />
      <View style={{ flex: 0.34 }} />
    </View>
  );
}

export default function CreateProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const { success, error: errSound } = useSounds();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const userOk = /^[a-zA-Z0-9._]{3,30}$/.test(username);
  const initials = name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '??';

  async function next() {
    if (saving) return;
    if (!name.trim()) { setErr('Enter a display name.'); errSound(); impact('error'); return; }
    if (!userOk) { setErr('Usernames use letters, numbers, dots and underscores.'); errSound(); impact('error'); return; }
    setSaving(true);
    setErr('');
    impact('medium');
    try {
      await api('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ displayName: name.trim(), bio: bio.trim() }),
      });
      success();
      impact('success');
      router.replace(('/follow-favorites?name=' + encodeURIComponent(name.trim())) as any);
    } catch (e: any) {
      errSound();
      setErr(e.message || 'Could not save your profile.');
      setSaving(false);
    }
  }

  return (
    <SwipeBack pullDown>
      <Screen>
        <Bar />
        <Text style={[styles.h1, { color: colors.text }]}>Set up your profile</Text>
        <Text style={[styles.sub, { color: colors.muted }]}>This is how other fans see you. You can change it anytime.</Text>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
          <View style={styles.avatarWrap}>
            <LinearGradient colors={['#ef5350', '#FFA726'] as [string, string]} style={styles.avatar}>
              <Text style={styles.initials}>{initials}</Text>
            </LinearGradient>
            <Pressable onPress={() => impact('light')} style={styles.addPhoto}>
              <Ionicons name={'camera'} size={16} color={colors.muted} />
              <Text style={[styles.addPhotoText, { color: colors.muted }]}>Add a photo</Text>
            </Pressable>
          </View>

          <Text style={[styles.label, { color: colors.muted }]}>Display name</Text>
          <SoundTextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholder={'Tola Okafor'}
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={(t: string) => { setName(t); setErr(''); }}
            maxLength={80}
          />

          <Text style={[styles.label, { color: colors.muted }]}>Username</Text>
          <View style={[styles.userRow, { borderColor: userOk ? GREEN : colors.border, backgroundColor: colors.surface }]}>
            <Text style={{ color: colors.muted, fontWeight: '800', fontSize: 15 }}>@</Text>
            <SoundTextInput
              style={styles.userInput}
              placeholder={'username'}
              placeholderTextColor={colors.muted}
              value={username}
              onChangeText={(t: string) => { setUsername(t.replace(/[^a-zA-Z0-9._]/g, '')); setErr(''); }}
              autoCapitalize={'none'}
              maxLength={30}
            />
            {userOk ? <Ionicons name={'checkmark-circle'} size={20} color={GREEN} /> : null}
          </View>
          <Text style={[styles.helper, { color: userOk ? GREEN : colors.muted }]}>
            {userOk ? 'Available. Letters, numbers, dots and underscores.' : 'Letters, numbers, dots and underscores.'}
          </Text>

          <Text style={[styles.label, { color: colors.muted }]}>Bio (optional)</Text>
          <SoundTextInput
            style={[styles.bio, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholder={'Tell fans what you love'}
            placeholderTextColor={colors.muted}
            value={bio}
            onChangeText={setBio}
            maxLength={120}
            multiline
          />
          <Text style={[styles.helper, { color: colors.muted }]}>{bio.length} / 120</Text>

          {err ? <Text style={[styles.err, { color: colors.danger }]}>{err}</Text> : null}

          <GradientButton label={'Continue'} onPress={next} loading={saving} fullWidth />
        </ScrollView>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', height: 4, borderRadius: 2, backgroundColor: 'rgba(128,128,128,0.25)', marginBottom: spacing.lg },
  h1: { ...typo.h1, marginBottom: 4 },
  sub: { fontSize: 13, lineHeight: 19, marginBottom: spacing.lg },
  avatarWrap: { alignItems: 'center', marginBottom: spacing.lg },
  avatar: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#fff', fontSize: 32, fontWeight: '900' },
  addPhoto: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  addPhotoText: { fontSize: 13, fontWeight: '700' },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, marginBottom: 16, minHeight: 52 },
  userRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 14, minHeight: 52, gap: 4 },
  userInput: { flex: 1, fontSize: 15, paddingVertical: 13, color: '#fff' },
  helper: { fontSize: 12, marginTop: -8, marginBottom: 16, lineHeight: 16 },
  bio: { borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, minHeight: 90, textAlignVertical: 'top' },
  err: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
});
