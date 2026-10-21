/** Campaign Detail
 * View a fundraising campaign with transparency info and donate action.
 */
import { Text, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GradientButton, GlassCard, SectionHeader } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, radii, type as typo } from '@/constants/theme';
import { useHaptics } from '@/hooks/useHaptics';

export default function CampaignDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { impact } = useHaptics();

  const campaignId = String(id || 'unknown');

  return (
    <SwipeBack>
      <Screen>
        <Text style={[styles.h1, { color: colors.text }]}>Campaign</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          ID: {campaignId}
        </Text>

        {/* Overview */}
        <GlassCard style={{ marginBottom: spacing.md }}>
          <Text style={[styles.campaignTitle, { color: colors.text }]}>
            School supplies drive
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14, marginBottom: 4 }}>
            Education · Verified NGO
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
            Help provide essential school materials to students in need. Every contribution goes directly to verified beneficiaries.
          </Text>
        </GlassCard>

        {/* Transparency */}
        <GlassCard style={{ marginBottom: spacing.md }}>
          <SectionHeader title="Transparency" />

          <View style={styles.bulletRow}>
            <Text style={{ color: colors.primary, fontSize: 16 }}>•</Text>
            <Text style={[styles.bulletText, { color: colors.muted }]}>
              Raised amounts, fees, and payouts shown with dates
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <Text style={{ color: colors.primary, fontSize: 16 }}>•</Text>
            <Text style={[styles.bulletText, { color: colors.muted }]}>
              Payee is a verified organization only
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <Text style={{ color: colors.primary, fontSize: 16 }}>•</Text>
            <Text style={[styles.bulletText, { color: colors.muted }]}>
              Full audit trail available after campaign ends
            </Text>
          </View>
        </GlassCard>

        {/* Donate */}
        <GlassCard>
          <GradientButton
            label="Donate"
            onPress={() => {
              impact('medium');
              // Wire real donation flow later
            }}
            fullWidth
          />
          <Text
            style={{
              color: colors.muted,
              fontSize: 12,
              textAlign: 'center',
              marginTop: 12,
              lineHeight: 17,
            }}
          >
            Donations are processed securely and go only to the verified beneficiary.
          </Text>
        </GlassCard>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: {
    ...typo.h1,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: spacing.lg,
  },
  campaignTitle: {
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
