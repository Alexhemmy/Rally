/** Rally design system — tokens from the Rally UX & Styling Guide
 * Dark is default: ink #0C0D12, panel #15171F, gold #FFB429.
 * Light: warm paper #F6F4EF with deep gold #E8920A.
 * Flat UI: separation via 1px line borders, no shadows (Gift Burst excepted).
 */
import { Dimensions, PixelRatio, Platform, useWindowDimensions } from 'react-native';
import { useMemo } from 'react';

/* ------------------------------------------------------------------ */
/*  Brand tokens                                                       */
/* ------------------------------------------------------------------ */
const BRAND = {
  primary: '#FFB429',          // gold – primary action, Gifts, highlights
  primaryHover: '#FF8A1F',     // gold2 – second gradient stop
  primaryPressed: '#E5740B',
  gradient: ['#FFB429', '#FF8A1F'] as const,   // 135° gold → gold2
  gradientHot: ['#FFB429', '#8B7BFF'] as const, // gold → violet (special moments)
  accent: '#8B7BFF',           // violet – Diamond tier, informational
  accent2: '#33D6B5',
  warning: '#FBBF24',
  buttonLabel: '#2A1700',      // label on gold, passes contrast in both modes
} as const;

/* ------------------------------------------------------------------ */
/*  Full light / dark palettes                                         */
/* ------------------------------------------------------------------ */
export const palettes = {
  dark: {
    ...BRAND,
    primaryMuted: 'rgba(255, 180, 41, 0.14)',
    secondary: '#15171F',
    galactic: '#1E212C',
    bg: '#0C0D12',             // --ink
    surface: '#15171F',        // --panel
    surfaceElevated: '#1E212C',// --panel2
    surfaceHover: '#2A2E3C',
    text: '#F4F2EE',           // --text
    textSecondary: '#9CA1B4',  // --mute
    muted: '#9CA1B4',          // --mute
    dim: '#6B7086',            // --dim – placeholders and decoration only
    border: '#2A2E3C',         // --line
    borderSubtle: '#232634',
    success: '#33D6B5',        // --teal
    danger: '#FF5468',         // --coral
    tabInactive: '#9CA1B4',
    onPrimary: '#2A1700',
    overlay: 'rgba(0, 0, 0, 0.5)',   // 50% black scrim under sheets
    shadow: 'rgba(0, 0, 0, 0.35)',
  },
  light: {
    ...BRAND,
    primary: '#E8920A',
    primaryHover: '#E5740B',
    primaryPressed: '#C9650A',
    gradient: ['#E8920A', '#E5740B'] as const,
    gradientHot: ['#E8920A', '#6D5BF0'] as const,
    accent: '#6D5BF0',
    accent2: '#0B9680',
    primaryMuted: 'rgba(232, 146, 10, 0.12)',
    secondary: '#FFFFFF',
    galactic: '#ECE8E1',
    bg: '#F6F4EF',             // --ink light
    surface: '#FFFFFF',        // --panel light
    surfaceElevated: '#ECE8E1',// --panel2 light
    surfaceHover: '#E3DFD6',
    text: '#15151B',
    textSecondary: '#666B7E',
    muted: '#666B7E',
    dim: '#8F95A8',
    border: '#DEDAD1',
    borderSubtle: '#E8E4DC',
    success: '#0B9680',
    danger: '#E5384F',
    tabInactive: '#8F95A8',
    onPrimary: '#2A1700',
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(15, 17, 23, 0.08)',
  },
} as const;

export type ThemeColors = typeof palettes.dark;
export type ThemeMode = keyof typeof palettes;

/** Legacy export so existing screens keep working while we migrate */
export const colors: ThemeColors = palettes.dark;

/* ------------------------------------------------------------------ */
/*  Typography – Inter; tabular numerals for balances, prices, timers  */
/* ------------------------------------------------------------------ */
export const type = {
  display: { fontSize: 30, fontWeight: '800' as const, letterSpacing: -0.75, lineHeight: 34 },
  h1:      { fontSize: 25, fontWeight: '800' as const, letterSpacing: -0.5, lineHeight: 30 },
  h2:      { fontSize: 21, fontWeight: '800' as const, letterSpacing: -0.2, lineHeight: 26 },
  h3:      { fontSize: 17, fontWeight: '700' as const, letterSpacing: -0.1, lineHeight: 22 },
  body:    { fontSize: 15.5, fontWeight: '600' as const, lineHeight: 22 },
  bodyBold:{ fontSize: 15.5, fontWeight: '700' as const, lineHeight: 22 },
  secondary:{ fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12.5, fontWeight: '600' as const, lineHeight: 17 },
  micro:   { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.55, lineHeight: 14 },
  stat:    { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.4, lineHeight: 34 },
  hero:    { fontSize: 54, fontWeight: '900' as const, letterSpacing: -1, lineHeight: 60 },
  button:  { fontSize: 16, fontWeight: '700' as const, letterSpacing: -0.1 },
  input:   { fontSize: 16, fontWeight: '500' as const, lineHeight: 21 },
  nav:     { fontSize: 16, fontWeight: '700' as const, letterSpacing: 0 },
} as const;

/* ------------------------------------------------------------------ */
/*  Spacing (4px base) & radii – guide values                          */
/* ------------------------------------------------------------------ */
export const spacing = {
  xxs: 2,
  xs:  4,
  sm:  8,
  md2: 12,
  md:  16,
  lg2: 20,
  lg:  24,
  xl:  32,
  xxl: 44,
  xxxl: 64,
} as const;

export const radii = {
  xs:   6,    // tags, small badges
  sm:   11,   // icon wells
  md:   12,   // compact buttons, segmented control
  lg:   20,   // cards
  xl:   26,   // bottom sheets
  xxl:  36,
  full: 999,  // chips, pills, avatars
} as const;

/* ------------------------------------------------------------------ */
/*  Elevation – flat UI; shadows only on floating Gift Burst cards     */
/* ------------------------------------------------------------------ */
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 6,
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
    const horizontalPad = isPhone ? 16 : isTablet ? 28 : 18;
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
  press: 100,          // press feedback, ease-out
  chip: 175,           // switch, chip, tab change
  sheet: 280,          // sheet open/close cubic-bezier(.2,.8,.2,1)
  push: 300,           // screen push
  spring: { damping: 18, stiffness: 220, mass: 0.9 },
  springSoft: { damping: 22, stiffness: 160, mass: 1 },
  timingFast: 180,
  timingMed: 280,
  timingSlow: 420,
} as const;
