/** Rally — brand-new "Ink & Frost" design system.
 * Only the sky-blue primary (#0EA5E9) carried over from the old theme.
 * Dark: deep ink with violet-gradient accents. Light: crisp cool white.
 */
import { Dimensions, PixelRatio, Platform } from 'react-native';

const BRAND = {
  primary: '#0EA5E9',
  primaryHover: '#38BDF8',
  gradient: ['#22D3EE', '#7C5CFC'] as const, // cyan → violet
  gradientHot: ['#F471B5', '#8B5CF6'] as const, // pink → violet (special)
  accent: '#8B5CF6',
  accent2: '#F471B5',
  warning: '#FBBF24',
};

/** Full palettes for the theme system. */
export const palettes = {
  dark: {
    ...BRAND,
    primaryMuted: 'rgba(34, 211, 238, 0.14)',
    secondary: '#121218',
    galactic: '#1A1A23',
    bg: '#09090F',
    surface: '#121218',
    surfaceElevated: '#1A1A23',
    text: '#F7F7FB',
    muted: '#8A8A9E',
    border: '#232330',
    success: '#34D399',
    danger: '#FB7185',
    tabInactive: '#5E5E75',
    onPrimary: '#FFFFFF',
  },
  light: {
    ...BRAND,
    primaryHover: '#0284C7',
    primaryMuted: 'rgba(14, 165, 233, 0.12)',
    secondary: '#FFFFFF',
    galactic: '#EEF3FB',
    bg: '#F7F9FE',
    surface: '#FFFFFF',
    surfaceElevated: '#EEF3FB',
    text: '#12131A',
    muted: '#667085',
    border: '#E4EAF3',
    success: '#059669',
    danger: '#E11D48',
    tabInactive: '#98A2B3',
    onPrimary: '#FFFFFF',
  },
};

export type ThemeColors = typeof palettes.dark;

/**
 * Legacy export — 30+ screens import `colors` directly, so pointing it at
 * the new Ink palette instantly re-skins every screen without touching them.
 */
export const colors: ThemeColors = palettes.dark;

/** Typography scale — friendly + bold, matching the rounded wordmark. */
export const type = {
  display: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.5 },
  h1: { fontSize: 24, fontWeight: '800' as const, letterSpacing: -0.3 },
  h2: { fontSize: 18, fontWeight: '800' as const },
  h3: { fontSize: 15, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '500' as const },
  micro: { fontSize: 11, fontWeight: '700' as const },
  stat: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.5 },
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const radii = { xs: 6, sm: 10, md: 14, lg: 20, xl: 28, full: 999 };

/** Breakpoints for phone / phablet / tablet */
export function useLayout() {
  const { width, height } = Dimensions.get('window');
  const isPhone = width < 390;
  const isCompact = width < 480;
  const isTablet = width >= 768;
  const isLandscape = width > height;
  const contentMax = isTablet ? 560 : width;
  const horizontalPad = isPhone ? 12 : isTablet ? 24 : 16;
  const columns = isTablet ? 3 : 2;
  const fontScale = Math.min(PixelRatio.getFontScale(), 1.3);
  return {
    width, height, isPhone, isCompact, isTablet, isLandscape,
    contentMax, horizontalPad, columns, fontScale,
    isIOS: Platform.OS === 'ios',
    isAndroid: Platform.OS === 'android',
  };
}

export function scaleFont(size: number, fontScale = 1) {
  return Math.round(size * Math.min(fontScale, 1.25));
}
