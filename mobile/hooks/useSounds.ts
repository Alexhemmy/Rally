import { Platform } from 'react-native';
import { useCallback, useRef } from 'react';
import { useHaptics } from './useHaptics';

export type SoundKind = 'click' | 'type' | 'success' | 'error' | 'whoosh';

let soundsEnabled = true;

export function setSoundsEnabled(on: boolean) {
  soundsEnabled = on;
}

export function getSoundsEnabled() {
  return soundsEnabled;
}

/** UI sounds via haptic stand-ins; optional expo-av assets later */
export function useSounds() {
  const { impact } = useHaptics();
  const lastTypeAt = useRef(0);

  const play = useCallback(
    async (kind: SoundKind) => {
      if (!soundsEnabled || Platform.OS === 'web') return;
      if (kind === 'type') {
        const now = Date.now();
        if (now - lastTypeAt.current < 40) return;
        lastTypeAt.current = now;
      }
      if (kind === 'click') impact('selection');
      else if (kind === 'type') impact('light');
      else if (kind === 'success') impact('success');
      else if (kind === 'error') impact('error');
      else if (kind === 'whoosh') impact('medium');
    },
    [impact]
  );

  return {
    play,
    click: () => play('click'),
    type: () => play('type'),
    success: () => play('success'),
    error: () => play('error'),
    whoosh: () => play('whoosh'),
    enabled: soundsEnabled,
    setEnabled: setSoundsEnabled,
  };
}
