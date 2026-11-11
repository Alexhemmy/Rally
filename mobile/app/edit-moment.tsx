/** Edit Moment - Rally design (mock 17)
 * Trim preview, caption overlay and editing tools. Real trimming,
 * captions, filters and covers need a video-processing backend, so the
 * tools are honest shells for now; Next continues to Post settings.
 */
import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
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
const PURPLE = '#7C4DFF';

const TOOLS: { icon: string; label: string; note: string }[] = [
  { icon: 'chatbox-outline', label: 'Captions', note: 'Burned-in captions arrive with the video editing backend.' },
  { icon: 'pulse', label: 'Sound', note: 'Sound editing arrives with the sounds backend.' },
  { icon: 'sparkles', label: 'Filters', note: 'Filters arrive with the video editing backend.' },
  { icon: 'image-outline', label: 'Cover', note: 'Custom covers arrive with the video editing backend.' },
];

function fmt(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60);
}

export default function EditMomentScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();
  const { click } = useSounds();
  const router = useRouter();
  const p = useLocalSearchParams<{ title?: string; tag?: string; description?: string; mediaUrl?: string; seconds?: string }>();
  const [playing, setPlaying] = useState(false);

  const seconds = Number(p.seconds || 0) || 42;
  const caption = p.description || '';

  function toolTap(t: { label: string; note: string }) {
    impact('light');
    Alert.alert(t.label, t.note);
  }

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel={'Back'}>
            <Ionicons name={'chevron-back'} size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Edit</Text>
          <Pressable
            onPress={() => {
              click();
              impact('medium');
              router.push({
                pathname: '/post-settings',
                params: { title: p.title || '', tag: p.tag || '', description: p.description || '', mediaUrl: p.mediaUrl || '' },
              });
            }}
            hitSlop={10}
          >
            <Text style={[styles.next, { color: GOLD }]}>Next</Text>
          </Pressable>
        </View>

        {/* Preview card */}
        <LinearGradient colors={[PURPLE, GOLD] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.preview}>
          <Pressable style={styles.playCircle} onPress={() => setPlaying(!playing)} accessibilityLabel={'Play preview'}>
            <Ionicons name={playing ? 'pause' : 'play'} size={28} color={'#1a1a1a'} />
          </Pressable>
          {caption ? (
            <View style={styles.captionWrap}>
              <Text style={styles.caption} numberOfLines={2}>{caption}</Text>
            </View>
          ) : null}
        </LinearGradient>

        {/* Trim strip */}
        <View style={styles.strip}>
          {Array.from({ length: 10 }).map((_, i) => (
            <LinearGradient
              key={i}
              colors={i >= 2 && i <= 7 ? ([PURPLE, GOLD] as [string, string]) : ([PURPLE, '#8d5a2b'] as [string, string])}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.cell}
            />
          ))}
        </View>
        <View style={styles.trimRow}>
          <Text style={[styles.trimText, { color: colors.muted }]}>{fmt(0)}</Text>
          <Text style={[styles.trimText, { color: colors.text, fontWeight: '800' }]}>Selected {fmt(seconds)}</Text>
          <Text style={[styles.trimText, { color: colors.muted }]}>{fmt(seconds * 1.25)}</Text>
        </View>
        <Text style={[styles.trimNote, { color: colors.muted }]}>
          Frame-accurate trimming arrives with the video editing backend. The full clip is posted for now.
        </Text>

        {/* Tools */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: spacing.md }}>
          {TOOLS.map((t) => (
            <Pressable key={t.label} onPress={() => toolTap(t)} style={[styles.tool, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name={t.icon as any} size={22} color={GOLD} />
              <Text style={[styles.toolLabel, { color: colors.text }]}>{t.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  h1: { fontSize: 20, fontWeight: '900' },
  next: { fontSize: 17, fontWeight: '800' },
  preview: { borderRadius: radii.lg, height: 300, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  playCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#f5efe6', alignItems: 'center', justifyContent: 'center' },
  captionWrap: { position: 'absolute', left: 12, right: 12, bottom: 12, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 8 },
  caption: { color: '#fff', fontWeight: '800', fontSize: 15, textAlign: 'center' },
  strip: { flexDirection: 'row', gap: 3, borderRadius: radii.md, borderWidth: 2, borderColor: GOLD, padding: 3 },
  cell: { flex: 1, height: 52, borderRadius: 6 },
  trimRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  trimText: { fontSize: 13 },
  trimNote: { fontSize: 12, marginTop: 4, marginBottom: spacing.sm },
  tool: { width: 108, height: 96, borderRadius: radii.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  toolLabel: { fontWeight: '800', fontSize: 14 },
});
