import { SPACING } from '@constants';
import {
  NEOBRUTALISM_BORDERS,
  NEOBRUTALISM_SHADOWS,
  NEOBRUTALISM_TYPOGRAPHY,
} from '@/themes/tokens';
import type { Theme } from '@/themes/types';

export const royalBlueTheme: Theme = {
  name: 'royalBlue',
  displayName: 'Bleu Roi',

  colors: {
    // Primary - Bleu roi/Navy
    primary: '#1E3A8A', // Navy blue (boutons primaires)
    primaryLight: '#3B82F6', // Bright blue (survol/actif)
    primaryDark: '#1E293B', // Slate dark (texte sur primary)

    // Secondary - Cyan
    secondary: '#06B6D4', // Cyan (accents secondaires)
    secondaryLight: '#22D3EE', // Cyan light

    // Accent - Jaune/Orange
    accent: '#FBBF24', // Amber (highlights)
    accentAlt: '#F59E0B', // Orange (CTA secondaires)

    // Backgrounds - Clair
    background: '#F8FAFC', // Slate 50 (fond principal)
    surface: '#FFFFFF', // Blanc (cartes, inputs)
    surfaceAlt: '#E2E8F0', // Slate 200 (surfaces désactivées)

    // Text colors
    text: '#0F172A', // Slate 900 (texte principal)
    textSecondary: '#475569', // Slate 600 (texte secondaire)
    textInverse: '#FFFFFF', // Blanc (texte sur primary)

    // Border - Toujours noir en néobrutalism
    border: '#000000', // Noir pur
    borderLight: '#1F2937', // Gray 800 (bordures subtiles)

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
