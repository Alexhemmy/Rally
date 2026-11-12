/** Splash - Rally design (screen 01)
 * App entry. Signed-out visitors see the brand, then the intro tour.
 * Signed-in users go straight to the tabs.
 */
import { useEffect } from 'react';
import { Text, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { getToken } from '@/lib/api';
import { spacing, type as typo } from '@/constants/theme';

export default function Splash() {
  const router = useRouter();
  const hasToken = !!getToken();
  const { width } = useWindowDimensions();

  // Proportional scale: 1x on a 390pt phone, clamped for small phones and tablets
  const s = Math.min(Math.max(width / 390, 0.85), 1.3);
  const logoSize = Math.round(76 * s);
  const logoRadius = Math.round(logoSize * 0.29);
  const iconSize = Math.round(logoSize * 0.58);

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace(hasToken ? ('/(tabs)' as any) : ('/intro' as any));
    }, hasToken ? 100 : 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <Screen>
      <LinearGradient
        colors={['rgba(20,12,4,1)', 'rgba(60,30,6,0.9)', 'rgba(255,167,38,0.22)'] as [string, string, string]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.center}>
        <View style={[styles.logo, { width: logoSize, height: logoSize, borderRadius: logoRadius }]}>
          <Ionicons name={'arrow-redo'} size={iconSize} color={'#fff'} />
        </View>
        <Text style={[styles.word, { fontSize: Math.round(40 * s), marginTop: Math.round(18 * s) }]}>rally</Text>
        <Text style={[styles.tag, { fontSize: Math.round(15 * s), marginTop: Math.round(8 * s) }]}>Show up for the people you love</Text>
      </View>
      <Text style={styles.version}>Version 1.0</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  logo: { backgroundColor: '#FFA726', alignItems: 'center', justifyContent: 'center' },
  word: { ...typo.h1, color: '#fff', fontSize: 40, fontWeight: '900', marginTop: 18 },
  tag: { color: '#fff', opacity: 0.85, fontSize: 15, marginTop: 8, textAlign: 'center' },
  version: { color: '#9E9E9E', fontSize: 12, textAlign: 'center', paddingBottom: spacing.lg },
});