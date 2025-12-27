import { SPACING } from '@constants';
import {
  NEOBRUTALISM_BORDERS,
  NEOBRUTALISM_SHADOWS,
  NEOBRUTALISM_TYPOGRAPHY,
} from '@themes/tokens';
import type { Theme } from '@/themes/types';

export const christmasTheme: Theme = {
  name: 'christmas',
  displayName: 'Noël',

  colors: {
    // Primary - Rouge Noël
    primary: '#DC2626', // Red 600
    primaryLight: '#F87171', // Red 400
    primaryDark: '#991B1B', // Red 800

    // Secondary - Vert Noël
    secondary: '#16A34A', // Green 600
    secondaryLight: '#4ADE80', // Green 400

    // Accent - Or
    accent: '#F59E0B', // Amber 500 (or)
    accentAlt: '#FBBF24', // Amber 400 (or clair)

    // Backgrounds - Crème
    background: '#FFFBEB', // Amber 50
    surface: '#FFFFFF', // Blanc
    surfaceAlt: '#FEE2E2', // Red 100 (teinte rouge subtile)

    // Text colors
    text: '#1F2937', // Gray 800
    textSecondary: '#4B5563', // Gray 600
    textInverse: '#FFFFFF', // Blanc

    // Border
    border: '#000000', // Noir pur
    borderLight: '#374151', // Gray 700

    // State colors
    error: '#B91C1C', // Red 700
    success: '#15803D', // Green 700
    warning: '#D97706', // Amber 600
    info: '#0891B2', // Cyan 600
  },

  borders: NEOBRUTALISM_BORDERS,
  shadows: NEOBRUTALISM_SHADOWS,
  typography: NEOBRUTALISM_TYPOGRAPHY,
  spacing: SPACING,
};
