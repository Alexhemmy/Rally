/** Feed tab
 * Home timeline of Moments from Favorites you follow.
 */
import { useCallback, useState, useEffect } from 'react';
import { Text, StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GradientButton, GlassCard, Avatar, EmptyState, SectionHeader } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, radii, type as typo } from '@/constants/theme';
import { shareMoment } from '@/hooks/useShare';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { api, getToken } from '@/lib/api';

export default function FeedTab() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const { click } = useSounds();

  const [refreshing, setRefreshing] = useState(false);
  const [moments, setMoments] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    impact('selection');
    try {
      const token = typeof getToken === 'function' ? getToken() : null;
      if (token) {
        const res = await api<{ moments: any[] }>('/api/feed/home', { token });
        setMoments(res.moments || []);
      }
    } catch {
      // offline or unauthenticated
    } finally {
      setRefreshing(false);
      setLoaded(true);
    }
  }, [impact]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen refreshing={refreshing} onRefresh={load}>
      <Text style={[styles.h1, { color: colors.text }]}>Feed</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Pull down to refresh · Moments from Favorites you follow
      </Text>

      {/* Real moments from API */}
      {moments.length > 0 && (
        <View style={{ gap: 12, marginBottom: spacing.md }}>
          {moments.map((m) => (
            <GlassCard key={m.id}>
              <Pressable
                onPress={() => {
                  click();
                  router.push(`/moments/${m.id}`);
                }}
              >
                <View style={styles.authorRow}>
                  <Avatar
                    name={m.favorite?.user?.handle || 'F'}
                    size={40}
                    ring
                  />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={[styles.title, { color: colors.text }]}>
                      {m.title}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 13 }}>
                      @{m.favorite?.user?.handle}
                    </Text>
                  </View>
                </View>
              </Pressable>
            </GlassCard>
          ))}
        </View>
      )}

      {/* Demo Moment (always visible for discovery) */}
      <GlassCard>
        <SectionHeader title="Demo Moment" />
        <View style={styles.authorRow}>
          <Avatar name="Mia" size={40} ring />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>
              New single snippet
            </Text>
            <Text style={{ color: colors.muted, fontSize: 13 }}>@mia</Text>
          </View>
        </View>

        <Text
          style={{
            color: colors.muted,
            fontSize: 14,
            lineHeight: 20,
            marginTop: 10,
            marginBottom: 14,
          }}
        >
          A short demo Moment so you can try sharing and gifting right away.
        </Text>

        <View style={styles.actions}>
          <GradientButton
            label="Open @mia"
            size="sm"
            onPress={() => {
              click();
              router.push('/favorite/mia');
            }}
          />
          <GradientButton
            label="Share"
            size="sm"
            variant="ghost"
            onPress={() => {
              impact('light');
              shareMoment('New single snippet', 'demo');
            }}
          />
        </View>
      </GlassCard>

      {loaded && moments.length === 0 && (
        <View style={{ marginTop: spacing.lg }}>
          <EmptyState
            icon="newspaper-outline"
            title="Your feed is quiet"
            body="Follow Favorites or open the demo to see Moments here."
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: {
    ...typo.h1,
    marginTop: spacing.sm,
    marginBottom: 6,
  },
  subtitle: {
    ...typo.body,
    marginBottom: spacing.lg,
    lineHeight: 21,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
});
