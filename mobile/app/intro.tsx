/** Intro tour - Rally design (screens 02-05)
 * Four swipeable pages: Moments, Gifts, Community, Fair and Safe.
 * Skip jumps straight to Welcome. Last page says Get started.
 */
import { useRef, useState } from 'react';
import { Text, StyleSheet, View, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GradientButton } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing, radii, type as typo } from '@/constants/theme';

const GOLD = '#FFA726';
const PURPLE = '#7C4DFF';
const GREEN = '#34D399';

function MomentsPage() {
  return (
    <View style={pageStyles.wrap}>
      <Text style={pageStyles.h1}>Moments from the people you love</Text>
      <Text style={pageStyles.body}>Short videos, behind-the-scenes and live sessions from Favorites across music, comedy, film and more.</Text>
      <View style={pageStyles.stage}>
        <View style={pageStyles.phoneFrame}>
          <LinearGradient colors={[PURPLE, GOLD] as [string, string]} style={pageStyles.phone}>
            <View style={pageStyles.play}><Ionicons name={'play'} size={30} color={'#fff'} /></View>
          </LinearGradient>
          <View style={pageStyles.videoLabel}>
            <Ionicons name={'mic'} size={13} color={'#111'} />
            <Text style={pageStyles.videoText}>Mia Adebayo {•} Worship set</Text>
          </View>
        </View>
        <View style={pageStyles.sideIcons}>
          <Ionicons name={'heart'} size={22} color={'#BDBDBD'} />
          <Ionicons name={'chatbubbles'} size={22} color={'#BDBDBD'} />
          <Ionicons name={'gift'} size={22} color={'#BDBDBD'} />
          <Ionicons name={'cloud-upload-outline'} size={22} color={'#BDBDBD'} />
        </View>
      </View>
    </View>
  );
}

function GiftsPage() {
  const gifts = [
    { icon: 'heart', label: 'Rose' },
    { icon: 'crown', label: 'Crown' },
    { icon: 'flame', label: 'Fire' },
    { icon: 'star', label: 'Star' },
  ];
  return (
    <View style={pageStyles.wrap}>
      <View style={pageStyles.giftCard}>
        <LinearGradient colors={['#F57C00', '#E64A19'] as [string, string]} style={pageStyles.giftGradient}>
          <View style={pageStyles.giftRow}>
            {gifts.map((g) => (
              <View key={g.label} style={pageStyles.giftChip}>
                <Ionicons name={g.icon as any} size={18} color={'#fff'} />
                <Text style={pageStyles.giftChipText}>{g.label}</Text>
              </View>
            ))}
          </View>
          <Ionicons name={'gift'} size={64} color={'#fff'} />
          <Text style={pageStyles.giftSent}>+ {₦}500 sent</Text>
        </LinearGradient>
      </View>
      <Text style={pageStyles.h1Bottom}>Say it with a Gift</Text>
      <Text style={pageStyles.body}>Send a Gift in a tap during a Moment or live session. See the price in Tokens and naira before you pay.</Text>
    </View>
  );
}

function CommunityPage() {
  return (
    <View style={pageStyles.wrap}>
      <View style={pageStyles.chatCard}>
        <LinearGradient colors={['#5C6BC0', PURPLE] as [string, string]} style={pageStyles.chatGradient}>
          <View style={pageStyles.bubble}>
            <Text style={pageStyles.bubbleName}>Ada {•} Fan Club</Text>
            <Text style={pageStyles.bubbleText}>That bridge gave me chills.</Text>
          </View>
          <View style={[pageStyles.bubble, pageStyles.bubbleLeft]}>
            <Text style={pageStyles.bubbleName}>Chinedu</Text>
            <Text style={pageStyles.bubbleText}>Replying to Ada: same, I replayed it five times.</Text>
          </View>
          <View style={[pageStyles.bubble, pageStyles.bubbleMine]}>
            <Text style={[pageStyles.bubbleName, { color: 'rgba(255,255,255,0.85)' }]}>You</Text>
            <Text style={pageStyles.bubbleMineText}>Anyone joining the live room tonight?</Text>
          </View>
          <View style={pageStyles.roomPill}>
            <Ionicons name={'people'} size={14} color={'#fff'} />
            <Text style={pageStyles.roomText}>1,204 in the room</Text>
          </View>
        </LinearGradient>
      </View>
      <Text style={pageStyles.h1Bottom}>Join the conversation</Text>
      <Text style={pageStyles.body}>Threads, chat rooms and fan clubs. Reply, translate and find your people in your own language.</Text>
    </View>
  );
}

