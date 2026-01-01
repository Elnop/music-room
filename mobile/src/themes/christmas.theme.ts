import { SPACING } from '@constants';
import {
  NEOBRUTALISM_BORDERS,
  NEOBRUTALISM_SHADOWS,
  NEOBRUTALISM_TYPOGRAPHY,
} from '@themes/tokens';
import type { Theme } from '@/themes/types';

export const christmasTheme: Theme = {
  name: 'christmas',
  displayName: 'Christmas',

  colors: {
    primary: '#DC2626',
    primaryLight: '#F87171',
    primaryDark: '#991B1B',

    secondary: '#16A34A',
    secondaryLight: '#4ADE80',

    accent: '#F59E0B',
    accentAlt: '#FBBF24',

    background: '#FFFBEB',
    surface: '#FFFFFF',
    surfaceAlt: '#FEE2E2',

    text: '#1F2937',
    textSecondary: '#4B5563',
    textInverse: '#FFFFFF',

    border: '#000000',
    borderLight: '#374151',

    error: '#B91C1C',
    success: '#15803D',
    warning: '#D97706',
    info: '#0891B2',
  },

  borders: NEOBRUTALISM_BORDERS,
  shadows: NEOBRUTALISM_SHADOWS,
  typography: NEOBRUTALISM_TYPOGRAPHY,
  spacing: SPACING,
};
