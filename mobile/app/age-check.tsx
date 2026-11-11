/** Age Check (mock 01)
 * Day / month / year fields with a live age readout. Under 13 cannot
 * continue; under 18 continues to the Safe mode welcome; 18+ continues
 * to sign up. The age is stored on this device and drives Safe mode
 * defaults; the server keeps the real date of birth from registration.
 */
import { useMemo, useState } from 'react';
import { Text, StyleSheet, View, Pressable, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { spacing, radii } from '@/constants/theme';

const GOLD = '#FFA726';
const TEAL = '#34D399';
const RED = '#E9355B';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function AgeCheckScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();
  const { click } = useSounds();
  const router = useRouter();

  const [day, setDay] = useState('');
  const [monthIdx, setMonthIdx] = useState<number | null>(null);
  const [year, setYear] = useState('');

  const age = useMemo(() => {
    const d = Number(day);
    const y = Number(year);
    if (!d || d < 1 || d > 31 || monthIdx === null || !y || y < 1900) return null;
    const now = new Date();
    const bd = new Date(y, monthIdx, d);
    if (bd.getDate() !== d || bd.getMonth() !== monthIdx) return null;
    let a = now.getFullYear() - y;
    const before = now.getMonth() < monthIdx || (now.getMonth() === monthIdx && now.getDate() < d);
    if (before) a -= 1;
    return a >= 0 && a < 130 ? a : null;
  }, [day, monthIdx, year]);

  const under13 = age !== null && age < 13;
  const under18 = age !== null && age < 18;

  function cont() {
    if (age === null) {
      Alert.alert('Your age', 'Enter your full date of birth first.');
      return;
    }
    if (under13) {
      Alert.alert('Rally is for ages 13 and up', 'We cannot change your birthday later without help from support.');
      return;
    }
    impact('medium');
    AsyncStorage.multiSet([
      ['rally.age', String(age)],
      ['rally.safeMode', under18 ? 'true' : 'false'],
    ]).catch(() => undefined);
    if (under18) router.push('/safe-mode-welcome');
    else router.push('/signup');
  }

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Your age</Text>
          <View style={{ width: 26 }} />
        </View>

        <Text style={[styles.h2, { color: colors.text }]}>When is your birthday?</Text>
        <Text style={[styles.sub, { color: colors.muted }]}>
          We use this to give you the right protections. It is never shown on your profile.
        </Text>

        <View style={styles.fields}>
          <View style={[styles.field, { borderColor: GOLD, backgroundColor: colors.surface }]}>
            <TextInput
              style={{ color: colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center', flex: 1, padding: 0 }}
              placeholder="14"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              maxLength={2}
              value={day}
              onChangeText={(t) => setDay(t.replace(/[^0-9]/g, ''))}
              accessibilityLabel="Day"
            />
          </View>
          <Pressable
            style={[styles.field, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={() => {
              impact('light');
              click();
              setMonthIdx(((monthIdx === null ? -1 : monthIdx) + 1) % 12);
            }}
            accessibilityLabel="Month - tap to change"
          >
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>
              {monthIdx === null ? 'Month' : MONTHS[monthIdx]}
            </Text>
          </Pressable>
          <View style={[styles.field, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <TextInput
              style={{ color: colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center', flex: 1, padding: 0 }}
              placeholder="2010"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              maxLength={4}
              value={year}
              onChangeText={(t) => setYear(t.replace(/[^0-9]/g, ''))}
              accessibilityLabel="Year"
            />
          </View>
        </View>

        {age !== null && !under13 ? (
          <View style={[styles.note, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="shield-checkmark-outline" size={20} color={TEAL} />
            <Text style={{ color: colors.muted, fontSize: 16, lineHeight: 23, flex: 1, marginLeft: 12 }}>
              {'You are ' + age + '. ' + (under18 ? 'Rally will set up Safe mode so you can enjoy it with extra protection.' : 'You get the full Rally experience.')}
            </Text>
          </View>
        ) : null}

        <View style={[styles.note, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="lock-closed-outline" size={20} color={TEAL} />
          <Text style={{ color: colors.muted, fontSize: 16, lineHeight: 23, flex: 1, marginLeft: 12 }}>
            {'You must be 13 or older to use Rally. We cannot change your birthday later without help from support.'}
          </Text>
        </View>

        <View style={{ marginTop: 'auto', marginBottom: spacing.lg }}>
          <LinearGradient colors={under13 ? ['#6b5b45', GOLD] as [string, string] : ['#F7B733', GOLD] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.contBtn}>
            <Pressable onPress={cont} style={{ width: '100%', alignItems: 'center', paddingVertical: 18 }} accessibilityLabel="Continue">
              <Text style={{ color: '#111', fontWeight: '900', fontSize: 20 }}>Continue</Text>
            </Pressable>
          </LinearGradient>
        </View>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  h1: { fontSize: 17, fontWeight: '900', flex: 1, textAlign: 'center' },
  h2: { fontSize: 32, fontWeight: '900' },
  sub: { fontSize: 16, lineHeight: 24, marginTop: 8, marginBottom: spacing.lg },
  fields: { flexDirection: 'row', gap: 12 },
  field: { flex: 1, borderWidth: 2, borderRadius: radii.lg, minHeight: 64, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  note: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radii.lg, padding: 16, marginTop: spacing.md },
  contBtn: { borderRadius: radii.full, overflow: 'hidden' },
});
