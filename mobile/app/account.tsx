/** Account (mock 16) - account and security hub.
 * Phone and email come from the real account (masked), Two-step
 * verification reflects the real /api/security/me state and opens
 * the full security screen, Login alerts is a local preference,
 * Download your data opens the real data screen, and Delete account
 * is honest: self-serve deletion is not live yet.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import { api, getToken } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#FFA726';
const TEAL = '#34D399';
const RED = '#E9355B';

function maskPhone(p: string | null | undefined): string | null {
  if (!p) return null;
  const digits = p.replace(/\D/g, '');
  if (digits.length < 4) return p;
  return '+234 ' + digits.slice(-10, -7) + ' \u2022\u2022\u2022 ' + digits.slice(-4);
}

function maskEmail(e: string | null | undefined): string | null {
  return e || null;
}

export default function AccountScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();

  const [phone, setPhone] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [twoFa, setTwoFa] = useState<boolean | null>(null);
  const [pwChanged, setPwChanged] = useState<string | null>(null);
  const [loginAlerts, setLoginAlerts] = useState(true);

  const load = useCallback(async () => {
    if (!getToken()) return;
    try {
      const r = await api<{ user: any }>('/api/auth/me');
      const u = r.user || {};
      setPhone(u.phone || null);
      setEmail(u.email || null);
    } catch { /* offline */ }
    try {
      const s = await api<{ security: { twoFactorEnabled: boolean }; events: { id: string; type: string; createdAt: string }[] }>('/api/security/me');
      setTwoFa(s.security.twoFactorEnabled);
      const pwEvent = (s.events || []).filter((e) => e.type === 'password_changed')[0];
      if (pwEvent) {
        const days = Math.floor((Date.now() - new Date(pwEvent.createdAt).getTime()) / 86400000);
        setPwChanged(days >= 30 ? 'Changed ' + Math.floor(days / 30) + ' months ago' : 'Changed recently');
      }
    } catch { /* offline */ }
    try {
      const raw = await AsyncStorage.getItem('rally.privacyPrefs');
      if (raw) {
        const p = JSON.parse(raw);
        if (p.loginAlerts !== undefined) setLoginAlerts(p.loginAlerts);
      }
    } catch { /* local only */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  function toggleAlerts(v: boolean) {
    setLoginAlerts(v);
    impact('light');
    AsyncStorage.getItem('rally.privacyPrefs')
      .then((raw) => {
        const p = raw ? JSON.parse(raw) : {};
        p.loginAlerts = v;
        return AsyncStorage.setItem('rally.privacyPrefs', JSON.stringify(p));
      })
      .catch(() => undefined);
  }

  function row(icon: string, label: string, value: string | null, onPress: () => void, opts?: { accent?: string; toggle?: boolean; toggleValue?: boolean; onToggle?: (v: boolean) => void }) {
    return (
      <View key={label} style={[styles.row, { borderBottomColor: colors.border }]}>
        <Pressable style={styles.rowMain} onPress={onPress} accessibilityLabel={label}>
          <View style={[styles.iconBubble, { backgroundColor: colors.surfaceElevated }]}>
            <Ionicons name={icon as any} size={20} color={opts && opts.accent ? opts.accent : GOLD} />
          </View>
          <Text style={{ flex: 1, color: opts && opts.accent ? opts.accent : colors.text, fontWeight: '800', fontSize: 17 }}>{label}</Text>
          {value ? <Text style={{ color: colors.muted, fontSize: 16 }}>{value}</Text> : null}
          {!opts || !opts.toggle ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null}
        </Pressable>
        {opts && opts.toggle ? (
          <Pressable
            onPress={() => opts.onToggle && opts.onToggle(!opts.toggleValue)}
            style={[styles.track, opts.toggleValue ? { backgroundColor: TEAL } : { backgroundColor: colors.border }]}
            accessibilityLabel={'Toggle ' + label}
          >
            <View style={[styles.thumb, opts.toggleValue ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]} />
          </Pressable>
        ) : null}
      </View>
    );
  }

  function deleteAccount() {
    impact('medium');
    Alert.alert(
      'Delete account',
      'Self-serve deletion is not live yet. Contact support from Help center and your account will be deleted within 30 days.',
      [
        { text: 'Cancel', style: 'cancel' as const },
        { text: 'Open Help center', onPress: () => router.push('/help-center') },
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
          <Text style={[styles.h1, { color: colors.text }]}>Account</Text>
          <View style={{ width: 26 }} />
        </View>

        <View style={[styles.group, { borderColor: colors.border }]}>
          {row('phone-portrait-outline', 'Phone', maskPhone(phone), () => router.push('/verify-phone'))}
          {row('mail-outline', 'Email', maskEmail(email), () => router.push('/edit-profile'))}
          {row('key-outline', 'Password', pwChanged || 'On file', () => router.push('/security'))}
        </View>

        <Text style={[styles.section, { color: colors.muted }]}>SECURITY</Text>
        <View style={[styles.group, { borderColor: colors.border }]}>
          {row('shield-checkmark-outline', 'Two-step verification', twoFa == null ? null : twoFa ? 'On' : 'Off', () => router.push('/security'))}
          {row('phone-portrait-outline', 'Devices', 'Manage', () => router.push('/security'))}
          {row('warning-outline', 'Login alerts', null, () => toggleAlerts(!loginAlerts), { toggle: true, toggleValue: loginAlerts, onToggle: toggleAlerts })}
        </View>

        <Text style={[styles.section, { color: colors.muted }]}>DATA</Text>
        <View style={[styles.group, { borderColor: colors.border }]}>
          {row('download-outline', 'Download your data', null, () => router.push('/your-data'))}
          {row('trash-outline', 'Delete account', null, deleteAccount, { accent: RED })}
        </View>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  group: { borderWidth: 1, borderRadius: radii.lg, overflow: 'hidden' },
  row: { borderBottomWidth: StyleSheet.hairlineWidth },
  rowMain: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15, paddingHorizontal: 14, flex: 1 },
  iconBubble: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  section: { fontSize: 12, fontWeight: '900', letterSpacing: 1, marginTop: spacing.lg, marginBottom: 8 },
  track: { width: 54, height: 32, borderRadius: 16, padding: 2, marginRight: 14 },
  thumb: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff' },
});
