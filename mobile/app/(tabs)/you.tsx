import { Text, StyleSheet, View, Switch } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, spacing, radii } from '@/constants/theme';
import { useState, useCallback } from 'react';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds, setSoundsEnabled, getSoundsEnabled } from '@/hooks/useSounds';

export default function YouTab() {
  const { impact, enabled, setEnabled } = useHaptics();
  const { click } = useSounds();
  const [soundOn, setSoundOn] = useState(getSoundsEnabled());
  const [biometrics, setBiometrics] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    impact('selection');
    await new Promise((r) => setTimeout(r, 500));
    setRefreshing(false);
  }, [impact]);

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Text style={styles.h1}>You</Text>
      <View style={styles.card}>
        <Text style={styles.h2}>Sounds & haptics</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Click / type feedback</Text>
          <Switch
            value={soundOn}
            onValueChange={(v) => {
              setSoundOn(v);
              setSoundsEnabled(v);
              if (v) click();
            }}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.text}
          />
        </View>
        <Text style={styles.muted}>UI ticks for taps and typing (haptic stand-in; add expo-av + mp3 for real audio).</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.h2}>Haptics</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Vibration feedback</Text>
          <Switch
            value={enabled}
            onValueChange={(v) => {
              setEnabled(v);
              if (v) impact('success');
            }}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.text}
          />
        </View>
        <Text style={styles.muted}>Affects buttons, gifts, pull-to-refresh, and selection taps.</Text>
        <PrimaryButton
          label="Test haptic"
          variant="ghost"
          onPress={() => impact('medium')}
          style={{ marginTop: 12 }}
        />
      </View>
      <View style={styles.card}>
        <Text style={styles.h2}>Device security</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Unlock with biometrics</Text>
          <Switch
            value={biometrics}
            onValueChange={(v) => {
              setBiometrics(v);
              impact('selection');
            }}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.text}
          />
        </View>
        <Text style={styles.muted}>Wire to expo-local-authentication for store builds.</Text>
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
