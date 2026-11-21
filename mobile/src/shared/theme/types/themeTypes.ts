import type {
	CONTROL_SIZES,
	PIXEL_BORDERS,
	PIXEL_SHADOWS,
	PIXEL_TYPOGRAPHY,
	SPACING,
} from '@/shared/theme/configs/tokensConfig';

export type ThemeName = 'original';

export type ThemeColors = {
	primary: string;
	primaryTint: string;
	primaryTintStrong: string;

	background: string;
	surface: string;
	surfaceAlt: string;

	text: string;
	textSecondary: string;
	textInverse: string;

	border: string;
	borderLight: string;
	borderSubtle: string;

	error: string;
	success: string;
	warning: string;
	info: string;
	people: string;
	radar: string;

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
};

export type Theme = {
	name: ThemeName;
	colors: ThemeColors;
	borders: typeof PIXEL_BORDERS;
	shadows: typeof PIXEL_SHADOWS;
	typography: typeof PIXEL_TYPOGRAPHY;
	spacing: typeof SPACING;
	controls: typeof CONTROL_SIZES;
};

export type ThemeContextValue = {
	theme: Theme;
};
