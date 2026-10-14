/** Rally mobile — sky primary, galactic secondary, responsive tokens */
import { Dimensions, PixelRatio, Platform } from 'react-native';

export const colors = {
  primary: '#0EA5E9',
  primaryHover: '#38BDF8',
  primaryMuted: 'rgba(14, 165, 233, 0.15)',
  secondary: '#0B1D3A',
  galactic: '#1E3A5F',
  bg: '#070B14',
  surface: '#0F172A',
  surfaceElevated: '#152238',
  text: '#F0F9FF',
  muted: '#94A3B8',
  border: '#1E3A5F',
  success: '#34D399',
  danger: '#F87171',
  tabInactive: '#64748B',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const radii = { sm: 8, md: 12, lg: 16, xl: 24, full: 999 };

/** Breakpoints for phone / phablet / tablet */
export function useLayout() {
  const { width, height } = Dimensions.get('window');
  const isPhone = width < 390;
  const isCompact = width < 480;
  const isTablet = width >= 768;
  const isLandscape = width > height;
  const contentMax = isTablet ? 560 : width;
  const horizontalPad = isPhone ? 12 : isTablet ? 24 : 16;
  const columns = isTablet ? 3 : isCompact ? 2 : 2;
  const fontScale = Math.min(PixelRatio.getFontScale(), 1.3);
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
  };
}

export function scaleFont(size: number, fontScale = 1) {
  return Math.round(size * Math.min(fontScale, 1.25));
}
