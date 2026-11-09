/** Language and Interests - Rally design (screen 12)
 * Step 3 of 5. One interface language, several content languages,
 * several interests. Nothing is mandatory; Continue is always enabled.
 * Saves via PATCH /api/users/me then completes onboarding.
 */
import { useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GradientButton } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { spacing, radii, type as typo } from '@/constants/theme';
import { api } from '@/lib/api';

const GOLD = '#FFA726';

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Fran\u00e7ais' },
  { code: 'es', label: 'Espa\u00f1ol' },
  { code: 'pt', label: 'Portugu\u00eas' },
  { code: 'ar', label: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629' },
  { code: 'ha', label: 'Hausa' },
  { code: 'yo', label: 'Yor\u00f9b\u00e1' },
  { code: 'ig', label: 'Igbo' },
];

const INTERESTS = ['Music', 'Football', 'Comedy', 'Fashion', 'Food', 'Tech', 'Art', 'Movies', 'Dance', 'Faith', 'Books', 'Fitness'];

export default function OnboardingPreferencesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const { success } = useSounds();
  const [locale, setLocale] = useState('en');
  const [content, setContent] = useState<string[]>(['en']);
  const [interests, setInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  function pickLocale(code: string) {
    impact('light');
    setLocale(code);
    setContent((c) => (c.indexOf(code) === -1 ? [...c, code] : c));
  }

  function toggleContent(code: string) {
    impact('light');
    setContent((c) => (c.indexOf(code) === -1 ? [...c, code] : c.filter((x) => x !== code)));
  }

  function toggleInterest(t: string) {
    impact('light');
    setInterests((c) => (c.indexOf(t) === -1 ? [...c, t] : c.filter((x) => x !== t)));
  }

  async function finish() {
    if (saving) return;
    setSaving(true);
    setErr('');
    impact('medium');
    try {
      await api('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ locale, contentLanguages: content, interests }),
      });
      await api('/api/auth/onboarding/complete', { method: 'POST', body: JSON.stringify({}) });
      success();
      impact('success');
      router.replace('/' as any);
    } catch (e: any) {
      setErr(e.message || 'Could not save your choices.');
      try {
        await api('/api/auth/onboarding/complete', { method: 'POST', body: JSON.stringify({}) });
        router.replace('/' as any);
      } catch {
        setSaving(false);
      }
    }
  }

  const radio = function (active: boolean) {
    return active ? { backgroundColor: GOLD, borderColor: 'transparent' } : { backgroundColor: colors.surface, borderColor: colors.border };
  };

  return (
    <SwipeBack pullDown>
      <Screen>
        <Text style={[styles.h1, { color: colors.text }]}>Language and interests</Text>
        <Text style={[styles.sub, { color: colors.muted }]}>Step 3 of 5. Nothing here is mandatory.</Text>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
          <Text style={[styles.label, { color: colors.muted }]}>INTERFACE LANGUAGE</Text>
          <View style={{ gap: 8, marginBottom: spacing.lg }}>
            {LANGS.map((l) => (
              <Pressable
                key={l.code}
                onPress={() => pickLocale(l.code)}
                style={[styles.langRow, radio(locale === l.code)]}
              >
                <Text style={{ color: locale === l.code ? '#111' : colors.text, fontWeight: '700', fontSize: 15 }}>{l.label}</Text>
                {locale === l.code ? <Ionicons name={'checkmark'} size={18} color={'#111'} /> : null}
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.muted }]}>CONTENT LANGUAGES</Text>
          <View style={styles.chipWrap}>
            {LANGS.map((l) => (
              <Pressable
                key={l.code}
                onPress={() => toggleContent(l.code)}
                style={[styles.chip, radio(content.indexOf(l.code) >= 0)]}
              >
                <Text style={{ color: content.indexOf(l.code) >= 0 ? '#111' : colors.muted, fontWeight: '700', fontSize: 13 }}>{l.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.muted }]}>INTERESTS</Text>
          <View style={styles.chipWrap}>
            {INTERESTS.map((t) => (
              <Pressable
                key={t}
                onPress={() => toggleInterest(t)}
                style={[styles.chip, radio(interests.indexOf(t) >= 0)]}
              >
                <Text style={{ color: interests.indexOf(t) >= 0 ? '#111' : colors.muted, fontWeight: '700', fontSize: 13 }}>{t}</Text>
              </Pressable>
            ))}
          </View>

          {err ? <Text style={[styles.err, { color: colors.danger }]}>{err}</Text> : null}
          <GradientButton label={'Continue'} onPress={finish} loading={saving} fullWidth />
        </ScrollView>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: { ...typo.h1, marginBottom: 4 },
  sub: { fontSize: 13, marginBottom: spacing.lg },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
  langRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 16, paddingVertical: 14 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
  chip: { borderWidth: 1, borderRadius: radii.full, paddingHorizontal: 14, paddingVertical: 8 },
  err: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
});
