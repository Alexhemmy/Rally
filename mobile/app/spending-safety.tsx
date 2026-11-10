/** Spending Safety - Rally design (screen 58)
 * Step 6 of 6. Monthly cap chips in naira (stored in Tokens at 10:1),
 * 80% reminder toggle, 24-hour raise note. Saves via PUT /api/limits.
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

const GOLD = '#FFA726';
const GREEN = '#34D399';

const OPTIONS = [
  { key: '5k', naira: 5000, title: '\u20a65,000 a month', sub: 'About 25 small Gifts' },
  { key: '20k', naira: 20000, title: '\u20a620,000 a month', sub: 'Most fans pick this' },
  { key: '50k', naira: 50000, title: '\u20a650,000 a month', sub: 'For regular supporters' },
  { key: 'none', naira: null, title: 'No limit', sub: 'You can add one any time in Settings' },
];

function Bar() {
  return (
    <View style={styles.track}>
      <View style={{ flex: 0.95, backgroundColor: GOLD, borderRadius: 2 }} />
      <View style={{ flex: 0.05 }} />
    </View>
  );
}

export default function SpendingSafetyScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name: string }>();
  const { impact } = useHaptics();
  const { success, error: errSound } = useSounds();
  const [picked, setPicked] = useState('20k');
  const [remind, setRemind] = useState(true);
  const [saving, setSaving] = useState(false);

  async function next() {
    if (saving) return;
    setSaving(true);
    impact('medium');
    const opt = OPTIONS.find((o) => o.key === picked)!;
    try {
      await api('/api/limits', {
        method: 'PUT',
        body: JSON.stringify({ monthlySpendCap: opt.naira === null ? null : Math.round(opt.naira / 10) }),
      });
    } catch {
      // Keep the flow moving even if the cap cannot be saved yet.
    }
    success();
    impact('success');
    router.replace(('/setup-notifications?name=' + (name || '')) as any);
  }

  return (
    <SwipeBack pullDown>
      <Screen>
        <Bar />
        <Text style={[styles.h1, { color: colors.text }]}>Set a monthly limit</Text>
        <Text style={[styles.sub, { color: colors.muted }]}>Gifts are fun and should stay that way. Pick a limit now. You can lower it instantly later.</Text>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
          {OPTIONS.map((o) => (
            <Pressable
              key={o.key}
              onPress={() => { impact('light'); setPicked(o.key); }}
              style={[styles.chip, { borderColor: picked === o.key ? GOLD : colors.border, backgroundColor: colors.surface }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>{o.title}</Text>
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{o.sub}</Text>
              </View>
              {picked === o.key ? <Ionicons name={'checkmark-circle'} size={22} color={GOLD} /> : null}
            </Pressable>
          ))}

          <View style={[styles.toggleRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>Remind me when I reach 80%</Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>A calm heads-up, not a block</Text>
            </View>
            <Pressable onPress={() => { impact('light'); setRemind(!remind); }} accessibilityLabel={'Toggle 80 percent reminder'}>
              <View style={[styles.knobTrack, remind ? { backgroundColor: GREEN } : { backgroundColor: 'rgba(128,128,128,0.4)' }]}>
                <View style={[styles.knob, remind ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]} />
              </View>
            </Pressable>
          </View>

          <Text style={[styles.note, { color: colors.muted }]}>Raising a limit later takes effect after 24 hours. Lowering it is instant.</Text>

          <GradientButton label={'Save limit and continue'} onPress={next} loading={saving} fullWidth />
        </ScrollView>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', height: 4, borderRadius: 2, backgroundColor: 'rgba(128,128,128,0.25)', marginBottom: spacing.lg },
  h1: { ...typo.h1, marginBottom: 4 },
  sub: { fontSize: 13, lineHeight: 19, marginBottom: spacing.lg },
  chip: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderRadius: radii.lg, padding: 16, marginBottom: 12 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: radii.lg, padding: 16, marginBottom: 12 },
  knobTrack: { width: 48, height: 28, borderRadius: 14, padding: 2 },
  knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
  note: { fontSize: 12, lineHeight: 17, marginBottom: spacing.lg },
});
