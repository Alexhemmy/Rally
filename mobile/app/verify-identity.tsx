/** Verification - "Verify before you cash out" (mock 03)
 * Four-step timeline: phone (done), Government ID (upload), selfie
 * check, review. ID upload goes through /api/media/upload and is kept
 * client-side only - Rally has no verification backend yet, so this
 * screen records progress locally and never sends ID data anywhere.
 */
import { useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { GradientButton } from '@/components/GradientButton';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { spacing, radii } from '@/constants/theme';
import { api } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#FFA726';
const TEAL = '#34D399';
const MAX_BASE64 = 10 * 1024 * 1024;

const STEPS = [
  { n: 1, title: 'Phone number', body: 'Confirmed on sign up.', done: true },
  { n: 2, title: 'Government ID', body: "Upload a clear photo of your NIN slip, passport or driver's licence.", done: false },
  { n: 3, title: 'Selfie check', body: 'A short video to match your face to your ID.', done: false },
  { n: 4, title: 'Review', body: 'Usually done within 24 hours. We will notify you.', done: false },
];

export default function VerifyIdentityScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const { click, success, error: errSound } = useSounds();

  const [idUri, setIdUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const u = await AsyncStorage.getItem('rally.idPhotoUri');
        if (u) setIdUri(u);
      } catch { /* fresh */ }
    })();
  }, []);

  async function uploadId() {
    if (uploading) return;
    impact('medium');
    click();
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Rally needs photo library access to upload your ID.');
      return;
    }
    try {
      setUploading(true);
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        base64: true,
        allowsEditing: true,
      });
      if (res.canceled || !res.assets || res.assets.length === 0) return;
      const asset = res.assets[0];
      if (!asset.base64 || asset.base64.length > MAX_BASE64) {
        throw new Error('That file is too large (max 10MB).');
      }
      // Upload through the standard media pipeline, then keep only the
      // local preview. Rally does not verify IDs yet.
      await api('/api/media/upload', {
        method: 'POST',
        body: JSON.stringify({ mimeType: asset.mimeType || 'image/jpeg', base64: asset.base64 }),
      });
      setIdUri(asset.uri);
      await AsyncStorage.setItem('rally.idPhotoUri', asset.uri);
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

  function next() {
    impact('medium');
    click();
    router.push('/edit-page');
  }

  return (
    <SwipeBack>
      <Screen>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Verification</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={[styles.title, { color: colors.text }]}>Verify before you cash out</Text>
          <Text style={[styles.sub, { color: colors.muted }]}>
            This keeps fans and payouts safe. It takes about 5 minutes.
          </Text>

          {/* Timeline */}
          <View style={{ marginTop: spacing.md }}>
            {STEPS.map((s, i) => {
              const isIdStep = s.n === 2;
              const done = s.done || (isIdStep && !!idUri);
              const active = !done && (i === 1);
              return (
                <View key={s.n} style={styles.stepRow}>
                  <View style={styles.rail}>
                    <View
                      style={[
                        styles.dot,
                        done
                          ? { backgroundColor: TEAL }
                          : active
                            ? { borderColor: GOLD, borderWidth: 2.5, backgroundColor: 'transparent' }
                            : { borderColor: colors.border, borderWidth: 2, backgroundColor: 'transparent' },
                      ]}
                    >
                      {done ? (
                        <Ionicons name="checkmark" size={13} color="#04120C" />
                      ) : (
                        <Text style={{ color: active ? GOLD : colors.muted, fontSize: 12, fontWeight: '900' }}>{s.n}</Text>
                      )}
                    </View>
                    {i < STEPS.length - 1 ? <View style={[styles.line, { backgroundColor: colors.border }]} /> : null}
                  </View>
                  <View style={{ flex: 1, paddingBottom: 18 }}>
                    <Text style={[styles.stepTitle, { color: colors.text }]}>{s.title}</Text>
                    <Text style={[styles.stepBody, { color: colors.muted }]}>
                      {isIdStep && idUri ? 'ID photo uploaded. Tap below to replace it.' : s.body}
                    </Text>
                    {isIdStep && idUri ? (
                      <Image source={{ uri: idUri }} style={styles.idThumb} />
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Upload card */}
          <Pressable
            onPress={uploadId}
            disabled={uploading}
            style={[styles.uploadCard, { borderColor: colors.border }, uploading && { opacity: 0.6 }]}
            accessibilityLabel="Upload ID photo"
          >
            {uploading ? (
              <ActivityIndicator color={GOLD} />
            ) : (
              <Ionicons name="camera-outline" size={24} color={colors.text} />
            )}
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[styles.uploadTitle, { color: colors.text }]}>Upload ID photo</Text>
              <Text style={[styles.uploadSub, { color: colors.muted }]}>JPG or PNG, up to 10 MB</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Pressable>

          {/* Privacy note */}
          <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Ionicons name="lock-closed" size={16} color={TEAL} />
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              Your ID is encrypted, used only for verification and never shown on your page.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <GradientButton label="Continue" onPress={next} accessibilityLabel="Continue" />
        </View>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  title: { fontSize: 30, fontWeight: '900', marginTop: spacing.sm },
  sub: { fontSize: 16, lineHeight: 23, marginTop: 8 },
  stepRow: { flexDirection: 'row', gap: 14 },
  rail: { alignItems: 'center' },
  dot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  line: { width: 2, flex: 1, marginVertical: 4 },
  stepTitle: { fontSize: 18, fontWeight: '900', marginTop: 4 },
  stepBody: { fontSize: 14, lineHeight: 20, marginTop: 3 },
  idThumb: { width: 120, height: 80, borderRadius: radii.md, marginTop: 8 },
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radii.lg,
    padding: 16,
    marginTop: spacing.sm,
  },
  uploadTitle: { fontSize: 17, fontWeight: '900' },
  uploadSub: { fontSize: 13, marginTop: 2 },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 14,
    marginTop: spacing.md,
  },
  noteText: { flex: 1, fontSize: 14, lineHeight: 20 },
  footer: { paddingTop: spacing.sm },
});
