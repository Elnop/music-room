import { SPACING } from '@constants';
import { NEOBRUTALISM_BORDERS, NEOBRUTALISM_SHADOWS, NEOBRUTALISM_TYPOGRAPHY } from './tokens';
import type { Theme } from './types';

export const pastelLimeTheme: Theme = {
  name: 'pastelLime',
  displayName: 'Lime Pastel',

  colors: {
    // Primary - Lime
    primary: '#84CC16', // Lime 500
    primaryLight: '#BEF264', // Lime 300
    primaryDark: '#65A30D', // Lime 600

    // Secondary - Rose pastel
    secondary: '#EC4899', // Pink 500
    secondaryLight: '#F9A8D4', // Pink 300

    // Accent - Violet pastel
    accent: '#8B5CF6', // Violet 500
    accentAlt: '#A78BFA', // Violet 400

    // Backgrounds - Jaune doux
    background: '#FEFCE8', // Yellow 50
    surface: '#FFFFFF', // Blanc
    surfaceAlt: '#FEF08A', // Yellow 200

    // Text colors
    text: '#1F2937', // Gray 800
    textSecondary: '#4B5563', // Gray 600
    textInverse: '#FFFFFF', // Blanc

    // Border
    border: '#000000', // Noir pur
    borderLight: '#374151', // Gray 700

    // State colors
    error: '#DC2626', // Red 600
    success: '#10B981', // Emerald 500
    warning: '#F59E0B', // Amber 500
    info: '#3B82F6', // Blue 500
  },

  borders: NEOBRUTALISM_BORDERS,
  shadows: NEOBRUTALISM_SHADOWS,
  typography: NEOBRUTALISM_TYPOGRAPHY,
  spacing: SPACING,
};
