export const COLORS = {
  // Primary gradient
  primary: '#6C63FF',
  primaryLight: '#8B83FF',
  primaryDark: '#4A42E0',

  // Accent
  accent: '#FF6B9D',
  accentLight: '#FF8FB3',

  // Background
  background: '#0F0F1A',
  backgroundLight: '#1A1A2E',
  backgroundCard: '#16213E',
  backgroundCardLight: '#1C2A4A',

  // Surface
  surface: '#1E2A45',
  surfaceLight: '#253352',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A3BD',
  textMuted: '#6B6F8D',

  // Status
  success: '#00D68F',
  successLight: '#33E0A8',
  warning: '#FFAA00',
  warningLight: '#FFBB33',
  danger: '#FF3D71',
  dangerLight: '#FF6B8A',

  // Misc
  white: '#FFFFFF',
  black: '#000000',
  border: '#2A2D4A',
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Gradients (start, end)
  gradientPrimary: ['#6C63FF', '#BB8FCE'] as const,
  gradientAccent: ['#FF6B9D', '#FF8E53'] as const,
  gradientSuccess: ['#00D68F', '#00E6A0'] as const,
  gradientDark: ['#0F0F1A', '#1A1A2E'] as const,
  gradientCard: ['#1C2A4A', '#16213E'] as const,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZE = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
  display: 48,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 999,
};

export const SHADOWS = {
  small: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
};
