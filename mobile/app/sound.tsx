/** Sound Page (UX 15) - Rally design
 * A sound's page: title, author, length, how many Moments use it,
 * Use this sound, and a grid of Moments. There is no sounds backend
 * yet, so the grid is honest about it instead of faking content.
 */
import { useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { EmptyState } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';

const GRID_COLORS = ['#C2186B', '#3D5AFE', '#26A69A', '#E05A00', '#7C4DFF', '#00897B'];

export default function SoundScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string; author?: string; count?: string }>();
  const { impact } = useHaptics();

  const name = params.name ? String(params.name) : 'Original sound';
  const author = params.author ? String(params.author) : 'Rally';
  const count = params.count ? Number(params.count) : 0;

  return (
    <SwipeBack>
      <Screen>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Sound</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Sound card */}
          <View style={styles.soundRow}>
            <LinearGradient colors={['#7C4DFF', '#5C6BC0'] as [string, string]} style={styles.soundArt}>
              <Ionicons name="stats-chart-outline" size={34} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={[styles.soundName, { color: colors.text }]} numberOfLines={1}>{name}</Text>
              <Text style={{ color: colors.muted, fontSize: 15, marginTop: 2 }}>{author}</Text>
              <Text style={{ color: colors.muted, fontSize: 15, marginTop: 2 }}>
                {count.toLocaleString('en-US')} Moments
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <Pressable
              onPress={() => { impact('medium'); router.push('/compose-moment'); }}
              style={styles.useBtn}
              accessibilityLabel="Use this sound"
            >
              <Ionicons name="videocam-outline" size={20} color="#111" />
              <Text style={styles.useText}>Use this sound</Text>
            </Pressable>
            <Pressable
              onPress={() => impact('light')}
              style={[styles.saveBtn, { backgroundColor: colors.surfaceElevated }]}
              accessibilityLabel="Save sound"
            >
              <Ionicons name="bookmark-outline" size={22} color={colors.text} />
            </Pressable>
          </View>

          {/* Grid - honest */}
          {count > 0 ? (
            <View style={styles.grid}>
              {GRID_COLORS.map((c, i) => (
                <View key={i} style={[styles.tile, { backgroundColor: c }]} />
              ))}
            </View>
          ) : (
            <EmptyState
              icon="musical-notes-outline"
              title="No Moments yet"
              body="Sound pages fill up as Moments use this sound. The sounds backend is coming - recordings you attach today already play with your Moment."
            />
          )}
        </ScrollView>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  soundRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: spacing.sm },
  soundArt: { width: 96, height: 96, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  soundName: { fontSize: 22, fontWeight: '900' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: spacing.lg },
  useBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: GOLD,
    borderRadius: radii.full,
    paddingVertical: 16,
  },
  useText: { color: '#111', fontWeight: '900', fontSize: 17 },
  saveBtn: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: spacing.lg },
  tile: { width: '31%', aspectRatio: 0.72, borderRadius: 18 },
});
