/** Onboarding
 * Part of registration — step by step, synced to the account so it
 * resumes on any device or after the app closes. KYC is excluded:
 * identity verification is optional and can be done later.
 */
import { ReactNode, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, Switch, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '@/components/Screen';
import { GradientButton, GlassCard, Chip, Avatar } from '@/components/ui';
import { SoundTextInput } from '@/components/SoundTextInput';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, radii, type as typo } from '@/constants/theme';
import { api, getToken } from '@/lib/api';
import { getApiUrl } from '@/lib/config';
import {
  isBiometricLockEnabled,
  setBiometricLockEnabled,
  biometricAvailable,
} from '@/components/BiometricGate';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';

const STEP_LABELS = ['Profile', 'Bio', 'Role', 'Security'];

export default function OnboardingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const { colors } = useTheme();
  const { impact } = useHaptics();
  const { success, click, error: errSound } = useSounds();

  const [booting, setBooting] = useState(true);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [role, setRole] = useState<'FAN' | 'FAVORITE'>(
    params.role === 'FAVORITE' ? 'FAVORITE' : 'FAN'
  );
  const [bioAvail, setBioAvail] = useState(false);
  const [bioEnabled, setBioEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const avail = await biometricAvailable();
        setBioAvail(avail.available);
        setBioEnabled(await isBiometricLockEnabled());
      } catch {
        // device without biometrics — toggle stays hidden
      }
      try {
        if (!getToken()) {
          router.replace('/login');
          return;
        }
        const res: any = await api('/api/auth/me');
        const me = res.user || res;
        if (me.onboardingCompleted) {
          router.replace('/');
          return;
        }
        if (typeof me.onboardingStep === 'number' && me.onboardingStep >= 1) {
          setStep(Math.min(4, Math.max(1, me.onboardingStep)));
        }
        setDisplayName(me.displayName || '');
        setAvatarUrl(me.avatarUrl || '');
        setBio(me.bio || '');
      } catch {
        // network hiccup — continue with local defaults
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  async function persistStep(n: number) {
    try {
      await api('/api/auth/onboarding/progress', {
        method: 'POST',
        body: JSON.stringify({ step: n }),
      });
    } catch {
      // progress is best-effort; step still advances locally
    }
  }

  async function saveProfile(patch: Record<string, unknown>): Promise<boolean> {
    setBusy(true);
    try {
      await api('/api/users/me', { method: 'PATCH', body: JSON.stringify(patch) });
      success();
      return true;
    } catch (e: any) {
      errSound();
      Alert.alert('Could not save', e.message || 'Please check your connection and try again.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function pickAvatar() {
    click();
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to choose a profile photo.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (res.canceled || !res.assets || !res.assets[0].base64) return;
    const asset = res.assets[0];
    setBusy(true);
    try {
      const up = await api<{ media: { url: string; absoluteUrl?: string } }>('/api/media/upload', {
        method: 'POST',
        body: JSON.stringify({ mimeType: asset.mimeType || 'image/jpeg', base64: asset.base64 }),
      });
      const base = await getApiUrl();
      setAvatarUrl(up.media.absoluteUrl || base + up.media.url);
      success();
    } catch (e: any) {
      errSound();
      Alert.alert('Avatar', e.message || 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  async function nextFromProfile() {
    if (!displayName.trim()) {
      Alert.alert('Profile', 'Please add a display name.');
      return;
    }
    const patch: Record<string, unknown> = { displayName: displayName.trim() };
    if (avatarUrl) patch.avatarUrl = avatarUrl;
    if (!(await saveProfile(patch))) return;
    await persistStep(2);
    impact('light');
    setStep(2);
  }

  async function nextFromBio() {
    if (!(await saveProfile({ bio: bio.trim() }))) return;
    await persistStep(3);
    impact('light');
    setStep(3);
  }

  async function startFavoritePurchase() {
    setBusy(true);
    try {
      const res = await api<{
        granted?: boolean;
        checkout?: { authorizationUrl?: string; mode?: string };
      }>('/api/upgrades/purchase-favorite-role', { method: 'POST', body: '{}' });
      if (res.checkout && res.checkout.authorizationUrl) {
        await Linking.openURL(res.checkout.authorizationUrl);
        Alert.alert(
          'Complete payment',
          'Finish the payment in your browser, then come back and tap "I have paid".'
        );
      } else {
        // mock/dev mode granted instantly
        await finishRoleStep();
      }
    } catch (e: any) {
      errSound();
      Alert.alert('Upgrade', e.message || 'Could not start checkout.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmFavoritePurchase() {
    setBusy(true);
    try {
      const res = await api<{ granted: boolean; status?: string }>(
        '/api/upgrades/purchase-favorite-role/confirm',
        { method: 'POST', body: '{}' }
      );
      if (!res.granted) {
        Alert.alert(
          'Payment pending',
          'We have not received your payment yet. Tap "I have paid" again once it is complete.'
        );
        return;
      }
      await finishRoleStep();
    } catch (e: any) {
      errSound();
      Alert.alert('Upgrade', e.message || 'Could not confirm payment.');
    } finally {
      setBusy(false);
    }
  }

  async function finishRoleStep() {
    await persistStep(4);
    impact('success');
    setStep(4);
  }

  async function complete() {
    setBusy(true);
    try {
      await setBiometricLockEnabled(bioEnabled && bioAvail);
      await api('/api/auth/onboarding/complete', { method: 'POST', body: '{}' });
      success();
      impact('success');
      Alert.alert('Welcome to Rally', 'Your account is ready. Enjoy the rally!', [
        { text: 'Let us go', onPress: () => router.replace('/') },
      ]);
    } catch (e: any) {
      errSound();
      Alert.alert('Onboarding', e.message || 'Could not finish onboarding.');
    } finally {
      setBusy(false);
    }
  }

  if (booting) {
    return (
      <Screen>
        <Text style={{ color: colors.muted, marginTop: spacing.lg, textAlign: 'center' }}>
          Loading…
        </Text>
      </Screen>
    );
  }

  const card = (children: ReactNode) => (
    <GlassCard style={{ marginTop: spacing.sm }}>{children}</GlassCard>
  );

  return (
    <Screen>
      {/* Step indicator */}
      <View style={styles.stepsRow}>
        {STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <Pressable
              key={label}
              onPress={() => {
                if (n < step) {
                  click();
                  setStep(n);
                }
              }}
              style={[styles.stepChip, active && { backgroundColor: colors.primary }]}
            >
              <Text
                style={{
                  color: active ? '#fff' : done ? colors.primary : colors.muted,
                  fontWeight: '800',
                  fontSize: 12,
                }}
              >
                {done ? '✓ ' : ''}
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {step === 1 && (
        <>
          <Text style={[styles.h1, { color: colors.text }]}>Your profile</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            This is how you appear on Rally. You can change it anytime.
          </Text>
          {card(
            <>
              <Pressable onPress={pickAvatar} style={styles.avatarWrap}>
                <Avatar name={displayName || 'R'} size={72} ring uri={avatarUrl || undefined} />
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>
                  {avatarUrl ? 'Change photo' : 'Add photo (optional)'}
                </Text>
              </Pressable>
              <Text style={[styles.label, { color: colors.muted }]}>Display name</Text>
              <SoundTextInput
                style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
                placeholder="How you appear"
                placeholderTextColor={colors.muted}
                value={displayName}
                onChangeText={setDisplayName}
                maxLength={40}
              />
              <GradientButton
                label="Continue"
                onPress={nextFromProfile}
                loading={busy}
                disabled={busy}
                fullWidth
              />
            </>
          )}
        </>
      )}

      {step === 2 && (
        <>
          <Text style={[styles.h1, { color: colors.text }]}>Your bio</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Tell people what you are about. This is optional but helps others find you.
          </Text>
          {card(
            <>
              <SoundTextInput
                style={[
                  styles.input,
                  styles.area,
                  { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text },
                ]}
                placeholder="A few words about you…"
                placeholderTextColor={colors.muted}
                value={bio}
                onChangeText={setBio}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
              <GradientButton
                label="Continue"
                onPress={nextFromBio}
                loading={busy}
                disabled={busy}
                fullWidth
              />
            </>
          )}
        </>
      )}

      {step === 3 && (
        <>
          <Text style={[styles.h1, { color: colors.text }]}>Your role</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Everyone starts as a Fan. You can become a Favorite now with a one-time
            payment, or later by meeting the free upgrade checklist.
          </Text>
          {card(
            <>
              <View style={styles.roleRow}>
                <Chip label="Fan" active={role === 'FAN'} onPress={() => { click(); setRole('FAN'); }} />
                <Chip label="Favorite" active={role === 'FAVORITE'} onPress={() => { click(); setRole('FAVORITE'); }} />
              </View>
              {role === 'FAVORITE' ? (
                <View style={{ gap: 10 }}>
                  <GradientButton
                    label="Pay & become a Favorite"
                    icon="card-outline"
                    onPress={startFavoritePurchase}
                    loading={busy}
                    disabled={busy}
                    fullWidth
                  />
                  <GradientButton
                    label="I have paid — confirm"
                    variant="ghost"
                    onPress={confirmFavoritePurchase}
                    loading={busy}
                    disabled={busy}
                    fullWidth
                  />
                  <Text style={[styles.kycNote, { color: colors.muted }]}>
                    After payment you are a Favorite. KYC (identity verification) is
                    optional and can be completed later from Dashboard → Verify to unlock payouts.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 10 }}>
                  <GradientButton
                    label="Continue as a Fan"
                    onPress={finishRoleStep}
                    loading={busy}
                    disabled={busy}
                    fullWidth
                  />
                  <Text style={[styles.kycNote, { color: colors.muted }]}>
                    As a Fan you can follow others, share Moments and gift creators.
                    You can upgrade to Favorite anytime.
                  </Text>
                </View>
              )}
            </>
          )}
        </>
      )}

      {step === 4 && (
        <>
          <Text style={[styles.h1, { color: colors.text }]}>Security</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Lock Rally with FaceID or fingerprint. If biometrics fail, your device
            passcode is used.
          </Text>
          {card(
            <>
              {bioAvail ? (
                <View style={styles.toggleRow}>
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600', flex: 1 }}>
                    Enable app lock (biometrics + passcode)
                  </Text>
                  <Switch
                    value={bioEnabled}
                    onValueChange={(v) => {
                      impact('light');
                      setBioEnabled(v);
                    }}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>
              ) : (
                <Text style={[styles.kycNote, { color: colors.muted }]}>
                  App lock is not available on this device.
                </Text>
              )}
              <GradientButton
                label="Finish registration"
                onPress={complete}
                loading={busy}
                disabled={busy}
                fullWidth
              />
            </>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stepsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  stepChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  h1: {
    ...typo.h1,
    marginBottom: 6,
  },
  subtitle: {
    ...typo.body,
    marginBottom: spacing.md,
    lineHeight: 21,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    marginBottom: 14,
    minHeight: 50,
  },
  area: {
    minHeight: 120,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  kycNote: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
});