function FairPage() {
  const bars = [
    { n: '1', label: 'Consistency', fill: 0.6 },
    { n: '2', label: 'Community love', fill: 0.45 },
    { n: '3', label: 'Activity', fill: 0.75 },
  ];
  return (
    <View style={pageStyles.wrap}>
      <View style={pageStyles.shield}>
        <Ionicons name={'shield-checkmark'} size={40} color={'#fff'} />
      </View>
      <View style={{ gap: 12, alignSelf: 'stretch', marginBottom: spacing.lg }}>
        {bars.map((b) => (
          <View key={b.label} style={{ alignSelf: 'stretch' }}>
            <Text style={pageStyles.barLabel}>{b.n} {b.label}</Text>
            <View style={pageStyles.barTrack}>
              <View style={[pageStyles.barFill, { flex: b.fill }]} />
              <View style={{ flex: 1 - b.fill }} />
            </View>
          </View>
        ))}
      </View>
      <View style={pageStyles.rankPill}>
        <Text style={pageStyles.rankText}>Spending never changes rank</Text>
      </View>
      <Text style={pageStyles.h1Bottom}>Fair by design</Text>
      <Text style={pageStyles.body}>Rankings reward activity and community, never money. Spending limits and Safe mode are built in.</Text>
    </View>
  );
}

export default function IntroScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { impact } = useHaptics();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const pages = [MomentsPage, GiftsPage, CommunityPage, FairPage];

  function goNext() {
    impact('light');
    if (page >= pages.length - 1) {
      router.replace('/welcome' as any);
      return;
    }
    scrollRef.current && scrollRef.current.scrollTo({ x: (page + 1) * width, animated: true });
  }

  return (
    <Screen>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => { impact('light'); router.replace('/welcome' as any); }}>
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        scrollEventThrottle={16}
      >
        {pages.map((P, i) => (
          <View key={i} style={{ width, paddingHorizontal: spacing.lg }}>
            <P />
          </View>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {pages.map((_, i) => (
          <View key={i} style={[styles.dot, page === i ? styles.dotOn : null]} />
        ))}
      </View>
      <GradientButton
        label={page >= pages.length - 1 ? 'Get started' : 'Next'}
        onPress={goNext}
        fullWidth
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  skip: { color: '#fff', fontWeight: '800', fontSize: 14, paddingVertical: 6 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: spacing.md },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotOn: { backgroundColor: GOLD, width: 22 },
});

const pageStyles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', gap: 14 },
  h1: { ...typo.h1, color: '#fff', fontSize: 26, lineHeight: 34 },
  h1Bottom: { ...typo.h1, color: '#fff', fontSize: 26, lineHeight: 34, textAlign: 'center' },
  body: { color: '#BDBDBD', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  stage: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  phoneFrame: { alignItems: 'center' },
  phone: { width: 170, height: 300, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  play: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  videoLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: GOLD, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.full, marginTop: 12 },
  videoText: { color: '#111', fontWeight: '800', fontSize: 12 },
  sideIcons: { marginLeft: 14, gap: 22 },
  giftCard: { alignSelf: 'stretch', borderRadius: radii.lg, overflow: 'hidden', marginBottom: 6 },
  giftGradient: { alignItems: 'center', paddingVertical: 26, gap: 14 },
  giftRow: { flexDirection: 'row', gap: 18 },
  giftChip: { alignItems: 'center', gap: 4 },
  giftChipText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  giftSent: { color: '#fff', fontWeight: '900', fontSize: 16 },
  chatCard: { alignSelf: 'stretch', borderRadius: radii.lg, overflow: 'hidden', marginBottom: 6 },
  chatGradient: { padding: 18, gap: 10, minHeight: 240, justifyContent: 'flex-end' },
  bubble: { alignSelf: 'flex-end', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: radii.lg, borderTopRightRadius: 4, paddingHorizontal: 14, paddingVertical: 10, maxWidth: 240 },
  bubbleLeft: { alignSelf: 'flex-start', borderTopLeftRadius: 4, borderTopRightRadius: radii.lg },
  bubbleMine: { backgroundColor: GOLD },
  bubbleName: { color: '#616161', fontSize: 10, fontWeight: '800', marginBottom: 2 },
  bubbleText: { color: '#212121', fontSize: 13, lineHeight: 18 },
  bubbleMineText: { color: '#111', fontSize: 13, lineHeight: 18, fontWeight: '600' },
  roomPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: 6, backgroundColor: 'rgba(124,77,255,0.9)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: radii.full, marginTop: 6 },
  roomText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  shield: { width: 84, height: 84, borderRadius: 42, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 4 },
  barLabel: { color: '#fff', fontWeight: '800', fontSize: 13, marginBottom: 6 },
  barTrack: { flexDirection: 'row', height: 10, borderRadius: 5, backgroundColor: 'rgba(52,211,153,0.18)', overflow: 'hidden' },
  barFill: { backgroundColor: GREEN },
  rankPill: { alignSelf: 'center', backgroundColor: 'rgba(52,211,153,0.18)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: radii.full, marginBottom: 4 },
  rankText: { color: GREEN, fontWeight: '800', fontSize: 12 },
});