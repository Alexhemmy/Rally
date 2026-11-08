/** Home tab - Rally design
 * Story rail of people you follow + algorithmic For You Moment cards
 * with media thumbnails. Real API data only.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GlassCard, EmptyState } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, radii } from '@/constants/theme';
import { shareMoment } from '@/hooks/useShare';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';

type Story = { handle: string; avatarUrl?: string };

export default function HomeTab() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const { click } = useSounds();

  const [moments, setMoments] = useState<any[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    impact('selection');
    try {
      if (!getToken()) {
        setMoments([]);
        setStories([]);
      } else {
        const res = await api<{ moments: any[] }>('/api/feed/for-you');
        const list = res.moments || [];
        setMoments(list);
        const seen: Record<string, boolean> = {};
        const rail: Story[] = [];
        list.forEach((m) => {
          const handle = m.favorite?.user?.handle || m.user?.handle;
          if (handle && !seen[handle]) {
            seen[handle] = true;
            rail.push({ handle, avatarUrl: m.favorite?.user?.avatarUrl || m.user?.avatarUrl });
          }
        });
        setStories(rail);
      }
    } catch {
      setMoments([]);
      setStories([]);
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
      {/* Story rail */}
      {stories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, marginBottom: spacing.md }}
          contentContainerStyle={{ gap: 14, paddingRight: 16 }}
        >
          {stories.map((s) => (
            <Pressable
              key={s.handle}
              style={styles.story}
              onPress={() => {
                click();
                router.push('/u/' + s.handle);
              }}
              accessibilityLabel={'Open ' + s.handle}
            >
              <LinearGradient
                colors={[GOLD, GOLD_DEEP] as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.storyRing}
              >
                <View style={[styles.storyInner, { backgroundColor: colors.surface }]}>
                  {s.avatarUrl ? (
                    <Image source={{ uri: s.avatarUrl }} style={styles.storyAvatar} />
                  ) : (
                    <Text style={[styles.storyInitials, { color: GOLD }]}>
                      {s.handle.slice(0, 2).toUpperCase()}
                    </Text>
                  )}
                </View>
              </LinearGradient>
              <Text numberOfLines={1} style={[styles.storyLabel, { color: colors.muted }]}>
                {s.handle}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* For You moments */}
      {moments.length > 0 ? (
        <View style={{ gap: 12, marginBottom: spacing.md }}>
          {moments.map((m) => {
            const handle = m.favorite?.user?.handle || m.user?.handle || 'rally';
            const thumb = Array.isArray(m.media) && m.media.length > 0 ? m.media[0] : null;
            const thumbUrl = thumb ? (thumb.absoluteUrl || thumb.publicUrl || thumb.url) : null;
            return (
              <GlassCard key={m.id}>
                <View style={styles.row}>
                  <Pressable
                    style={styles.authorTouch}
                    onPress={() => {
                      click();
                      router.push('/u/' + handle);
                    }}
                  >
                    <Text style={[styles.title, { color: colors.text }]}>{m.title}</Text>
                    <Text style={{ color: colors.muted, fontSize: 13 }}>
                      @{handle}
                      {m.categoryTag ? ' \u00b7 ' + m.categoryTag : ''}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      impact('light');
                      shareMoment(m.title, m.id);
                    }}
                    style={styles.shareBtn}
                    accessibilityLabel="Share this Moment"
                  >
                    <Ionicons name="share-social-outline" size={18} color={GOLD} />
                  </Pressable>
                </View>
                {thumbUrl ? (
                  <Pressable
                    onPress={() => {
                      click();
                      router.push('/moments/' + m.id);
                    }}
                    style={[styles.thumbWrap, { borderColor: colors.border }]}
                  >
                    <Image source={{ uri: thumbUrl }} style={styles.thumb} resizeMode="cover" />
                    {(thumb.type === 'video' || String(thumbUrl).indexOf('.mp4') >= 0) && (
                      <View style={styles.playBadge}>
                        <Ionicons name="play" size={14} color="#fff" />
                      </View>
                    )}
                  </Pressable>
                ) : null}
              </GlassCard>
            );
          })}
        </View>
      ) : (
        loaded && (
          <View style={{ marginTop: spacing.lg }}>
            <EmptyState
              icon="sparkles-outline"
              title="Nothing here yet"
              body={
                getToken()
                  ? 'Follow fans and Favorites to personalize your For You feed.'
                  : 'Log in to see Moments picked for you.'
              }
            />
          </View>
        )
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  story: {
    alignItems: 'center',
    width: 64,
  },
  storyRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  storyAvatar: {
    width: 52,
    height: 52,
  },
  storyInitials: {
    fontWeight: '800',
    fontSize: 16,
  },
  storyLabel: {
    fontSize: 11,
    marginTop: 6,
    maxWidth: 64,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorTouch: {
    marginLeft: 2,
    flex: 1,
  },
  title: {
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 2,
  },
  shareBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  thumbWrap: {
    marginTop: 10,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
  },
  thumb: {
    width: '100%',
    height: 180,
  },
  playBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
