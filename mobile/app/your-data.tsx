/** Your Data (UX 50) - Rally design
 * Data export and account deletion. Neither endpoint exists in the
 * backend yet, so both buttons explain what is real instead of
 * faking a download - and deletion points to support.
 */
import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#FFA726';
const GOLD_DEEP = '#F57C00';
const TEAL = '#34D399';
const RED = '#E9355B';

const SCOPES = ['Everything', 'Receipts only'] as const;

export default function YourDataScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();

  const [scope, setScope] = useState<'Everything' | 'Receipts only'>('Everything');

  useEffect(() => {
    AsyncStorage.getItem('rally.exportScope').then((v) => {
      if (v === 'Receipts only') setScope('Receipts only');
    }).catch(() => undefined);
  }, []);

  function pickScope(s: 'Everything' | 'Receipts only') {
    impact('light');
    setScope(s);
    AsyncStorage.setItem('rally.exportScope', s).catch(() => undefined);
  }

  function requestExport() {
    impact('medium');
    Alert.alert(
      'Data export is coming',
      'The export backend is not live yet, so Rally will not fake a download. When it ships, this button prepares a copy of your ' + (scope === 'Everything' ? 'profile, activity, Gifts and receipts' : 'receipts') + ' within 24 hours.'
    );
  }

  function deleteAccount() {
    impact('medium');
    Alert.alert(
      'Delete my account',
      'Spend any Tokens first, because they cannot be refunded or withdrawn. Account deletion is not available in the app yet - until it ships, message support and we will delete your account for you.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Contact support', onPress: () => router.push('/support') },
      ]
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
          <Text style={[styles.h1, { color: colors.text }]}>Your data</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Export card */}
          <View style={[styles.exportCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <View style={styles.exportHead}>
              <View style={[styles.exportIcon, { backgroundColor: GOLD + '22' }]}>
                <Ionicons name="download-outline" size={22} color={GOLD} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '900', fontSize: 18 }}>Get a copy of your data</Text>
                <Text style={{ color: colors.muted, fontSize: 14, marginTop: 2 }}>Profile, activity, Gifts and receipts</Text>
              </View>
            </View>
            <View style={styles.scopeRow}>
              {SCOPES.map((s) => {
                const on = scope === s;
                return (
                  <Pressable
                    key={s}
                    onPress={() => pickScope(s)}
                    style={[styles.scopeChip, on ? { borderColor: GOLD, backgroundColor: GOLD + '1a' } : { backgroundColor: colors.surface, borderColor: 'transparent' }]}
                    accessibilityLabel={s}
                  >
                    <Text style={{ color: on ? GOLD : colors.text, fontWeight: '800', fontSize: 14 }}>{s}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable onPress={requestExport} style={styles.exportBtn} accessibilityLabel="Request export">
              <Text style={{ color: '#111', fontWeight: '900', fontSize: 17 }}>Request export</Text>
            </Pressable>
          </View>

          {/* Export status - honest */}
          <View style={[styles.statusCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <View style={[styles.statusDot, { backgroundColor: colors.border }]}>
              <Ionicons name="time-outline" size={18} color={colors.muted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16 }}>No exports yet</Text>
              <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
                When an export is ready it stays here for 7 days.
              </Text>
            </View>
          </View>

          {/* Delete account */}
          <Text style={[styles.section, { color: colors.muted }]}>DELETE ACCOUNT</Text>
          <View style={[styles.deleteCard, { borderColor: RED + '66' }]}>
            <Text style={{ color: colors.text, fontSize: 16, lineHeight: 24 }}>
              Deleting removes your profile, comments and Collections. Spend any Tokens first, because they cannot be refunded or withdrawn.
            </Text>
            <View style={[styles.lawNote, { borderColor: colors.border }]}>
              <Ionicons name="library-outline" size={18} color={TEAL} />
              <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20, flex: 1 }}>
                Financial records are kept for as long as the law requires.
              </Text>
            </View>
            <Pressable onPress={deleteAccount} style={[styles.deleteBtn, { borderColor: RED }]} accessibilityLabel="Delete my account">
              <Text style={{ color: RED, fontWeight: '900', fontSize: 17 }}>Delete my account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  exportCard: { borderWidth: 1, borderRadius: radii.lg, padding: 16 },
  exportHead: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  exportIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  scopeRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  scopeChip: { borderWidth: 1.5, borderRadius: radii.full, paddingHorizontal: 18, paddingVertical: 9 },
  exportBtn: { backgroundColor: GOLD, borderRadius: radii.lg, paddingVertical: 16, alignItems: 'center', marginTop: 14 },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: radii.lg, padding: 16, marginTop: spacing.md },
  statusDot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  section: { fontSize: 12, fontWeight: '900', letterSpacing: 1, marginTop: spacing.lg, marginBottom: 8 },
  deleteCard: { borderWidth: 1.5, borderRadius: radii.lg, padding: 16 },
  lawNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: radii.md, padding: 12, marginTop: 14 },
  deleteBtn: { borderWidth: 1.5, borderRadius: radii.lg, paddingVertical: 15, alignItems: 'center', marginTop: 14 },
});
