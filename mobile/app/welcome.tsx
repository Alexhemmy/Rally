/** Welcome - Rally design (screen 9)
 * First screen for new installs and signed-out visitors.
 * Get started, I already have an account, or browse read-only.
 */
import { Text, StyleSheet, View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GradientButton } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii, type as typo } from '@/constants/theme';

const GOLD = '#FFA726';
const PURPLE = '#7C4DFF';

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();

  return (
    <Screen padded>
      <LinearGradient colors={[PURPLE, GOLD] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.logoBubble}>
          <Text style={styles.logoText}>R</Text>
        </View>
        <Text style={styles.h1}>Rally</Text>
        <Text style={styles.tag}>Your people. Your platform.</Text>
        <Text style={styles.sub}>Support the Favorites you love with Tokens, Moments and live sessions. Money never changes who gets seen.</Text>
      </LinearGradient>

      <GradientButton
        label={'Get started'}
        fullWidth
        onPress={() => { impact('medium'); router.push('/signup'); }}
      />
      <View style={{ marginTop: 12 }}>
        <GradientButton
          label={'I already have an account'}
          variant={'ghost'}
          fullWidth
          onPress={() => { impact('light'); router.push('/login'); }}
        />
      </View>
      <Pressable onPress={() => { impact('light'); router.push('/explore'); }} style={styles.browse} accessibilityLabel={'Browse Favorites without an account'}>
        <Text style={[styles.browseText, { color: GOLD }]}>Browse Favorites without an account</Text>
      </Pressable>
      <Text style={[styles.footer, { color: colors.muted }]}>
        Rally never asks for your password or a code in a message.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radii.lg, padding: 28, alignItems: 'center', marginBottom: spacing.xl },
  logoBubble: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#fff', fontSize: 32, fontWeight: '900' },
  h1: { ...typo.h1, color: '#fff', marginTop: 14 },
  tag: { color: '#fff', fontWeight: '800', fontSize: 15, marginTop: 2 },
  sub: { color: 'rgba(255,255,255,0.9)', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 10 },
  browse: { alignItems: 'center', paddingVertical: 14, marginTop: 6 },
  browseText: { fontWeight: '800', fontSize: 14 },
  footer: { textAlign: 'center', fontSize: 12, marginTop: spacing.lg, lineHeight: 17 },
});
