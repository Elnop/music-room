import { SPACING } from '@/shared/constants/app';
import { NEOBRUTALISM_BORDERS, NEOBRUTALISM_SHADOWS, NEOBRUTALISM_TYPOGRAPHY } from './tokens';

export type ThemeName = 'royalBlue' | 'christmas' | 'pastelLime' | 'original';

export interface ThemeColors {
	primary: string;
	primaryLight: string;
	primaryDark: string;

	secondary: string;
	secondaryLight: string;

	accent: string;
	accentAlt: string;

	background: string;
	surface: string;
	surfaceAlt: string;

	text: string;
	textSecondary: string;
	textInverse: string;

	border: string;
	borderLight: string;

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
