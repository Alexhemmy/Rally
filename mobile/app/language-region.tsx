/** Language and Region (UX 48) - Rally design
 * App language saves for real (PATCH /api/users/me locale). Translate
 * posts, region and currency are saved on this device until the
 * localization backend ships.
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

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Fran\u00e7ais' },
  { code: 'pt', label: 'Portugu\u00eas' },
  { code: 'ar', label: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629' },
  { code: 'pcm', label: 'Naij\u00e1 Pidgin' },
  { code: 'yo', label: 'Yor\u00f9b\u00e1' },
];

const REGIONS = ['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'United Kingdom', 'United States'];
const CURRENCIES = ['Naira (\u20a6)', 'Cedi (\u20b5)', 'Shilling (KSh)', 'Rand (R)', 'Pound (\u00a3)', 'Dollar ($)'];

export default function LanguageRegionScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();

  const [locale, setLocale] = useState('en');
  const [translate, setTranslate] = useState(true);
  const [region, setRegion] = useState('Nigeria');
  const [currency, setCurrency] = useState(CURRENCIES[0]);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem('rally.localePrefs');
      if (raw) {
        const p = JSON.parse(raw);
        if (p.translate !== undefined) setTranslate(p.translate);
        if (p.region) setRegion(p.region);
        if (p.currency) setCurrency(p.currency);
      }
    } catch { /* local only */ }
    if (getToken()) {
      try {
        const r: any = await api('/api/auth/me');
        if (r.user && r.user.locale) setLocale(r.user.locale);
      } catch { /* offline */ }
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function pickLanguage(code: string) {
    impact('light');
    setLocale(code);
    try { await AsyncStorage.setItem('rally.localePrefs', JSON.stringify({ translate, region, currency })); } catch { /* local */ }
    if (getToken()) {
      try {
        await api('/api/users/me', { method: 'PATCH', body: JSON.stringify({ locale: code }) });
      } catch { /* keep local choice */ }
    }
  }

  function saveLocal(next: { translate?: boolean; region?: string; currency?: string }) {
    const merged = {
      translate: next.translate !== undefined ? next.translate : translate,
      region: next.region || region,
      currency: next.currency || currency,
    };
    AsyncStorage.setItem('rally.localePrefs', JSON.stringify(merged)).catch(() => undefined);
  }

  function picker(title: string, options: string[], current: string, onPick: (v: string) => void) {
    Alert.alert(
      title,
      undefined,
      options.map((opt) => ({
        text: opt + (opt === current ? ' (current)' : ''),
        onPress: () => {
          impact('light');
          onPick(opt);
        },
      })).concat([{ text: 'Cancel', style: 'cancel' as const }]) as any
    );
  }

  return (
    <SwipeBack>
      <Screen>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Language and region</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={[styles.section, { color: colors.muted }]}>APP LANGUAGE</Text>
          {LANGUAGES.map((l, i) => {
            const on = locale === l.code;
            return (
              <Pressable
                key={l.code}
                onPress={() => pickLanguage(l.code)}
                style={[styles.langRow, i < LANGUAGES.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
                accessibilityLabel={l.label}
              >
                <View style={[styles.radio, on ? { borderColor: GOLD } : { borderColor: colors.border }]}>
                  {on ? <View style={[styles.radioDot, { backgroundColor: GOLD }]} /> : null}
                </View>
                <Text style={[styles.langLabel, { color: colors.text }]}>{l.label}</Text>
              </Pressable>
            );
          })}

          {/* Translate posts */}
          <View style={[styles.row, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
            <View style={[styles.iconBubble, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons name="globe-outline" size={19} color={GOLD} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Translate posts</Text>
            <Pressable
              onPress={() => { impact('light'); setTranslate(!translate); saveLocal({ translate: !translate }); }}
              style={[styles.switchTrack, translate ? { backgroundColor: TEAL } : { backgroundColor: colors.border }]}
              accessibilityLabel="Toggle translate posts"
            >
              <View style={[styles.switchThumb, translate ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]} />
            </Pressable>
          </View>

          {/* Region */}
          <Pressable style={styles.row} onPress={() => picker('Region', REGIONS, region, (v) => { setRegion(v); saveLocal({ region: v }); })} accessibilityLabel="Region">
            <View style={[styles.iconBubble, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons name="location-outline" size={19} color={GOLD} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Region</Text>
            <Text style={{ color: colors.muted, fontSize: 15 }}>{region}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>

          {/* Currency */}
          <Pressable style={styles.row} onPress={() => picker('Currency', CURRENCIES, currency, (v) => { setCurrency(v); saveLocal({ currency: v }); })} accessibilityLabel="Currency">
            <View style={[styles.iconBubble, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons name="card-outline" size={19} color={GOLD} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Currency</Text>
            <Text style={{ color: colors.muted, fontSize: 15 }}>{currency}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>

          <Text style={[styles.hint, { color: colors.muted }]}>
            Your language saves to your account. Region and currency are saved on this device for now.
          </Text>
        </ScrollView>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.sm },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  section: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginTop: spacing.sm, marginBottom: 4 },
  langRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
  radio: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 14, height: 14, borderRadius: 7 },
  langLabel: { fontSize: 17, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  iconBubble: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 16, fontWeight: '700' },
  switchTrack: { width: 54, height: 32, borderRadius: 16, padding: 2 },
  switchThumb: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff' },
  hint: { fontSize: 12, lineHeight: 18, marginTop: spacing.md },
});
