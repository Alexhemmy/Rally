/** Notifications - Rally design (screen 59)
 * Final setup step. Five calm toggles, then Allow notifications
 * or Not now. Completes onboarding and routes through the Safe mode
 * welcome for under-18s, otherwise straight to All Set.
 */
import { useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GradientButton } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { spacing, radii, type as typo } from '@/constants/theme';
import { api } from '@/lib/api';
import { onboardingFlags } from '@/lib/onboarding-flags';

const GREEN = '#34D399';

const TOGGLES = [
  { key: 'live', title: 'Your Favorites go live', sub: 'Only the ones you follow', on: true },
  { key: 'replies', title: 'Replies and mentions', sub: 'When someone talks to you', on: true },
  { key: 'giveaways', title: 'Giveaways and results', sub: 'Entries closing and winners', on: true },
  { key: 'rivalry', title: 'Rivalry updates', sub: 'Off unless you opt in to Rivalry', on: false },
  { key: 'quiet', title: 'Quiet hours', sub: 'No alerts 10pm to 7am', on: true },
];

export default function SetupNotificationsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name: string }>();
  const { impact } = useHaptics();
  const { success } = useSounds();
  const [state, setState] = useState<Record<string, boolean>>(
    Object.fromEntries(TOGGLES.map((t) => [t.key, t.on]))
  );

  function finish(allow: boolean) {
    impact(allow ? 'success' : 'light');
    if (allow) success();
    api('/api/auth/onboarding/complete', { method: 'POST', body: JSON.stringify({}) }).catch(() => {});
    const q = '?name=' + encodeURIComponent(String(name || ''));
    if (onboardingFlags.minor) {
      router.replace(('/safe-mode-welcome' + q) as any);
    } else {
      router.replace(('/all-set' + q) as any);
    }
  }

  return (
    <SwipeBack pullDown>
      <Screen>
        <Text style={[styles.h1, { color: colors.text }]}>Stay in the loop</Text>
        <Text style={[styles.sub, { color: colors.muted }]}>Choose what is worth a buzz. You will see a system prompt next.</Text>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
          {TOGGLES.map((t) => (
            <View key={t.key} style={[styles.row, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>{t.title}</Text>
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{t.sub}</Text>
              </View>
              <Pressable onPress={() => { impact('light'); setState((s) => ({ ...s, [t.key]: !s[t.key] })); }} accessibilityLabel={t.title}>
                <View style={[styles.knobTrack, state[t.key] ? { backgroundColor: GREEN } : { backgroundColor: 'rgba(128,128,128,0.4)' }]}>
                  <View style={[styles.knob, state[t.key] ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]} />
                </View>
              </Pressable>
            </View>
          ))}

          <GradientButton label={'Allow notifications'} onPress={() => finish(true)} fullWidth />
          <View style={{ marginTop: 12 }} />
          <GradientButton label={'Not now'} variant={'ghost'} onPress={() => finish(false)} fullWidth />
        </ScrollView>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: { ...typo.h1, marginBottom: 4 },
  sub: { fontSize: 13, lineHeight: 19, marginBottom: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: radii.lg, padding: 16, marginBottom: 12 },
  knobTrack: { width: 48, height: 28, borderRadius: 14, padding: 2 },
  knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
});
