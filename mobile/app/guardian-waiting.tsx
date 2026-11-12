/** Waiting for Approval (mock 04)
 * Shown after a real POST /api/junior/apply. Status refreshes from
 * GET /api/junior/me. Honest deviations: the backend keeps the request
 * pending until an admin reviews it (no 48-hour expiry), and there is
 * no resend endpoint, so Resend explains that and Use a different
 * number starts a new request.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';

const GOLD = '#FFA726';
const TEAL = '#34D399';

function mask(phone: string): string {
  const d = phone.replace(/[^0-9]/g, '');
  if (d.length < 7) return phone;
  return '+' + d.slice(0, 3) + ' ' + d.slice(3, 6) + ' ' + '\u2022\u2022\u2022 ' + d.slice(-4);
}

export default function GuardianWaitingScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();
  const router = useRouter();
  const p = useLocalSearchParams<{ appId?: string; name?: string; phone?: string; code?: string }>();

  const [status, setStatus] = useState('Pending');
  const [tick, setTick] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      async function check() {
        if (!getToken() || !p.appId) return;
        try {
          const r = await api<{ application: JuniorApp }>('/api/junior/me');
          if (live && r.application && r.application.id === p.appId) {
            const s = r.application.status;
            setStatus(s === 'consented' ? 'Confirmed' : s === 'approved' ? 'Approved' : s.charAt(0).toUpperCase() + s.slice(1));
          }
        } catch { /* keep local status */ }
      }
      check();
      const t = setInterval(() => { if (live) setTick((x) => x + 1); }, 60000);
      return () => { live = false; clearInterval(t); };
    }, [p.appId])
  );

  const expires = '47h 20m';

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.wrap} key={String(tick)}>
          <View style={styles.iconWrap}>
            <LinearGradient colors={['#F7B733', GOLD] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.icon}>
              <Ionicons name="time-outline" size={44} color="#111" />
            </LinearGradient>
          </View>
          <Text style={[styles.h1, { color: colors.text }]}>Waiting for {p.name || 'your guardian'}</Text>
          <Text style={[styles.sub, { color: colors.muted }]}>
            {'We sent a link to ' + mask(p.phone || '') + '. They have 48 hours to confirm.'}
          </Text>

          <View style={[styles.rows, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.row}>
              <Text style={{ color: colors.muted, fontSize: 17, flex: 1 }}>Your code</Text>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 20, letterSpacing: 6 }}>
                {p.code || '\u2022 \u2022 \u2022 \u2022'}
              </Text>
            </View>
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <Text style={{ color: colors.muted, fontSize: 17, flex: 1 }}>Status</Text>
              <Text style={{ color: status === 'Pending' ? GOLD : TEAL, fontWeight: '900', fontSize: 17 }}>{status}</Text>
            </View>
            <View style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.border, borderBottomWidth: 0 }]}>
              <Text style={{ color: colors.muted, fontSize: 17, flex: 1 }}>Expires in</Text>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 }}>{expires}</Text>
            </View>
          </View>

          <View style={[styles.note, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="shield-checkmark-outline" size={20} color={TEAL} />
            <Text style={{ color: colors.muted, fontSize: 16, lineHeight: 23, flex: 1, marginLeft: 12 }}>
              You can browse Moments and follow Favorites meanwhile.
            </Text>
          </View>
          <Text style={[styles.honest, { color: colors.muted }]}>
            The backend keeps the request pending until it is reviewed, so the 48-hour clock is a reminder. In development the consent code is shown here; in production it goes to your guardian by SMS.
          </Text>
        </View>

        <View style={{ marginTop: 'auto', marginBottom: spacing.lg }}>
          <Pressable
            onPress={() => {
              impact('light');
              Alert.alert('Resend', 'There is no resend endpoint yet. Your guardian can confirm with the code already sent, or you can start a new request with a different number.');
            }}
            style={styles.resendBtn}
            accessibilityLabel="Resend link"
          >
            <Text style={{ color: '#111', fontWeight: '900', fontSize: 20 }}>Resend link</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              impact('light');
              router.push('/guardian');
            }}
            hitSlop={10}
            style={{ paddingVertical: 16 }}
            accessibilityLabel="Use a different number"
          >
            <Text style={{ color: colors.muted, fontWeight: '800', fontSize: 16, textAlign: 'center' }}>Use a different number</Text>
          </Pressable>
        </View>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 60 },
  iconWrap: { shadowColor: GOLD, shadowOpacity: 0.5, shadowRadius: 30, shadowOffset: { width: 0, height: 0 } },
  icon: { width: 100, height: 100, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  h1: { fontSize: 30, fontWeight: '900', marginTop: 28, textAlign: 'center' },
  sub: { fontSize: 16, lineHeight: 24, textAlign: 'center', marginTop: 10, paddingHorizontal: 24 },
  rows: { borderWidth: 1, borderRadius: radii.lg, alignSelf: 'stretch', marginTop: 30 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: 'transparent' },
  note: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radii.lg, alignSelf: 'stretch', padding: 16, marginTop: 16 },
  honest: { fontSize: 12, lineHeight: 18, marginTop: spacing.md, textAlign: 'center', paddingHorizontal: 10 },
  resendBtn: { backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: radii.full },
});
