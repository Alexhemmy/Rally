/** feedPrefs - Rally design
 * Client-side persisted feed and playback preferences (mock 25).
 * Stored in AsyncStorage under 'rally.feedPrefs'. No server endpoint
 * yet - these are device-local so the app stays calm and private.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FeedPrefs = {
  /** Autoplay for Moment videos: Wi-Fi only, always, or off */
  autoplay: 'wifi' | 'always' | 'off';
  startWithSound: boolean;
  captions: boolean;
  dataSaver: boolean;
  /** Show Following feed in strict time order (newest first) */
  timeOrder: boolean;
  /** Target language for post translation */
  translateLang: string;
  mutedWords: string[];
  mutedAccounts: string[];
  /** How much sensitive content to allow */
  sensitive: 'less' | 'default';
  /** Personalised ranking on/off */
  personalise: boolean;
};

export const DEFAULT_FEED_PREFS: FeedPrefs = {
  autoplay: 'wifi',
  startWithSound: false,
  captions: true,
  dataSaver: false,
  timeOrder: true,
  translateLang: 'English',
  mutedWords: [],
  mutedAccounts: [],
  sensitive: 'less',
  personalise: true,
};

const KEY = 'rally.feedPrefs';

export async function loadFeedPrefs(): Promise<FeedPrefs> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_FEED_PREFS };
    return { ...DEFAULT_FEED_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_FEED_PREFS };
  }
}

export async function saveFeedPrefs(patch: Partial<FeedPrefs>): Promise<FeedPrefs> {
  const current = await loadFeedPrefs();
  const next = { ...current, ...patch };
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage unavailable - keep in-memory value for this session
  }
  return next;
}

export async function addMutedWord(word: string): Promise<FeedPrefs> {
  const w = word.trim().toLowerCase();
  if (!w) return loadFeedPrefs();
  const current = await loadFeedPrefs();
  if (current.mutedWords.indexOf(w) >= 0) return current;
  return saveFeedPrefs({ mutedWords: current.mutedWords.concat([w]) });
}

export async function addMutedAccount(handle: string): Promise<FeedPrefs> {
  const h = (handle || '').replace(/^@/, '').trim().toLowerCase();
  if (!h) return loadFeedPrefs();
  const current = await loadFeedPrefs();
  if (current.mutedAccounts.indexOf(h) >= 0) return current;
  return saveFeedPrefs({ mutedAccounts: current.mutedAccounts.concat([h]) });
}
