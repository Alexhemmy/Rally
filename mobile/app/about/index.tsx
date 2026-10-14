import { Text, StyleSheet } from 'react-native';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { SwipeBack } from '@/components/SwipeBack';

export default function Page() {
  return (
    <SwipeBack>
      <Screen>
        <Text style={styles.h1}>About Rally</Text>
        <Text style={styles.muted}>Vision: Make supporting someone you love as easy as following them.</Text>
        <Text style={styles.muted}>Mission: Turn passive fandom into active support.</Text>
      </Screen>
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: spacing.sm, marginBottom: 12 },
  muted: { color: colors.muted, marginBottom: 8, fontSize: 14 },
});
