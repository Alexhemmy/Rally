/** Fan Clubs
 * Manage your monthly memberships with Favorites.
 * Cancel or pause anytime — no dark patterns.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { GradientButton, GlassCard, SectionHeader, EmptyState } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { api } from '@/lib/api';
import { spacing, radii, type as typo } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';

type Tier = {
  id: string;
  name: string;
  priceCents: number;
  currency: string;
  perks: string[];
};

type Subscription = {
  id: string;
  status: string;
  currentPeriodEnd: string;
  tier: Tier | null;
};

export default function FanClubsScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();

  const [subs, setSubs] = useState<Subscription[]>([]);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await api<{ subscriptions: Subscription[] }>('/api/subscriptions/me');
      setSubs(r.subscriptions || []);
    } catch {
      // offline
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, action: 'cancel' | 'pause') {
    setActingId(id);
    setMsg(null);
    impact('medium');

    try {
      await api(`/api/subscriptions/${id}/${action}`, { method: 'POST' });
      await load();
      setMsg({
        type: 'success',
        text: action === 'cancel' ? 'Membership cancelled' : 'Membership updated',
      });
      impact('success');
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Action failed' });
    } finally {
      setActingId(null);
    }
  }

  return (
    <SwipeBack>
      <Screen refreshing={refreshing} onRefresh={load}>
        {/* Header */}
        <Text style={[styles.h1, { color: colors.text }]}>Fan Clubs</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Join a Favorite’s monthly fan club. Cancel anytime — no dark patterns.
        </Text>

        {/* Feedback */}
        {msg && (
          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  msg.type === 'success'
                    ? colors.success + '18'
                    : colors.danger + '18',
              },
            ]}
          >
            <Text
              style={{
                color: msg.type === 'success' ? colors.success : colors.danger,
                fontWeight: '700',
                fontSize: 13,
              }}
            >
              {msg.text}
            </Text>
          </View>
        )}

        {/* Tip */}
        <GlassCard style={{ marginBottom: spacing.md }}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Tip</Text>
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
            Browse tiers from any Favorite’s profile page, then join here or on the web.
          </Text>
        </GlassCard>

        {/* My Subscriptions */}
        <GlassCard>
          <SectionHeader title="My memberships" />

          {subs.length === 0 ? (
            <EmptyState
              icon="people-outline"
              title="No memberships yet"
              body="Support a Favorite by joining their fan club."
            />
          ) : (
            <View style={{ gap: 16, marginTop: 4 }}>
              {subs.map((sub) => (
                <View
                  key={sub.id}
                  style={[
                    styles.subCard,
                    {
                      backgroundColor: colors.bg,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tierName, { color: colors.text }]}>
                      {sub.tier?.name ?? 'Membership'}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
                      {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                      {' · '}
                      Renews {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={styles.actions}>
                    <GradientButton
                      label={sub.status === 'paused' ? 'Resume' : 'Pause'}
                      size="sm"
                      variant="ghost"
                      onPress={() => act(sub.id, 'pause')}
