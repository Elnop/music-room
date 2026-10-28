import { SPACING } from '@/shared/constants/app';
import { PIXEL_BORDERS, PIXEL_SHADOWS, PIXEL_TYPOGRAPHY } from './tokens';

export type ThemeName = 'original';

export interface ThemeColors {
	primary: string;

	background: string;
	surface: string;
	surfaceAlt: string;

	text: string;
	textSecondary: string;
	textInverse: string;

	border: string;
	borderLight: string;
	/** Separators of wide screens, quieter than `borderLight`. */
	borderSubtle: string;

	error: string;
	success: string;
	warning: string;
	info: string;

	// Fixed across themes (FIXED_COLORS in tokens.ts)
	divider: string;
	googleSurface: string;
	googleBorder: string;
	googleMark: string;
	googleText: string;
	facebook: string;
	onFacebook: string;
	onColor: string;
	backdrop: string;
	shadow: string;
}

export interface Theme {
	name: ThemeName;
	colors: ThemeColors;
	borders: typeof PIXEL_BORDERS;
	shadows: typeof PIXEL_SHADOWS;
	typography: typeof PIXEL_TYPOGRAPHY;
	spacing: typeof SPACING;
}

export interface ThemeContextValue {
	theme: Theme;
}
