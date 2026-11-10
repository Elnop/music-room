import { SPACING } from '@/shared/constants/app';
import { FIXED_COLORS, INK, PIXEL_BORDERS, PIXEL_SHADOWS, PIXEL_TYPOGRAPHY } from './tokens';
import type { Theme } from './types';

/** Night pixel art: violet ink ground, cream text, lime for the main action. */
export const originalTheme: Theme = {
	name: 'original',

	colors: {
		primary: '#C5F94A',

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
};
