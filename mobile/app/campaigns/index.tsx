import { Text, StyleSheet, View, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '@/components/Screen';
import { colors, spacing, radii } from '@/constants/theme';
import { useSounds } from '@/hooks/useSounds';
import { SwipeBack } from '@/components/SwipeBack';

export default function CampaignsScreen() {
  const { click } = useSounds();
  return (
    <SwipeBack>
      <Screen>
        <Text style={styles.h1}>Campaigns</Text>
        <Text style={styles.muted}>Funds go only to verified beneficiaries.</Text>
        <View style={styles.card}>
          <Text style={styles.name}>School supplies drive</Text>
          <Text style={styles.muted}>Education · verified NGO</Text>
          <Link href={"/campaigns/demo" as any} asChild>
            <Pressable onPress={() => click()} style={{ marginTop: 10 }}>
              <Text style={styles.link}>View campaign ›</Text>
            </Pressable>
          </Link>
        </View>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  muted: { color: colors.muted, marginBottom: 12, fontSize: 14 },
  name: { color: colors.text, fontWeight: '700', fontSize: 16 },
  link: { color: colors.primary, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1,
    borderColor: colors.border, padding: spacing.md, marginTop: 8,
  },
});
