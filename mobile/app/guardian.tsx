/** Parent or Guardian (mock 03)
 * Sends a real guardian consent request via POST /api/junior/apply.
 * The backend requires a 16-17 year-old minor account and shows any
 * error honestly. Skip and browse only continues without a request.
 */
import { useState } from 'react';
import { Text, StyleSheet, View, Pressable, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { api, getToken } from '@/lib/api';
import { spacing, radii } from '@/constants/theme';

const GOLD = '#FFA726';
const TEAL = '#34D399';

export default function GuardianScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptics();
  const { success: okSound, error: errSound } = useSounds();
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [sending, setSending] = useState(false);

  async function send() {
    if (sending) return;
    if (name.trim().length < 2) { impact('error'); return; }
    if (phone.replace(/[^0-9]/g, '').length < 7) { impact('error'); return; }
    if (!getToken()) {
      impact('error');
      router.push('/login');
      return;
    }
    setSending(true);
    impact('medium');
    try {
      const fullPhone = '+234' + phone.replace(/[^0-9]/g, '').replace(/^0+/, '');
      const r = await api<{ application: { id: string }; devConsentCode?: string }>('/api/junior/apply', {
        method: 'POST',
        body: JSON.stringify({ guardianName: name.trim(), guardianPhone: fullPhone }),
      });
      okSound();
      impact('success');
      router.replace({
        pathname: '/guardian-waiting',
        params: { appId: r.application.id, name: name.trim(), phone: fullPhone, code: r.devConsentCode || '' },
      });
    } catch (e: any) {
      errSound();
      impact('error');
      const m = e.message || 'Could not send the request.';
      if (m.indexOf('16-17') > -1 || m.indexOf('minor') > -1) {
        Alert.alertSafe = undefined;
      }
      Alert.alert('Guardian request', m + ' The consent program is for 16-17 year-old accounts.');
    } finally {
      setSending(false);
    }
  }

  return (
    <SwipeBack>
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.h1, { color: colors.text }]}>Parent or guardian</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
          <Text style={[styles.h2, { color: colors.text }]}>Add a parent or guardian</Text>
          <Text style={[styles.sub, { color: colors.muted }]}>
            They approve your account and spending limit. They cannot read your messages.
          </Text>

          <Text style={[styles.label, { color: colors.muted }]}>Their phone number</Text>
          <View style={[styles.phoneRow, { borderColor: GOLD, backgroundColor: colors.surface }]}>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }}>NG +234</Text>
            <View style={styles.phoneDivider} />
            <TextInput
              style={{ flex: 1, color: colors.text, fontSize: 16, padding: 0 }}
              placeholder="802 555 0199"
              placeholderTextColor={colors.muted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/[^0-9 ]/g, ''))}
              maxLength={14}
            />
          </View>

          <Text style={[styles.label, { color: colors.muted }]}>Their name</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
            placeholder="Mrs. Okafor"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
            maxLength={80}
          />

          <View style={[styles.note, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="phone-portrait-outline" size={20} color={TEAL} />
            <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22, flex: 1, marginLeft: 12 }}>
              We send them a link and a code. Until they confirm, you can browse but not buy Tokens or send Gifts.
            </Text>
          </View>
        </ScrollView>

        <View style={{ marginBottom: spacing.lg }}>
          <Pressable onPress={send} disabled={sending} style={[styles.sendBtn, sending && { opacity: 0.6 }]} accessibilityLabel="Send request">
            <Text style={{ color: '#111', fontWeight: '900', fontSize: 20 }}>{sending ? 'Sending...' : 'Send request'}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              impact('light');
              router.push('/(tabs)/feed');
            }}
            hitSlop={10}
            style={{ paddingVertical: 16 }}
            accessibilityLabel="Skip and browse only"
          >
            <Text style={{ color: colors.muted, fontWeight: '800', fontSize: 16, textAlign: 'center' }}>Skip and browse only</Text>
          </Pressable>
        </View>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  h1: { fontSize: 17, fontWeight: '900', flex: 1, textAlign: 'center' },
  h2: { fontSize: 30, fontWeight: '900' },
  sub: { fontSize: 16, lineHeight: 24, marginTop: 8, marginBottom: spacing.lg },
  label: { fontSize: 15, fontWeight: '800', marginBottom: 10 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderRadius: radii.lg, paddingHorizontal: 16, minHeight: 60, marginBottom: 18 },
  phoneDivider: { width: 1, alignSelf: 'stretch', marginHorizontal: 12, backgroundColor: 'rgba(128,128,128,0.3)' },
  input: { borderWidth: 1.5, borderRadius: radii.lg, paddingHorizontal: 16, paddingVertical: 16, fontSize: 17, minHeight: 60 },
  note: { flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderRadius: radii.lg, padding: 16, marginTop: spacing.md },
  sendBtn: { backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: radii.full },
});
