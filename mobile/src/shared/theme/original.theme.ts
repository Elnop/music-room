import { SPACING } from '@/shared/constants/app';
import {
	FIXED_COLORS,
	NEOBRUTALISM_BORDERS,
	NEOBRUTALISM_SHADOWS,
	NEOBRUTALISM_TYPOGRAPHY,
} from './tokens';
import type { Theme } from './types';

export const originalTheme: Theme = {
	name: 'original',

	colors: {
		primary: '#EA3E7A',
		primaryLight: '#F472B6',
		primaryDark: '#BE185D',

		secondary: '#FFFFFF',
		secondaryLight: '#F5F5F5',

		accent: '#FFFFFF',
		accentAlt: '#E5E5E5',

		background: '#0D0D0D',
		surface: '#1A1A1A',
		surfaceAlt: '#262626',

		text: '#FFFFFF',
		textSecondary: '#A3A3A3',
		textInverse: '#000000',

		border: '#FFFFFF',
		borderLight: '#404040',
		borderSubtle: '#2E2E2E',

		error: '#EF4444',
		success: '#22C55E',
		warning: '#FBBF24',
		info: '#EA3E7A',

		...FIXED_COLORS,
	},

	borders: NEOBRUTALISM_BORDERS,
	shadows: NEOBRUTALISM_SHADOWS,
	typography: NEOBRUTALISM_TYPOGRAPHY,
	spacing: SPACING,
};
