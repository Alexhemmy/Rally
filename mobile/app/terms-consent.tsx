/** Terms and Consent - Rally design (screen 12)
 * Required agreements before the account is usable: Terms, age, Tokens.
 * Optional marketing opt-in. Data control note. Agree and continue.
 */
import { useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GradientButton } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii, type as typo } from '@/constants/theme';

const GOLD = '#FFA726';

export default function TermsConsentScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { email, phone } = useLocalSearchParams<{ email: string; phone: string }>();
  const { impact } = useHaptics();
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  const items = [
    {
      key: 'terms',
      title: 'Terms of Use and Privacy Policy',
      desc: 'I have read and agree.',
      links: [
        { label: 'Read Terms', to: '/terms' },
        { label: 'Read Privacy Policy', to: '/privacy' },
      ],
      required: true,
    },
    {
      key: 'age',
      title: 'I am 13 or older',
      desc: 'Under 18? Safe mode turns on automatically.',
      links: [],
      required: true,
    },
    {
      key: 'tokens',
      title: 'I understand how Tokens work',
      desc: 'Tokens are for sending Gifts. They cannot be withdrawn or sold.',
      links: [],
      required: true,
    },
    {
      key: 'marketing',
      title: 'Send me tips and offers',
      desc: 'Optional. You can turn this off any time.',
      links: [],
      required: false,
    },
  ];

  const requiredOk = items.filter((i) => i.required).every((i) => checks[i.key]);

  function toggle(k: string) {
    impact('light');
    setChecks((c) => ({ ...c, [k]: !c[k] }));
  }

  function agree() {
    impact('success');
    const q = email ? '?email=' + email : phone ? '?phone=' + phone : '';
    router.replace(('/account-created' + q) as any);
  }

  return (
    <SwipeBack>
      <Screen>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
          <Text style={[styles.h1, { color: colors.text }]}>Before you start</Text>
          <Text style={[styles.sub, { color: colors.muted }]}>Please read and agree to continue.</Text>

          {items.map((item) => (
            <View key={item.key} style={[styles.row, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Pressable onPress={() => toggle(item.key)} accessibilityLabel={item.title}>
                <View
                  style={[
                    styles.checkbox,
                    { borderColor: checks[item.key] ? GOLD : colors.border, backgroundColor: checks[item.key] ? GOLD : 'transparent' },
                  ]}
                >
                  {checks[item.key] ? <Ionicons name={'checkmark'} size={16} color={'#111'} /> : null}
                </View>
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.rowDesc, { color: colors.muted }]}>{item.desc}</Text>
                {item.links.length ? (
                  <Text style={styles.linksRow}>
                    {item.links.map((l, idx) => (
                      <Text
                        key={l.label}
                        style={{ color: GOLD, fontWeight: '700', fontSize: 12 }}
                        onPress={() => router.push(l.to as any)}
                      >
                        {idx > 0 ? ' {' + '\u00b7' + '} ' : ''}{l.label}
                      </Text>
                    ))}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}

          <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
            <Ionicons name={'lock-closed'} size={18} color={colors.muted} />
            <Text style={[styles.infoText, { color: colors.muted }]}>You control your data. You can export or delete it at any time in Settings.</Text>
          </View>

          <GradientButton label={'Agree and continue'} onPress={agree} disabled={!requiredOk} fullWidth />
        </ScrollView>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: { ...typo.h1, marginBottom: 4 },
  sub: { fontSize: 13, lineHeight: 19, marginBottom: spacing.lg },
  row: { flexDirection: 'row', gap: 12, borderWidth: 1, borderRadius: radii.lg, padding: 14, marginBottom: 12, alignItems: 'flex-start' },
  checkbox: { width: 24, height: 24, borderRadius: radii.sm, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  rowTitle: { fontWeight: '800', fontSize: 15, marginBottom: 2 },
  rowDesc: { fontSize: 12, lineHeight: 17 },
  linksRow: { marginTop: 4 },
  infoBox: { flexDirection: 'row', gap: 10, borderRadius: radii.lg, padding: 14, marginTop: 6, marginBottom: spacing.lg, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: 12, lineHeight: 17 },
});
