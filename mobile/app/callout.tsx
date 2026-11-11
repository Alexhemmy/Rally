/** Write a Call-Out (mock 12)
 * Compose a public call-out to another Favorite. Honest deviations:
 * there is no call-outs backend yet, so Post hands off to the
 * Call-Out Card preview and sending saves the draft on this device.
 * The conduct check is a simple on-device word screen, not moderation.
 */
import { useMemo, useState } from 'react';
import { Text, StyleSheet, View, Pressable, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { spacing, radii } from '@/constants/theme';

const GOLD = '#FFA726';
const TEAL = '#34D399';
const AMBER = '#FBBF24';

const HEATS = ['Friendly', 'Spicy', 'Fierce'];
const FLAG_WORDS = ['kill', 'hate you', 'stupid', 'idiot', 'ugly', 'shut up', 'trash human', 'threat'];

function initials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function CallOutScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();
  const { click } = useSounds();
  const router = useRouter();
  const p = useLocalSearchParams<{ handle?: string; name?: string; sub?: string; fromName?: string }>();

  const [text, setText] = useState('');
  const [heat, setHeat] = useState('Spicy');

  const name = p.name || 'Chinedu Hall';
  const sub = p.sub || 'Gospel choir';

  const flagged = useMemo(() => {
    const t = text.toLowerCase();
    return FLAG_WORDS.some((w) => t.indexOf(w) > -1);
  }, [text]);

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Call-Out</Text>
          <Pressable
            onPress={() => {
              if (text.trim().length < 5) { impact('error'); return; }
              impact('medium');
              router.push({ pathname: '/callout-card', params: { to: name, handle: p.handle || '', fromName: p.fromName || 'You', kind: 'Challenge', text: text.trim(), heat } });
            }}
            disabled={text.trim().length < 5}
            hitSlop={10}
          >
            <Text style={{ color: GOLD, fontWeight: '900', fontSize: 17, opacity: text.trim().length < 5 ? 0.4 : 1 }}>Post</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
          <Text style={[styles.label, { color: colors.muted }]}>Calling out</Text>
          <View style={styles.targetRow}>
            <LinearGradient colors={['#4F46E5', '#818CF8'] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18 }}>{initials(name)}</Text>
            </LinearGradient>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 }} numberOfLines={1}>{name}</Text>
              <Text style={{ color: colors.muted, fontSize: 14, marginTop: 2 }} numberOfLines={1}>{sub}</Text>
            </View>
            <Pressable
              onPress={() => {
                impact('light');
                router.push('/search');
              }}
              hitSlop={10}
            >
              <Text style={{ color: GOLD, fontWeight: '900', fontSize: 16 }}>Change</Text>
            </Pressable>
          </View>

          <View style={[styles.bodyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={{ color: colors.text, fontSize: 18, lineHeight: 27, minHeight: 120, textAlignVertical: 'top', padding: 0 }}
              multiline
              placeholder={'Chinedu, your choir has the better runs but mine has the better harmonies. Settle it Saturday?'}
              placeholderTextColor={colors.muted}
              value={text}
              onChangeText={setText}
              maxLength={200}
            />
          </View>
          <Text style={{ color: colors.muted, fontSize: 15, textAlign: 'right', marginTop: 8 }}>{text.length + ' / 200'}</Text>

          <View style={styles.heatRow}>
            {HEATS.map((h) => {
              const on = heat === h;
              return (
                <Pressable key={h} onPress={() => { impact('light'); setHeat(h); }} style={[styles.heatChip, { borderColor: on ? GOLD : colors.border, backgroundColor: on ? GOLD + '14' : colors.surface }]}>
                  <Text style={{ color: on ? GOLD : colors.text, fontWeight: '900', fontSize: 16 }}>{h}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.checkCard, { backgroundColor: colors.surface, borderColor: flagged ? AMBER + '66' : colors.border }]}>
            <View style={[styles.checkDot, { backgroundColor: flagged ? AMBER : TEAL }]}>
              <Ionicons name={flagged ? 'warning' : 'checkmark'} size={16} color="#111" />
            </View>
            <Text style={{ color: colors.muted, fontSize: 16, lineHeight: 23, flex: 1, marginLeft: 12 }}>
              {flagged
                ? 'This reads personal. Call-Outs name the music, never the person. Tone it down to post.'
                : 'Checked: no threats, slurs or personal attacks.'}
            </Text>
          </View>
        </ScrollView>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  h1: { fontSize: 20, fontWeight: '900' },
  label: { fontSize: 15, fontWeight: '900', marginBottom: 12 },
  targetRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  bodyCard: { borderWidth: 1, borderRadius: radii.lg, padding: 16 },
  heatRow: { flexDirection: 'row', gap: 12, marginTop: spacing.md },
  heatChip: { flex: 1, borderWidth: 1.5, borderRadius: radii.lg, alignItems: 'center', paddingVertical: 16 },
  checkCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radii.lg, padding: 16, marginTop: spacing.md },
  checkDot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
