/** Feed tab — random Moments
 * A shuffled stream of public Moments. Works without an account.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GlassCard, Avatar, EmptyState } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { spacing } from '@/constants/theme';
import { shareMoment } from '@/hooks/useShare';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { api } from '@/lib/api';

export default function FeedTab() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const { click } = useSounds();

  const [moments, setMoments] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    impact('selection');
    try {
      const res = await api<{ moments: any[] }>('/api/feed/random', { skipAuth: true });
      setMoments(res.moments || []);
    } catch {
      setMoments([]);
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
      {moments.length > 0 ? (
        <View style={{ gap: 12, marginBottom: spacing.md }}>
          {moments.map((m) => {
            const handle = m.favorite?.user?.handle || m.user?.handle || 'rally';
            return (
              <GlassCard key={m.id}>
                <View style={styles.row}>
                  <Avatar name={handle} size={40} ring uri={m.favorite?.user?.avatarUrl || undefined} />
                  <Pressable
                    style={{ marginLeft: 12, flex: 1 }}
                    onPress={() => {
                      click();
                      router.push('/moments/' + m.id);
                    }}
                  >
                    <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>
                      {m.title}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 13 }}>
                      @{handle}
                      {m.categoryTag ? ' · ' + m.categoryTag : ''}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      impact('light');
                      shareMoment(m.title, m.id);
                    }}
                    style={styles.shareBtn}
                  >
                    <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>
                      Share
                    </Text>
                  </Pressable>
                </View>
              </GlassCard>
            );
          })}
        </View>
      ) : (
        loaded && (
          <View style={{ marginTop: spacing.lg }}>
            <EmptyState
              icon="shuffle-outline"
              title="Quiet for now"
              body="No Moments yet. Be the first to share one!"
            />
          </View>
        )
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
