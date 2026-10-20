/** Moment Detail
 * Displays a single Moment (photo, video, or text) from a Favorite’s timeline.
 * Currently a clean placeholder ready for real data.
 */
import { Text, StyleSheet, View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GlassCard, Avatar } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, radii, type as typo } from '@/constants/theme';

export default function MomentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const router = useRouter();

  const momentId = String(id || 'unknown');

  return (
    <SwipeBack>
      <Screen>
        {/* Header */}
        <Text style={[styles.h1, { color: colors.text }]}>Moment</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          ID: {momentId}
        </Text>

        {/* Content card */}
        <GlassCard style={{ marginTop: spacing.sm }}>
          {/* Author row (placeholder) */}
          <View style={styles.authorRow}>
            <Avatar name="Favorite" size={40} ring />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={[styles.authorName, { color: colors.text }]}>
                Favorite
              </Text>
              <Text style={{ color: colors.muted, fontSize: 13 }}>
                Just now
              </Text>
            </View>
          </View>

          {/* Body */}
          <Text style={[styles.body, { color: colors.text }]}>
            Photo, video, or text from a Favorite’s timeline will appear here.
          </Text>

          <Text style={[styles.placeholder, { color: colors.muted }]}>
            This is a placeholder. Wire the real Moment data from the API to show media, captions, gifts, and engagement.
          </Text>
        </GlassCard>

        {/* Actions */}
        <GlassCard style={{ marginTop: spacing.md }}>
          <Pressable
            onPress={() => router.push('/feed')}
            style={({ pressed }) => [
              styles.actionRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15 }}>
              Back to feed
            </Text>
            <Text style={{ color: colors.primary, fontSize: 18 }}>→</Text>
          </Pressable>
        </GlassCard>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: {
    ...typo.h1,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: spacing.md,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  authorName: {
    fontWeight: '700',
    fontSize: 15,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  placeholder: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
