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
	/** Quieter than `borderLight`, for wide-screen separators. */
	borderSubtle: string;

	error: string;
	success: string;
	warning: string;
	info: string;
	/** Friends and the other people of a playlist. */
	people: string;
	radar: string;

	// FIXED_COLORS: the same in every theme.
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
