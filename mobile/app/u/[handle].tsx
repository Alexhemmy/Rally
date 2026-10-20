/** Fan Profile
 * Simple supporter profile view with progress and link to Favorite page.
 */
import { Text, StyleSheet, View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GlassCard, SectionHeader, Avatar } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, radii, type as typo } from '@/constants/theme';

export default function FanProfileScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const { colors } = useTheme();
  const router = useRouter();

  const displayHandle = String(handle || 'unknown');

  return (
    <SwipeBack>
      <Screen>
        {/* Header */}
        <View style={styles.header}>
          <Avatar name={displayHandle} size={64} ring />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[styles.h1, { color: colors.text }]}>
              @{displayHandle}
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Fan profile · supporter levels & badges
            </Text>
          </View>
        </View>

        {/* Supporter Progress */}
        <GlassCard style={{ marginTop: spacing.md }}>
          <SectionHeader title="Supporter progress" />
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
            Levels unlock as you gift and engage with Favorites.
          </Text>

          {/* Placeholder progress bars – replace with real data later */}
          <View style={{ marginTop: spacing.md, gap: 12 }}>
            {['Bronze', 'Silver', 'Gold'].map((level, i) => (
              <View key={level}>
                <View style={styles.levelRow}>
                  <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>
                    {level}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>
                    {i === 0 ? 'Unlocked' : 'Locked'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.progressTrack,
                    { backgroundColor: colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: i === 0 ? '100%' : i === 1 ? '35%' : '0%',
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </GlassCard>

        {/* Quick action */}
        <GlassCard style={{ marginTop: spacing.md }}>
          <Pressable
            onPress={() => router.push(`/favorite/${displayHandle}`)}
            style={({ pressed }) => [
              styles.actionRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15 }}>
              Open Favorite page
            </Text>
            <Text style={{ color: colors.primary, fontSize: 18 }}>→</Text>
          </Pressable>
        </GlassCard>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  h1: {
    ...typo.h1,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
