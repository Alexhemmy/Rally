/** Rally design system — gold on dark
 * Primary: gold (#FFA726) with deep orange hover (#F57C00)
 * Dark: near-black #0D0D0D with #121212 surfaces
 * Light: crisp white with warm gold accents
 * Focus: friendly, high-contrast, mobile-first, interactive-ready
 */
import { Dimensions, PixelRatio, Platform, useWindowDimensions } from 'react-native';
import { useMemo } from 'react';

/* ------------------------------------------------------------------ */
/*  Brand tokens                                                       */
/* ------------------------------------------------------------------ */
const BRAND = {
  primary: '#FFA726',          // gold – the rally accent
  primaryHover: '#F57C00',
  primaryPressed: '#E65100',
  gradient: ['#FFA726', '#F57C00'] as const,   // gold → deep orange
  gradientHot: ['#FFA726', '#7C4DFF'] as const, // gold → purple (special moments)
  accent: '#7C4DFF',
  accent2: '#00897B',
  warning: '#FBBF24',
} as const;

/* ------------------------------------------------------------------ */
/*  Full light / dark palettes                                         */
/* ------------------------------------------------------------------ */
export const palettes = {
  dark: {
    ...BRAND,
    primaryMuted: 'rgba(255, 167, 38, 0.14)',
    secondary: '#121212',
    galactic: '#1A1A1A',
    bg: '#0D0D0D',
    surface: '#121212',
    surfaceElevated: '#1A1A1A',
    surfaceHover: '#222222',
    text: '#F7F7FB',
    textSecondary: '#C4C4D4',
    muted: '#8A8A9E',
    border: '#232323',
    borderSubtle: '#1C1C1C',
    success: '#34D399',
    danger: '#FB7185',
    tabInactive: '#5E5E75',
    onPrimary: '#FFFFFF',
    overlay: 'rgba(13, 13, 13, 0.72)',
    shadow: 'rgba(0, 0, 0, 0.45)',
  },
  light: {
    ...BRAND,
    primaryHover: '#F57C00',
    primaryPressed: '#E65100',
    primaryMuted: 'rgba(255, 167, 38, 0.12)',
    secondary: '#FFFFFF',
    galactic: '#EEF3FB',
    bg: '#F7F9FE',
    surface: '#FFFFFF',
    surfaceElevated: '#F0F4FA',
    surfaceHover: '#E8EEF7',
    text: '#0F1117',
    textSecondary: '#3F4654',
    muted: '#667085',
    border: '#E4EAF3',
    borderSubtle: '#EEF2F8',
    success: '#059669',
    danger: '#E11D48',
    tabInactive: '#98A2B3',
    onPrimary: '#FFFFFF',
    overlay: 'rgba(15, 17, 23, 0.45)',
    shadow: 'rgba(15, 17, 23, 0.08)',
  },
} as const;

export type ThemeColors = typeof palettes.dark;
export type ThemeMode = keyof typeof palettes;

/** Legacy export so existing screens keep working while we migrate */
export const colors: ThemeColors = palettes.dark;

/* ------------------------------------------------------------------ */
/*  Typography – friendly, bold, highly legible on small screens       */
/* ------------------------------------------------------------------ */
export const type = {
  display: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.6, lineHeight: 38 },
  h1:      { fontSize: 24, fontWeight: '800' as const, letterSpacing: -0.4, lineHeight: 30 },
  h2:      { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.2, lineHeight: 24 },
  h3:      { fontSize: 15, fontWeight: '700' as const, letterSpacing: -0.1, lineHeight: 20 },
  body:    { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodyBold:{ fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  micro:   { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.3, lineHeight: 14 },
  stat:    { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.5, lineHeight: 32 },
  button:  { fontSize: 15, fontWeight: '700' as const, letterSpacing: -0.1 },
} as const;

/* ------------------------------------------------------------------ */
/*  Spacing & radii – consistent rhythm                                */
/* ------------------------------------------------------------------ */
export const spacing = {
  xxs: 2,
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
  xxxl: 64,
} as const;

export const radii = {
  xs:   6,
  sm:   10,
  md:   14,
  lg:   20,
  xl:   28,
  xxl:  36,
  full: 999,
} as const;

/* ------------------------------------------------------------------ */
/*  Shadows – soft, modern, theme-aware                                */
/* ------------------------------------------------------------------ */
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color: string = BRAND.primary) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  }),
} as const;

/* ------------------------------------------------------------------ */
/*  Layout helpers – mobile-first & highly responsive                  */
/* ------------------------------------------------------------------ */
export function useLayout() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isPhone     = width < 390;
    const isCompact   = width < 480;
    const isTablet    = width >= 768;
    const isLandscape = width > height;

    const contentMax    = isTablet ? 640 : width;
    const horizontalPad = isPhone ? 14 : isTablet ? 28 : 18;
    const columns       = isTablet ? 3 : isCompact ? 2 : 2;
    const fontScale     = Math.min(PixelRatio.getFontScale(), 1.3);

    return {
      width,
      height,
      isPhone,
      isCompact,
      isTablet,
      isLandscape,
      contentMax,
      horizontalPad,
      columns,
      fontScale,
      isIOS: Platform.OS === 'ios',
      isAndroid: Platform.OS === 'android',
      // Handy derived values
      bottomSafe: Platform.OS === 'ios' ? 34 : 16,
      topSafe: Platform.OS === 'ios' ? 44 : 24,
    };
  }, [width, height]);
}

/** Scale a font size while respecting system accessibility settings */
export function scaleFont(size: number, fontScale = 1) {
  return Math.round(size * Math.min(fontScale, 1.25));
}

/** Quick helper for consistent horizontal padding */
export function contentPadding(horizontalPad: number) {
  return { paddingHorizontal: horizontalPad };
}

/* ------------------------------------------------------------------ */
/*  Animation presets (for use with Reanimated / Moti / etc.)          */
/* ------------------------------------------------------------------ */
export const motion = {
  spring: { damping: 18, stiffness: 220, mass: 0.9 },
  springSoft: { damping: 22, stiffness: 160, mass: 1 },
  timingFast: 180,
  timingMed: 280,
  timingSlow: 420,
} as const;
