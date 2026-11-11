/** Rivalry Trophies (mock 14)
 * Face-Offs voted counts your real votes on this device (bumped on
 * every successful vote). Your side won needs a badges backend, so it
 * is honest for now. Badges unlock from voting where the device can
 * know; fair play, streaks and fandom badges arrive with the badges
 * backend. Spending never earns badges.
 */
import { useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, radii } from '@/constants/theme';

const GOLD = '#FFA726';
const TEAL = '#34D399';
const RED = '#E9355B';
const PURPLE = '#7C4DFF';
const BLUE = '#2563EB';
const SLATE = '#475569';

const BADGES = [
  { icon: 'trophy', color: GOLD, label: 'First vote', need: 1 },
  { icon: 'flame', color: RED, label: 'Fierce fan', need: 5 },
  { icon: 'shield-checkmark', color: TEAL, label: 'Fair play', need: -1 },
  { icon: 'star', color: PURPLE, label: 'Streak of 5', need: -1 },
  { icon: 'people', color: BLUE, label: 'Fandom pride', need: -1 },
];

export default function TrophiesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [voted, setVoted] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem('rally.faceOffVotes')
      .then((v) => setVoted(Number(v || '0')))
      .catch(() => undefined);
  }, []);

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Trophies</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* Stats */}
        <View style={styles.statRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={{ color: colors.muted, fontSize: 15, fontWeight: '700' }}>Face-Offs voted</Text>
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 38, marginTop: 8 }}>{String(voted)}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={{ color: colors.muted, fontSize: 15, fontWeight: '700' }}>Your side won</Text>
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 38, marginTop: 8 }}>{'\u2014'}</Text>
          </View>
        </View>

        <Text style={[styles.section, { color: colors.muted }]}>RIVALRY BADGES</Text>
        <View style={styles.badgeGrid}>
          {BADGES.map((b) => {
            const unlocked = b.need > 0 && voted >= b.need;
            return (
              <View key={b.label} style={[styles.badgeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.badgeIcon, { backgroundColor: unlocked ? b.color : SLATE }]}>
                  <Ionicons name={b.icon as any} size={24} color="#fff" />
                </View>
                <Text style={{ color: unlocked ? colors.text : colors.muted, fontWeight: '800', fontSize: 14, marginTop: 12 }}>
                  {unlocked ? b.label : b.need > 0 ? b.label : 'Locked'}
                </Text>
                {!unlocked && b.need > 0 ? (
                  <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>{'Vote ' + b.need + ' to unlock'}</Text>
                ) : null}
              </View>
            );
          })}
        </View>

        <View style={[styles.note, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="shield-checkmark-outline" size={18} color={TEAL} />
          <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22, flex: 1, marginLeft: 10 }}>
            Badges come from voting and fair play. Spending never earns them.
          </Text>
        </View>
        <Text style={[styles.honest, { color: colors.muted }]}>
          Face-Offs voted counts votes made on this device. Wins, fair play, streaks and fandom badges arrive with the badges backend.
        </Text>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  h1: { fontSize: 20, fontWeight: '900' },
  statRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, borderWidth: 1, borderRadius: radii.lg, padding: 16 },
  section: { fontSize: 13, fontWeight: '900', letterSpacing: 1, marginTop: spacing.lg, marginBottom: 12 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badgeCard: { width: '30.5%', borderWidth: 1, borderRadius: radii.lg, padding: 14, alignItems: 'center' },
  badgeIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  note: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radii.lg, padding: 14, marginTop: spacing.lg },
  honest: { fontSize: 12, lineHeight: 18, marginTop: spacing.md },
});
