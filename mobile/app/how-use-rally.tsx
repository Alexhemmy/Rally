/** How Will You Use Rally - Rally design (screen 07)
 * Fan or Favorite first screens. Both can be changed later.
 */
import { useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GradientButton } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { getToken } from '@/lib/api';
import { spacing, radii, type as typo } from '@/constants/theme';

const GOLD = '#FFA726';

export default function HowUseRallyScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const [choice, setChoice] = useState<'fan' | 'favorite'>('fan');

  function continue_() {
    impact('medium');
    if (getToken()) {
      router.replace('/(tabs)' as any);
    } else {
      router.push('/signup' as any);
    }
  }

  return (
    <SwipeBack>
      <Screen>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
          <Text style={[styles.h1, { color: colors.text }]}>How will you use Rally?</Text>
          <Text style={[styles.sub, { color: colors.muted }]}>You can do both later. This only sets up your first screens.</Text>

          <Pressable
            onPress={() => { impact('light'); setChoice('fan'); }}
            style={[styles.option, choice === 'fan' ? styles.optionOn : { borderColor: colors.border, backgroundColor: colors.surface }]}
          >
            <Ionicons name={'heart'} size={22} color={choice === 'fan' ? GOLD : colors.muted} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>I am a fan</Text>
              <Text style={[styles.optionSub, { color: colors.muted }]}>Watch Moments, send Gifts and join communities.</Text>
            </View>
            <View style={[styles.radio, choice === 'fan' ? styles.radioOn : { borderColor: colors.border }]}>
              {choice === 'fan' ? <Ionicons name={'checkmark'} size={16} color={'#111'} /> : null}
            </View>
          </Pressable>

          <Pressable
            onPress={() => { impact('light'); setChoice('favorite'); }}
            style={[styles.option, choice === 'favorite' ? styles.optionOn : { borderColor: colors.border, backgroundColor: colors.surface }]}
          >
            <Ionicons name={'mic'} size={22} color={choice === 'favorite' ? GOLD : colors.muted} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>I am a Favorite</Text>
              <Text style={[styles.optionSub, { color: colors.muted }]}>Share your work, grow supporters and earn from Gifts.</Text>
            </View>
            <View style={[styles.radio, choice === 'favorite' ? styles.radioOn : { borderColor: colors.border }]}>
              {choice === 'favorite' ? <Ionicons name={'checkmark'} size={16} color={'#111'} /> : null}
            </View>
          </Pressable>

          <Text style={[styles.note, { color: colors.muted }]}>Favorites are verified before they can cash out. Fans can browse without an account.</Text>
          <GradientButton label={'Continue'} onPress={continue_} fullWidth />
        </ScrollView>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: { ...typo.h1, marginBottom: 4 },
  sub: { fontSize: 13, lineHeight: 19, marginBottom: spacing.lg },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 2, borderRadius: radii.lg, padding: 16, marginBottom: 12 },
  optionOn: { borderColor: GOLD, backgroundColor: 'rgba(255,167,38,0.08)' },
  optionTitle: { fontWeight: '800', fontSize: 16, marginBottom: 2 },
  optionSub: { fontSize: 13, lineHeight: 18 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioOn: { backgroundColor: GOLD, borderColor: GOLD },
  note: { fontSize: 12, lineHeight: 18, marginBottom: spacing.lg },
});