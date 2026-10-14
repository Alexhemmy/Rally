import { Text, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, Link } from 'expo-router';
import { Screen } from '@/components/Screen';
import { colors, spacing, radii } from '@/constants/theme';
import { SwipeBack } from '@/components/SwipeBack';

export default function MomentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <SwipeBack>
      <Screen>
        <Text style={styles.h1}>Moment</Text>
        <Text style={styles.muted}>ID: {String(id)}</Text>
        <View style={styles.card}>
          <Text style={styles.name}>Moment detail</Text>
          <Text style={styles.muted}>Photo, video, or text from a Favorite timeline.</Text>
          <Link href="/feed" asChild>
            <Text style={styles.link}>Back to feed</Text>
          </Link>
        </View>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  muted: { color: colors.muted, marginBottom: 8, fontSize: 14 },
  name: { color: colors.text, fontWeight: '700', fontSize: 16, marginBottom: 6 },
  link: { color: colors.primary, fontWeight: '700', marginTop: 12 },
  card: {
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1,
    borderColor: colors.border, padding: spacing.md, marginTop: 8,
  },
});
