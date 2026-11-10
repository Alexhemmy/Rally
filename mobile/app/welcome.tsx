/** Welcome - Rally design (screen 06)
 * Genre cards, brand line, Get started, existing account, browse-only.
 */
import { Text, StyleSheet, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GradientButton } from '@/components/ui';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii, type as typo } from '@/constants/theme';

const GOLD = '#FFA726';

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
          <Ionicons name={'gift'} size={16} color={'#fff'} />
          <Text style={styles.genreText}>Afrobeats</Text>
        </View>
      </View>

      <View style={styles.logoRow}>
        <View style={styles.logoMark}>
          <Ionicons name={'arrow-redo'} size={22} color={'#fff'} />
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
  cardsStage: { height: 200, marginTop: spacing.xl, marginBottom: spacing.xl, justifyContent: 'flex-start' },
  genreCard: { position: 'absolute', width: 150, height: 190, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'flex-end', padding: 12, flexDirection: 'row', gap: 6 },
  gospelCard: { top: 0, left: 6, backgroundColor: '#7C4DFF', transform: [{ rotate: '-6deg' }] },
  comedyCard: { top: 18, left: 96, backgroundColor: '#ef5350', transform: [{ rotate: '3deg' }] },
  afroCard: { top: 38, left: 42, backgroundColor: '#42A5F5' },
  genreText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  logoMark: { width: 34, height: 34, borderRadius: 10, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' },
  word: { ...typo.h1, color: '#fff', fontSize: 28, fontWeight: '900' },
  h1: { ...typo.h1, color: '#fff', fontSize: 26, lineHeight: 34, marginBottom: 8 },
  body: { color: '#BDBDBD', fontSize: 14, lineHeight: 21, marginBottom: spacing.xl },
  browse: { alignItems: 'center', paddingVertical: 14, marginTop: 6 },
  browseText: { color: GOLD, fontWeight: '800', fontSize: 14 },
});