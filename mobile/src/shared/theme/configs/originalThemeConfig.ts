import {
	CONTROL_SIZES,
	FIXED_COLORS,
	INK,
	PIXEL_BORDERS,
	PIXEL_SHADOWS,
	PIXEL_TYPOGRAPHY,
	SPACING,
} from '@/shared/theme/configs/tokensThemeConfig';
import type { Theme } from '@/shared/theme/types/themeTypes';

export const originalTheme: Theme = {
	name: 'original',

	colors: {
		primary: '#C5F94A',
		primaryTint: '#C5F94A18',
		primaryTintStrong: '#C5F94A25',

		background: '#13111C',
		surface: '#1E1A2B',
		surfaceAlt: '#2A2440',

		text: '#FFF3DC',
		textSecondary: '#A79DBF',
		textInverse: INK,

		border: INK,
		borderLight: '#3B3358',
		borderSubtle: '#2A2440',

		error: '#FF5A4E',
		success: '#7BD66B',
		warning: '#FFC53D',
		info: '#62D2FF',
		radar: '#0C1710',
		people: '#FF6FA5',

		...FIXED_COLORS,
	},

	borders: PIXEL_BORDERS,
	shadows: PIXEL_SHADOWS,
	typography: PIXEL_TYPOGRAPHY,
	spacing: SPACING,
	controls: CONTROL_SIZES,
};
