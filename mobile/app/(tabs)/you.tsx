import { Text, StyleSheet, View, Switch } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, spacing, radii } from '@/constants/theme';
import { useState } from 'react';

/** Mobile-only profile tab: biometrics toggle, quiet hours, deep links */
export default function YouTab() {
  const [biometrics, setBiometrics] = useState(false);
  const [hapticsOn, setHapticsOn] = useState(true);

  return (
    <Screen>
      <Text style={styles.h1}>You</Text>
      <View style={styles.card}>
        <Text style={styles.h2}>Device security</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Unlock with biometrics</Text>
          <Switch
            value={biometrics}
            onValueChange={setBiometrics}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.text}
          />
        </View>
        <Text style={styles.muted}>Wire to expo-local-authentication when shipping store builds.</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.h2}>Feedback</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Haptic feedback</Text>
          <Switch
            value={hapticsOn}
            onValueChange={setHapticsOn}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.text}
          />
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.h2}>Links</Text>
        <Link href="/notifications" asChild>
          <View style={{ marginBottom: 10 }}>
            <PrimaryButton label="Notifications" onPress={() => {}} variant="ghost" />
          </View>
        </Link>
        <Link href="/support" asChild>
          <View style={{ marginBottom: 10 }}>
            <PrimaryButton label="Support" onPress={() => {}} variant="ghost" />
          </View>
        </Link>
        <Link href="/how-to-use" asChild>
          <View style={{ marginBottom: 10 }}>
            <PrimaryButton label="How to use" onPress={() => {}} variant="ghost" />
          </View>
        </Link>
        <Link href="/login" asChild>
          <View>
            <PrimaryButton label="Log in" onPress={() => {}} />
          </View>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: spacing.sm, marginBottom: 12 },
  h2: { color: colors.primaryHover, fontWeight: '600', marginBottom: 10 },
  muted: { color: colors.muted, fontSize: 12, marginTop: 8 },
  label: { color: colors.text, flex: 1, paddingRight: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: 10,
  },
});
