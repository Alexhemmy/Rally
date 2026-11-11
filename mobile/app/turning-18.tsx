/** Turning 18 (mock 12).
 * What changes when Safe mode lifts: rivalry opt-in, cash gifting
 * (ID verification), self-set limits. Review my settings turns Safe
 * mode off and opens the settings; Keep Safe mode on keeps the
 * protections and goes back to the app. Both use the real persisted
 * Safe mode flag.
 */
import { useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';

const GOLD = '#FFA726';
const TEAL = '#34D399';

export default function Turning18Screen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const [name, setName] = useState('Tola');

  useEffect(() => {
    AsyncStorage.getItem('rally.profile')
      .then((raw) => {
        if (raw) {
          const prof = JSON.parse(raw);
          if (prof.name) setName(prof.name);
        }
      })
      .catch(() => undefined);
  }, []);

  function review() {
    impact('medium');
    AsyncStorage.setItem('rally.safeMode', JSON.stringify(false)).catch(() => undefined);
    router.push('/safe-mode');
  }

  function keepSafeMode() {
    impact('light');
    AsyncStorage.setItem('rally.safeMode', JSON.stringify(true)).catch(() => undefined);
    router.replace('/(tabs)/feed');
  }

  const rows: { label: string; action: string; onPress: () => void }[] = [
    { label: 'Rivalry and Call-Outs available', action: 'Opt-in', onPress: () => { impact('light'); router.push('/rivalries'); } },
    { label: 'Cash gifting available', action: 'Verify ID', onPress: () => { impact('light'); router.push('/verify-identity'); } },
    { label: 'You set your own limits', action: 'Review', onPress: () => { impact('light'); router.push('/spending-limits'); } },
  ];

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.center}>
          <LinearGradient colors={[GOLD, '#FF8A3D']} style={styles.heroTile}>
            <Ionicons name="sparkles" size={44} color="#1A1206" />
          </LinearGradient>
          <Text style={{ color: colors.text, fontWeight: '900', fontSize: 32, textAlign: 'center', marginTop: 20 }}>
            {'Happy 18th, ' + name}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 17, lineHeight: 24, textAlign: 'center', marginTop: 10 }}>
            Safe mode is now off. Here is what changes. You can keep any of it on.
          </Text>
        </View>

        <View style={{ marginTop: spacing.lg }}>
          {rows.map((r) => (
            <Pressable
              key={r.label}
              onPress={r.onPress}
              style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
              accessibilityLabel={r.label}
            >
              <View style={[styles.check, { backgroundColor: TEAL }]}>
                <Ionicons name="checkmark" size={16} color="#0B3B2E" />
              </View>
              <Text style={{ flex: 1, color: colors.text, fontWeight: '900', fontSize: 17 }}>{r.label}</Text>
              <Text style={{ color: colors.muted, fontWeight: '700', fontSize: 15 }}>{r.action}</Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.note, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="shield-checkmark-outline" size={20} color={TEAL} />
          <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 21, flex: 1, marginLeft: 12 }}>
            Your parent is unlinked and no longer sees your account.
          </Text>
        </View>

        <LinearGradient colors={[GOLD, '#FF8A3D']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.primaryBtn}>
          <Pressable onPress={review} style={styles.btnInner} accessibilityLabel="Review my settings">
            <Text style={{ color: '#1A1206', fontWeight: '900', fontSize: 18 }}>Review my settings</Text>
          </Pressable>
        </LinearGradient>
        <Pressable onPress={keepSafeMode} style={{ alignItems: 'center', marginTop: 16 }} accessibilityLabel="Keep Safe mode on">
          <Text style={{ color: colors.muted, fontWeight: '800', fontSize: 16 }}>Keep Safe mode on</Text>
        </Pressable>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', marginTop: spacing.xl },
  heroTile: { width: 120, height: 120, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: radii.lg, padding: 16, marginBottom: 12 },
  check: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  note: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radii.lg, padding: 16, marginTop: spacing.md },
  primaryBtn: { borderRadius: radii.full, marginTop: spacing.xl },
  btnInner: { width: '100%', alignItems: 'center', paddingVertical: 18, borderRadius: radii.full },
});
