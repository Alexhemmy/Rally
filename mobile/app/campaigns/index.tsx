/** Campaigns
 * Fundraising campaigns — funds go only to verified beneficiaries.
 */
import { Text, StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GlassCard, EmptyState } from '@/components/ui';
import { SwipeBack } from '@/components/SwipeBack';
import { useTheme } from '@/components/ThemeProvider';
import { spacing, radii, type as typo } from '@/constants/theme';
import { useSounds } from '@/hooks/useSounds';
import { useHaptics } from '@/hooks/useHaptics';

// Demo data — replace with API later
const CAMPAIGNS = [
  {
    id: 'demo',
    title: 'School supplies drive',
    category: 'Education',
    beneficiary: 'Verified NGO',
  },
];

export default function CampaignsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { click } = useSounds();
  const { impact } = useHaptics();

  return (
    <SwipeBack>
      <Screen>
        <Text style={[styles.h1, { color: colors.text }]}>Campaigns</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Funds go only to verified beneficiaries.
        </Text>

        {CAMPAIGNS.length === 0 ? (
          <EmptyState
            icon="heart-outline"
            title="No campaigns yet"
            body="Check back later for new fundraising drives."
          />
        ) : (
          <View style={{ gap: 12, marginTop: spacing.sm }}>
            {CAMPAIGNS.map((campaign) => (
              <GlassCard key={campaign.id}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {campaign.title}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 12 }}>
                  {campaign.category} · {campaign.beneficiary}
                </Text>

                <Pressable
                  onPress={() => {
                    click();
                    impact('light');
                    router.push(`/campaigns/${campaign.id}`);
                  }}
                  style={({ pressed }) => [
                    styles.linkRow,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>
                    View campaign
                  </Text>
                  <Text style={{ color: colors.primary, fontSize: 16 }}>›</Text>
                </Pressable>
              </GlassCard>
            ))}
          </View>
        )}
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: {
    ...typo.h1,
    marginTop: spacing.sm,
    marginBottom: 6,
  },
  subtitle: {
    ...typo.body,
    marginBottom: spacing.lg,
    lineHeight: 21,
  },
  title: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
