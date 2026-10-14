import { Share, Platform } from 'react-native';

export async function shareFavorite(handle: string, displayName?: string) {
  const url = `https://rally.app/f/${handle}`;
  const message =
    Platform.OS === 'ios'
      ? `Support ${displayName || handle} on Rally`
      : `Support ${displayName || handle} on Rally\n${url}`;
  try {
    await Share.share(
      Platform.OS === 'ios' ? { message, url } : { message, title: 'Rally' }
    );
    return true;
  } catch {
    return false;
  }
}

export async function shareMoment(title: string, id: string) {
  const url = `https://rally.app/moments/${id}`;
  try {
    await Share.share({ message: `${title}\n${url}`, title: 'Rally Moment' });
    return true;
  } catch {
    return false;
  }
}
