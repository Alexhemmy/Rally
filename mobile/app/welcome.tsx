/** Welcome - Rally design (screen 06)
 * Genre cards, brand line, Get started, existing account, browse-only.
 */
import { Text, StyleSheet, View, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GradientButton } from '@/components/ui';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii, type as typo } from '@/constants/theme';

const GOLD = '#FFA726';

// Proportional scale: 1x on a 390pt phone, clamped for small phones and tablets
const S = Math.min(Math.max(Dimensions.get('window').width / 390, 0.85), 1.3);

export default function WelcomeScreen() {
  const router = useRouter();
  const { impact } = useHaptics();

  return (
    <Screen padded>
      <View style={styles.cardsStage}>
        <View style={[styles.genreCard, styles.gospelCard]}>
          <Text style={styles.genreText}>Gospel</Text>
        </View>
        <View style={[styles.genreCard, styles.comedyCard]}>
          <Text style={styles.genreText}>Comedy</Text>
        </View>
        <View style={[styles.genreCard, styles.afroCard]}>
          <Ionicons name={'gift'} size={Math.round(16 * S)} color={'#fff'} />
          <Text style={styles.genreText}>Afrobeats</Text>
        </View>
      </View>

      <View style={styles.logoRow}>
        <View style={styles.logoMark}>
          <Ionicons name={'arrow-redo'} size={Math.round(22 * S)} color={'#fff'} />
        </View>
        <Text style={styles.word}>rally</Text>
      </View>
      <Text style={styles.h1}>Show up for the people you love.</Text>
      <Text style={styles.body}>Send Gifts, join the room and get seen. Every Favorite, in every language.</Text>

      <GradientButton
        label={'Get started'}
        fullWidth
        onPress={() => { impact('medium'); router.push('/how-use-rally' as any); }}
      />
      <View style={{ marginTop: 12 }}>
        <GradientButton
          label={'I already have an account'}
          variant={'ghost'}
          fullWidth
          onPress={() => { impact('light'); router.push('/login' as any); }}
        />
      </View>
      <Pressable onPress={() => { impact('light'); router.push('/(tabs)' as any); }} style={styles.browse} accessibilityLabel={'Browse Favorites without an account'}>
        <Text style={styles.browseText}>Browse Favorites without an account</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardsStage: { height: Math.round(200 * S), marginTop: spacing.xl, marginBottom: spacing.xl, justifyContent: 'flex-start' },
  genreCard: { position: 'absolute', width: Math.round(150 * S), height: Math.round(190 * S), borderRadius: radii.lg, alignItems: 'center', justifyContent: 'flex-end', padding: Math.round(12 * S), flexDirection: 'row', gap: 6 },
  gospelCard: { top: 0, left: Math.round(6 * S), backgroundColor: '#7C4DFF', transform: [{ rotate: '-6deg' }] },
  comedyCard: { top: Math.round(18 * S), left: Math.round(96 * S), backgroundColor: '#ef5350', transform: [{ rotate: '3deg' }] },
  afroCard: { top: Math.round(38 * S), left: Math.round(42 * S), backgroundColor: '#42A5F5' },
  genreText: { color: '#fff', fontWeight: '900', fontSize: Math.round(15 * S) },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  logoMark: { width: Math.round(34 * S), height: Math.round(34 * S), borderRadius: Math.round(10 * S), backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' },
  word: { ...typo.h1, color: '#fff', fontSize: Math.round(28 * S), fontWeight: '900' },
  h1: { ...typo.h1, color: '#fff', fontSize: Math.round(26 * S), lineHeight: Math.round(34 * S), marginBottom: 8 },
  body: { color: '#BDBDBD', fontSize: 14, lineHeight: 21, marginBottom: spacing.xl },
  browse: { alignItems: 'center', paddingVertical: 14, marginTop: 6 },
  browseText: { color: GOLD, fontWeight: '800', fontSize: 14 },
});