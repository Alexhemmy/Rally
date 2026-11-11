/** Payout account (mock 10) - where cash-outs go.
 * Bank picker, account number, account name with a verified-name line
 * and the 48 hour fraud note. Saved locally (rally.payoutAccount);
 * the payout API takes the destination string at request time.
 */
import { useEffect, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { GradientButton } from '@/components/GradientButton';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { spacing, radii } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#FFA726';
const TEAL = '#34D399';

const BANKS = [
  'GTBank', 'Access Bank', 'Kuda', 'Moniepoint', 'Opay',
  'First Bank', 'UBA', 'Zenith Bank', 'Sterling Bank', 'Wema Bank',
];

export default function PayoutAccountScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const { click, success } = useSounds();

  const [bank, setBank] = useState('');
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [numFocus, setNumFocus] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('rally.payoutAccount');
        if (raw) {
          const a = JSON.parse(raw);
          setBank(a.bank || '');
          setNumber(a.number || '');
          setName(a.name || '');
        }
      } catch { /* fresh */ }
    })();
  }, []);

  const ready = bank.length > 1 && number.length === 10 && name.trim().length > 2;

  async function saveAccount() {
    if (!ready || saving) return;
    setSaving(true);
    impact('medium');
    try {
      await AsyncStorage.setItem('rally.payoutAccount', JSON.stringify({ bank, number, name: name.trim() }));
      success();
      impact('success');
      router.back();
    } catch { /* local only */ }
    setSaving(false);
  }

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Payout account</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={[styles.intro, { color: colors.textSecondary }]}>
            Cash-outs go to this account. The name must match your verified ID.
          </Text>

          {/* Bank */}
          <Text style={[styles.label, { color: colors.text }]}>Bank</Text>
          <Pressable
            onPress={() => { impact('light'); click(); setPickerOpen(!pickerOpen); }}
            style={[styles.select, { backgroundColor: colors.surface, borderColor: colors.border }]}
            accessibilityLabel="Choose bank"
          >
            <Text style={{ color: bank ? colors.text : colors.muted, fontSize: 17, fontWeight: '600' }}>
              {bank || 'Choose your bank'}
            </Text>
            <Ionicons name={pickerOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
          </Pressable>
          {pickerOpen ? (
            <View style={[styles.bankList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {BANKS.map((b) => (
                <Pressable
                  key={b}
                  onPress={() => { impact('light'); click(); setBank(b); setPickerOpen(false); }}
                  style={[styles.bankRow, bank === b && { backgroundColor: GOLD + '1a' }]}
                >
                  <Text style={{ color: bank === b ? GOLD : colors.text, fontSize: 15, fontWeight: '700' }}>{b}</Text>
                  {bank === b ? <Ionicons name="checkmark" size={16} color={GOLD} /> : null}
                </Pressable>
              ))}
            </View>
          ) : null}

          {/* Account number */}
          <Text style={[styles.label, { color: colors.text }]}>Account number</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.surface, borderColor: numFocus ? GOLD : colors.border, color: colors.text },
            ]}
            value={number}
            onChangeText={(t) => setNumber(t.replace(/[^0-9]/g, '').slice(0, 10))}
            onFocus={() => setNumFocus(true)}
            onBlur={() => setNumFocus(false)}
            keyboardType="number-pad"
            maxLength={10}
            placeholder="0123456789"
            placeholderTextColor={colors.muted}
          />

          {/* Account name */}
          <Text style={[styles.label, { color: colors.text }]}>Account name</Text>
          <View style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: 'row', alignItems: 'center' }]}>
            <TextInput
              style={{ flex: 1, color: colors.text, fontSize: 17, fontWeight: '600', padding: 0 }}
              value={name}
              onChangeText={setName}
              autoCapitalize="characters"
              placeholder="MIA ADEBAYO"
              placeholderTextColor={colors.muted}
            />
            {name.trim().length > 2 ? <Ionicons name="checkmark" size={20} color={TEAL} /> : null}
          </View>
          {name.trim().length > 2 ? (
            <Text style={{ color: TEAL, fontWeight: '800', fontSize: 14, marginTop: 8 }}>
              Name matches your verified ID
            </Text>
          ) : null}

          {/* Fraud note */}
          <View style={[styles.note, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Ionicons name="time-outline" size={16} color={TEAL} />
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              Changing your payout account pauses cash-outs for 48 hours to protect you from fraud.
            </Text>
          </View>
        </ScrollView>

        <GradientButton
          label={saving ? 'Saving\u2026' : 'Save account'}
          onPress={saveAccount}
          disabled={!ready || saving}
          accessibilityLabel="Save account"
        />
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  h1: { fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  intro: { fontSize: 16, lineHeight: 23, marginBottom: spacing.md },
  label: { fontSize: 15, fontWeight: '800', marginTop: spacing.md, marginBottom: 8 },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  bankList: { borderWidth: 1, borderRadius: radii.md, marginTop: 8, overflow: 'hidden' },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    minHeight: 56,
    fontSize: 17,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: 14,
    marginTop: spacing.md,
  },
  noteText: { flex: 1, fontSize: 14, lineHeight: 20 },
});
