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
    // Primary - Rose/Magenta vibrant
    primary: '#EA3E7A', // Rose magenta (boutons primaires)
    primaryLight: '#F472B6', // Rose clair (survol/actif)
    primaryDark: '#BE185D', // Rose foncé

    // Secondary - Blanc
    secondary: '#FFFFFF', // Blanc (accents secondaires)
    secondaryLight: '#F5F5F5', // Blanc cassé

    // Accent - Blanc
    accent: '#FFFFFF', // Blanc (highlights)
    accentAlt: '#E5E5E5', // Gris très clair

    // Backgrounds - Sombre pour contraste
    background: '#0D0D0D', // Noir profond (fond principal)
    surface: '#1A1A1A', // Noir surface (cartes, inputs)
    surfaceAlt: '#262626', // Gris sombre (surfaces désactivées)

    // Text colors
    text: '#FFFFFF', // Blanc (texte principal)
    textSecondary: '#A3A3A3', // Gris clair (texte secondaire)
    textInverse: '#000000', // Noir (texte sur primary)

    // Border - Blanc
    border: '#FFFFFF', // Blanc pour les bordures
    borderLight: '#404040', // Gris foncé (bordures subtiles)

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
