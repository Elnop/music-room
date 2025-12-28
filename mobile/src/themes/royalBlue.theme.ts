import { SPACING } from '@constants';
import {
  NEOBRUTALISM_BORDERS,
  NEOBRUTALISM_SHADOWS,
  NEOBRUTALISM_TYPOGRAPHY,
} from '@/themes/tokens';
import type { Theme } from '@/themes/types';

export const royalBlueTheme: Theme = {
  name: 'royalBlue',
  displayName: 'Royal Blue',

  colors: {
    // Primary - Royal blue/Navy
    primary: '#1E3A8A', // Navy blue (primary buttons)
    primaryLight: '#3B82F6', // Bright blue (hover/active)
    primaryDark: '#1E293B', // Slate dark (text on primary)

    // Secondary - Cyan
    secondary: '#06B6D4', // Cyan (secondary accents)
    secondaryLight: '#22D3EE', // Cyan light

    // Accent - Yellow/Orange
    accent: '#FBBF24', // Amber (highlights)
    accentAlt: '#F59E0B', // Orange (secondary CTA)

    // Backgrounds - Light
    background: '#F8FAFC', // Slate 50 (main background)
    surface: '#FFFFFF', // White (cards, inputs)
    surfaceAlt: '#E2E8F0', // Slate 200 (disabled surfaces)

    // Text colors
    text: '#0F172A', // Slate 900 (main text)
    textSecondary: '#475569', // Slate 600 (secondary text)
    textInverse: '#FFFFFF', // White (text on primary)

    // Border - Always black in neobrutalism
    border: '#000000', // Pure black
    borderLight: '#1F2937', // Gray 800 (subtle borders)

    // State colors
    error: '#DC2626', // Red 600
    success: '#16A34A', // Green 600
    warning: '#EA580C', // Orange 600
    info: '#0891B2', // Cyan 600
  },

  borders: NEOBRUTALISM_BORDERS,
  shadows: NEOBRUTALISM_SHADOWS,
  typography: NEOBRUTALISM_TYPOGRAPHY,
  spacing: SPACING,
};
