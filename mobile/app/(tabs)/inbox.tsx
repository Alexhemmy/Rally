/** Inbox tab - Rally design
 * All account activity with fan / Favorite filters, grouped into
 * TODAY and EARLIER. Tap a notification to mark it read.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, radii } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
type IconName = keyof typeof Ionicons.glyphMap;
type Filter = 'all' | 'fan' | 'favorite';

const FAN_TYPES = ['moment_published', 'follow', 'new_follower', 'reaction', 'comment', 'mention'];
const FAVORITE_TYPES = ['gift', 'gift_received', 'support', 'subscription', 'purchase', 'payout', 'earning', 'favorite_role', 'token_purchase', 'welcome'];

function iconFor(type: string): { name: IconName; color: string } {
  if (type.indexOf('gift') === 0 || type === 'support') return { name: 'gift', color: '#E91E63' };
  if (type === 'favorite_role') return { name: 'star', color: '#9C27B0' };
  if (type.indexOf('subscription') === 0) return { name: 'repeat', color: '#2196F3' };
  if (type.indexOf('moment') === 0) return { name: 'play', color: GOLD };
  if (type === 'follow' || type === 'new_follower') return { name: 'person-add', color: '#4CAF50' };
  if (type === 'reaction' || type === 'comment') return { name: 'heart', color: '#E91E63' };
  if (type.indexOf('payout') === 0 || type.indexOf('earning') === 0) return { name: 'cash', color: '#00897B' };
  if (type.indexOf('purchase') >= 0 || type.indexOf('token') >= 0) return { name: 'card', color: '#00897B' };
  return { name: 'notifications', color: '#9E9E9E' };
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (!then) return '';
  const mins = Math.max(1, Math.round((Date.now() - then) / 60000));
  if (mins < 60) return mins + 'm';
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return hrs + 'h';
  const days = Math.round(hrs / 24);
  if (days < 7) return days + 'd';
  return Math.round(days / 7) + 'w';
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export default function InboxTab() {
  const { colors } = useTheme();
  const { impact } = useHaptics();
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    impact('selection');
    try {
      if (!getToken()) {
        setItems([]);
      } else {
        const res = await api<{ notifications: any[] }>('/api/notifications');
        setItems(res.notifications || []);
      }
    } catch {
      setItems([]);
    } finally {
      setRefreshing(false);
      setLoaded(true);
    }
  }, [impact]);

  useEffect(() => {
    load();
  }, [load]);

  const matches = (n: any) => {
    if (filter === 'fan') return FAN_TYPES.indexOf(n.type) >= 0;
    if (filter === 'favorite') return FAVORITE_TYPES.indexOf(n.type) >= 0;
    return true;
  };

  const filtered = items.filter(matches);
  const today = filtered.filter((n) => isToday(n.createdAt));
  const earlier = filtered.filter((n) => !isToday(n.createdAt));
  const unread = items.filter((n) => !n.isRead).length;

  const markRead = async (n: any) => {
    if (n.isRead) return;
    impact('light');
    try {
      await api('/api/notifications/' + n.id + '/read', { method: 'POST', body: '{}' });
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    } catch {
      /* keep unread state if the call fails */
    }
  };

  const filters: [Filter, string][] = [
    ['all', 'All'],
    ['fan', 'As a fan'],
    ['favorite', 'As a Favorite'],
  ];

  const renderRow = (n: any) => {
    const ic = iconFor(String(n.type || ''));
    return (
      <Pressable
        key={n.id}
        style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => markRead(n)}
        accessibilityLabel={n.title}
      >
        <View style={[styles.iconBubble, { backgroundColor: (ic.color + '22') }]}>
          <Ionicons name={ic.name} size={18} color={ic.color} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={styles.rowTop}>
            <Text numberOfLines={1} style={[styles.rowTitle, { color: colors.text }]}>
              {n.title}
            </Text>
            {!n.isRead && <View style={styles.unreadDot} />}
          </View>
          {n.body ? (
            <Text numberOfLines={2} style={[styles.rowBody, { color: colors.muted }]}>
              {n.body}
            </Text>
          ) : null}
        </View>
        <Text style={[styles.time, { color: colors.muted }]}>{timeAgo(n.createdAt)}</Text>
      </Pressable>
    );
  };

  const renderSection = (label: string, list: any[]) =>
    list.length > 0 ? (
      <View>
        <Text style={[styles.sectionLabel, { color: colors.muted }]}>{label}</Text>
        <View style={{ gap: 8, marginBottom: spacing.md }}>{list.map(renderRow)}</View>
      </View>
    ) : null;

  return (
    <Screen refreshing={refreshing} onRefresh={load}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, marginBottom: spacing.md }}
        contentContainerStyle={{ gap: 8, paddingRight: 16 }}
      >
        {filters.map(([key, label]) => {
          const active = filter === key;
          return (
            <Pressable
              key={key}
              onPress={() => {
                impact('selection');
                setFilter(key);
              }}
              style={[
                styles.pill,
                { borderColor: active ? GOLD : colors.border, backgroundColor: active ? GOLD : colors.surface },
              ]}
            >
              <Text style={[styles.pillText, { color: active ? '#111' : colors.text }]}>{label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {unread > 0 ? (
        <Text style={[styles.unreadSummary, { color: colors.muted }]}>
          {unread} unread
        </Text>
      ) : null}

      {filtered.length > 0 ? (
        <View>
          {renderSection('TODAY', today)}
          {renderSection('EARLIER', earlier)}
        </View>
      ) : (
        loaded && (
          <View style={{ marginTop: spacing.lg }}>
            <EmptyState
              icon="mail-outline"
              title={filter === 'all' ? 'Nothing yet' : 'Nothing in this filter'}
              body={
                getToken()
                  ? 'Follows, gifts, reactions and purchases will land here.'
                  : 'Log in to see your activity.'
              }
            />
          </View>
        )
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  pillText: {
    fontWeight: '700',
    fontSize: 13,
  },
  unreadSummary: {
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 14,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowTitle: {
    fontWeight: '700',
    fontSize: 14,
    flex: 1,
  },
  rowBody: {
    fontSize: 13,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFA726',
  },
  time: {
    fontSize: 12,
    marginLeft: 10,
  },
});
