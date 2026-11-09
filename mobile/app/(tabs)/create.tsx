/** Create chooser
 * Opened by the center (+) tab. Posts (text, images, videos) vs
 * Moments (video only) are different content types in Rally.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, radii, type as typo } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';

export default function CreateChooser() {
  const { colors } = useTheme();
  const { impact } = useHaptics();
  const router = useRouter();

  function go(path: string) {
    impact('medium');
    router.push(path as any);
  }

  return (
    <Screen padded>
      <Text style={[styles.h1, { color: colors.text }]}>Create</Text>
      <Text style={[styles.sub, { color: colors.muted }]}>Posts and Moments are different. Posts are updates for your feed. Moments are short videos.</Text>
      <Pressable onPress={() => go('/compose-post')} style={({ pressed }) => [styles.tile, pressed && { transform: [{ scale: 0.98 }] }]} accessibilityLabel={'New post'}>
        <LinearGradient colors={['#FFA726', '#F57C00'] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tileGrad}>
          <View style={styles.tileIcon}>
            <Ionicons name={'newspaper-outline'} size={24} color={'#111'} />
          </View>
          <View style={styles.tileBody}>
            <Text style={styles.tileTitle}>New post</Text>
            <Text style={styles.tileText}>Text, photos, videos, links and polls for your feed</Text>
          </View>
          <Ionicons name={'chevron-forward'} size={22} color={'rgba(0,0,0,0.6)'} />
        </LinearGradient>
      </Pressable>
      <Pressable onPress={() => go('/compose-moment')} style={({ pressed }) => [styles.tile, pressed && { transform: [{ scale: 0.98 }] }]} accessibilityLabel={'New Moment'}>
        <LinearGradient colors={['#7C4DFF', '#FFA726'] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tileGrad}>
          <View style={styles.tileIcon}>
            <Ionicons name={'play-circle-outline'} size={24} color={'#111'} />
          </View>
          <View style={styles.tileBody}>
            <Text style={styles.tileTitle}>New Moment</Text>
            <Text style={styles.tileText}>A short video, public or flash for 24 hours</Text>
          </View>
          <Ionicons name={'chevron-forward'} size={22} color={'rgba(0,0,0,0.6)'} />
        </LinearGradient>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { ...typo.h2, fontWeight: '900', marginBottom: 6 },
  sub: { fontSize: 13, marginBottom: spacing.lg, lineHeight: 19 },
  tile: { marginBottom: 14 },
  tileGrad: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radii.lg, padding: 16 },
  tileIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' },
  tileBody: { flex: 1 },
  tileTitle: { color: '#111', fontWeight: '900', fontSize: 16 },
  tileText: { color: 'rgba(0,0,0,0.65)', fontSize: 12, fontWeight: '600', marginTop: 2 },
});
