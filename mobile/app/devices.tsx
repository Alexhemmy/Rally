/** Devices (mock 17) - logged-in devices.
 * The backend has no per-session listing or per-session revoke yet,
 * so the list shows the current device plus real sign-in events from
 * /api/security/me. Per-device Log out explains that honestly; the
 * gold button calls the real /api/security/sessions/revoke-all.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const TEAL = '#34D399';

type SecEvent = { id: string; type: string; createdAt: string };

function relTime(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'Active now';
  if (days === 1) return 'Yesterday';
  if (days < 7) return days + ' days ago';
  if (days < 14) return '1 week ago';
  if (days < 30) return Math.floor(days / 7) + ' weeks ago';
  return Math.floor(days / 30) + ' months ago';
}

export default function DevicesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();

  const [events, setEvents] = useState<{ id: string; type: string; createdAt: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const signedIn = Boolean(getToken());

  const load = useCallback(async () => {
    if (!getToken()) return;
    try {
      const r = await api<{ events: SecEvent[] }>('/api/security/me');
      setEvents((r.events || []).filter((e) => e.type === 'login' || e.type === 'login_2fa').slice(0, 6));
    } catch { /* offline */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  function logOutOne() {
    impact('light');
    Alert.alert(
      'Sign out this session',
      'Per-device sign out is not live yet. Use Log out of all other devices below - it signs out every other session and keeps you signed in here.'
    );
  }

  async function logOutAll() {
    impact('medium');
    Alert.alert(
      'Log out of all other devices',
      'Every other signed-in session will be signed out. This device stays logged in.',
      [
        { text: 'Cancel', style: 'cancel' as const },
        {
          text: 'Log out others',
          style: 'destructive' as const,
          onPress: async () => {
            setBusy(true);
            try {
              await api('/api/security/sessions/revoke-all', { method: 'POST' });
              impact('success');
              Alert.alert('Done', 'All other sessions have been signed out.');
              load();
            } catch (e: any) {
              Alert.alert('Could not sign out', e.message || 'Try again later.');
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  }

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Devices</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={[styles.sub, { color: colors.muted }]}>You are logged in on these devices.</Text>

          {/* Current device */}
          <View style={[styles.deviceRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.iconBubble, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons name="phone-portrait-outline" size={20} color={GOLD} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16 }}>This device</Text>
              <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>Active now</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: TEAL + '22' }]}>
              <Text style={{ color: TEAL, fontWeight: '900', fontSize: 11, letterSpacing: 1 }}>CURRENT</Text>
            </View>
          </View>

          {/* Recent sign-ins from the real security event log */}
          {signedIn && events.length > 0 ? (
            events.map((e, i) => (
              <View key={e.id} style={[styles.deviceRow, i < events.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                <View style={[styles.iconBubble, { backgroundColor: colors.surfaceElevated }]}>
                  <Ionicons name="globe-outline" size={20} color={GOLD} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>
                    {e.type === 'login_2fa' ? 'Signed in with two-step' : 'Signed in'}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>{relTime(e.createdAt)}</Text>
                </View>
                <Pressable onPress={logOutOne} style={[styles.logoutChip, { borderColor: colors.border }]} accessibilityLabel="Log out session">
                  <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }}>Log out</Text>
                </Pressable>
              </View>
            ))
          ) : signedIn ? (
            <View style={[styles.noteCard, { borderColor: colors.border }]}>
              <Ionicons name="information-circle-outline" size={18} color={TEAL} />
              <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20, flex: 1 }}>
                No other sign-ins on record. New sign-ins will appear here.
              </Text>
            </View>
          ) : (
            <View style={[styles.noteCard, { borderColor: colors.border }]}>
              <Ionicons name="information-circle-outline" size={18} color={TEAL} />
              <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20, flex: 1 }}>
                Sign in to see the devices your account is logged in on.
              </Text>
            </View>
          )}

          {/* Warning note */}
          <View style={[styles.noteCard, { borderColor: colors.border }]}>
            <Ionicons name="warning-outline" size={18} color={TEAL} />
            <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22, flex: 1 }}>
              See one you do not recognise? Log it out and change your password.
            </Text>
          </View>

          <Pressable onPress={logOutAll} disabled={busy || !signedIn} style={[styles.allBtn, (!signedIn || busy) && { opacity: 0.6 }]} accessibilityLabel="Log out of all other devices">
            <Text style={{ color: '#111', fontWeight: '900', fontSize: 17 }}>
              {busy ? 'Signing out…' : 'Log out of all other devices'}
            </Text>
          </Pressable>
        </ScrollView>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.sm },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  sub: { fontSize: 16, marginBottom: spacing.md },
  deviceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15 },
  iconBubble: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pill: { borderRadius: radii.full, paddingHorizontal: 12, paddingVertical: 6 },
  logoutChip: { borderWidth: 1, borderRadius: radii.full, paddingHorizontal: 16, paddingVertical: 9 },
  noteCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: radii.lg, padding: 14, marginTop: spacing.md },
  allBtn: { backgroundColor: GOLD, borderRadius: radii.lg, paddingVertical: 16, alignItems: 'center', marginTop: spacing.lg },
});
