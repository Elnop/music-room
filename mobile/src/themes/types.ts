import { SPACING } from '@constants';
import {
  NEOBRUTALISM_BORDERS,
  NEOBRUTALISM_SHADOWS,
  NEOBRUTALISM_TYPOGRAPHY,
} from '@/themes/tokens';

export type ThemeName = 'royalBlue' | 'christmas' | 'pastelLime';

export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;

  // Secondary colors
  secondary: string;
  secondaryLight: string;

  // Accent colors
  accent: string;
  accentAlt: string;

  // Backgrounds
  background: string;
  surface: string;
  surfaceAlt: string;

  // Text colors
  text: string;
  textSecondary: string;
  textInverse: string;

  // Border colors (always black in neobrutalism)
  border: string;
  borderLight: string;

  // State colors
  error: string;
  success: string;
  warning: string;
  info: string;
}

export interface Theme {
  name: ThemeName;
  displayName: string;
  colors: ThemeColors;
  borders: typeof NEOBRUTALISM_BORDERS;
  shadows: typeof NEOBRUTALISM_SHADOWS;
  typography: typeof NEOBRUTALISM_TYPOGRAPHY;
  spacing: typeof SPACING;
}

export interface ThemeContextValue {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
}
