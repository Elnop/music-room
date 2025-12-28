import { SPACING } from '@constants';
import {
  NEOBRUTALISM_BORDERS,
  NEOBRUTALISM_SHADOWS,
  NEOBRUTALISM_TYPOGRAPHY,
} from '@/themes/tokens';
import type { Theme } from '@/themes/types';

export const originalTheme: Theme = {
  name: 'original',
  displayName: 'Original',

  colors: {
    // Primary - Vibrant Rose/Magenta
    primary: '#EA3E7A', // Rose magenta (primary buttons)
    primaryLight: '#F472B6', // Light rose (hover/active)
    primaryDark: '#BE185D', // Dark rose

    // Secondary - White
    secondary: '#FFFFFF', // White (secondary accents)
    secondaryLight: '#F5F5F5', // Off-white

    // Accent - White
    accent: '#FFFFFF', // White (highlights)
    accentAlt: '#E5E5E5', // Very light gray

    // Backgrounds - Dark for contrast
    background: '#0D0D0D', // Deep black (main background)
    surface: '#1A1A1A', // Black surface (cards, inputs)
    surfaceAlt: '#262626', // Dark gray (disabled surfaces)

    // Text colors
    text: '#FFFFFF', // White (main text)
    textSecondary: '#A3A3A3', // Light gray (secondary text)
    textInverse: '#000000', // Black (text on primary)

    // Border - White
    border: '#FFFFFF', // White for borders
    borderLight: '#404040', // Dark gray (subtle borders)

    // State colors
    error: '#EF4444', // Red
    success: '#22C55E', // Green
    warning: '#FBBF24', // Amber
    info: '#EA3E7A', // Rose
  },

  borders: NEOBRUTALISM_BORDERS,
  shadows: NEOBRUTALISM_SHADOWS,
  typography: NEOBRUTALISM_TYPOGRAPHY,
  spacing: SPACING,
};
