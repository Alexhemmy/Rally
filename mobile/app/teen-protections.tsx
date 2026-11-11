/** Teen Account Protections (UX 49) - Rally design
 * Safe mode protections for fans aged 13-17. The low spending limit
 * shows the real cap from /api/limits; guardian consent state comes
 * from the real /api/junior/me application.
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
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#FFA726';
const TEAL = '#34D399';

type JuniorApp = { id: string; status: string } | null;

export default function TeenProtectionsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();

  const [safeMode, setSafeMode] = useState(true);
  const [cap, setCap] = useState<number | null>(null);
  const [junior, setJunior] = useState<JuniorApp>(null);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem('rally.safeMode');
      if (raw !== null) setSafeMode(JSON.parse(raw));
    } catch { /* default on */ }
    if (getToken()) {
      try {
        const l: any = await api('/api/limits');
        if (l.monthlySpendCap) setCap(Number(l.monthlySpendCap));
      } catch { /* offline */ }
      try {
        const j: any = await api('/api/junior/me');
        setJunior(j.application || null);
      } catch { /* not a junior favorite applicant */ }
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function toggleSafeMode() {
    impact('light');
    setSafeMode((v) => {
      AsyncStorage.setItem('rally.safeMode', JSON.stringify(!v)).catch(() => undefined);
      return !v;
    });
  }

  function resend() {
    impact('light');
    if (junior && junior.status === 'pending') {
      Alert.alert('Request sent', 'Ask your guardian to check their messages for the 6-digit consent code.');
    } else {
      Alert.alert('Resend arrives with the consent backend', 'For now, submit the guardian request again from the Junior Favorite screen.');
    }
  }

  const protections: { title: string; body: string; on: boolean }[] = [
    { title: 'Restricted feed', body: 'No rivalry content and no content for adults only.', on: safeMode },
    { title: 'Low spending limit', body: cap ? 'Set to T ' + cap.toLocaleString('en-US') + ' monthly. A guardian can change it.' : 'Set to a low monthly amount. A guardian can change it.', on: true },
    { title: 'No spending prompts on Moments', body: 'You will not see nudges to buy Tokens while browsing.', on: safeMode },
    { title: 'Token Gifts between fans', body: 'You cannot send or receive Token Gifts.', on: false },
    { title: 'Payouts, cash prizes and Favorite status', body: 'These unlock at 18. Junior Favorites 16-17 can apply with guardian consent.', on: false },
  ];

  return (
    <SwipeBack>
      <Screen>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Your protections</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Safe mode banner */}
          <Pressable
            style={[styles.banner, { backgroundColor: safeMode ? TEAL + '1a' : colors.surfaceElevated, borderColor: safeMode ? TEAL : colors.border }]}
            onPress={toggleSafeMode}
            accessibilityLabel="Toggle safe mode"
          >
            <View style={[styles.bannerIcon, { backgroundColor: safeMode ? TEAL : colors.border }]}>
              <Ionicons name={safeMode ? 'shield-checkmark' : 'shield-outline'} size={22} color={safeMode ? '#0B3B2E' : colors.muted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 18 }}>
                {safeMode ? 'Safe mode is on' : 'Safe mode is off'}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 14, marginTop: 2 }}>Extra protections for fans aged 13 to 17.</Text>
            </View>
          </Pressable>

          <Pressable
            style={[styles.banner, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => { impact('light'); router.push('/safe-mode'); }}
            accessibilityLabel="Safe mode settings"
          >
            <View style={[styles.bannerIcon, { backgroundColor: colors.surfaceElevated || colors.bg }]}>
              <Ionicons name="settings-outline" size={22} color={GOLD} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 }}>Safe mode settings</Text>
              <Text style={{ color: colors.muted, fontSize: 14, marginTop: 2 }}>Messages, spending, breaks and content.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>

          {/* Protections list */}
          <View style={[styles.list, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            {protections.map((p, i) => (
              <View
                key={p.title}
                style={[styles.pRow, i < protections.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
              >
                <View style={[styles.check, p.on ? { backgroundColor: TEAL } : { backgroundColor: colors.border }]}>
                  <Ionicons name={p.on ? 'checkmark' : 'lock-closed'} size={15} color={p.on ? '#0B3B2E' : colors.muted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 }}>{p.title}</Text>
                  <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 2 }}>{p.body}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Guardian consent */}
          <Text style={[styles.section, { color: colors.muted }]}>Guardian consent</Text>
          <View style={[styles.consentCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <View style={[styles.consentDot, { borderColor: junior && (junior.status === 'consented' || junior.status === 'approved') ? TEAL : GOLD }]}>
              {junior && (junior.status === 'consented' || junior.status === 'approved') ? (
                <Ionicons name="checkmark" size={18} color={TEAL} />
              ) : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 17 }}>
                {junior && (junior.status === 'consented' || junior.status === 'approved')
                  ? 'Guardian consent received'
                  : junior && junior.status === 'pending'
                  ? 'Waiting for your guardian'
                  : 'Ask your guardian for consent'}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 2 }}>
                Needed in your region before you can buy Tokens.
              </Text>
            </View>
          </View>

          <Pressable onPress={resend} style={[styles.resendBtn, { backgroundColor: colors.surfaceElevated }]} accessibilityLabel="Resend request">
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>Resend request</Text>
          </Pressable>
          {!junior ? (
            <Pressable onPress={() => router.push('/junior')} accessibilityLabel="Apply with guardian consent">
              <Text style={{ color: GOLD, fontWeight: '800', fontSize: 14, textAlign: 'center', marginTop: 12 }}>
                Or start a guardian consent request
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1.5, borderRadius: radii.lg, padding: 16 },
  bannerIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  list: { borderWidth: 1, borderRadius: radii.lg, marginTop: spacing.md },
  pRow: { flexDirection: 'row', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  check: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  section: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5, marginTop: spacing.lg, marginBottom: 8 },
  consentCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: radii.lg, padding: 16 },
  consentDot: { width: 34, height: 34, borderRadius: 17, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  resendBtn: { borderRadius: radii.lg, paddingVertical: 16, alignItems: 'center', marginTop: spacing.md },
});
