import { SPACING } from '@/shared/constants/app';
import { NEOBRUTALISM_BORDERS, NEOBRUTALISM_SHADOWS, NEOBRUTALISM_TYPOGRAPHY } from './tokens';
import type { Theme } from './types';

export const royalBlueTheme: Theme = {
	name: 'royalBlue',
	displayName: 'Royal Blue',

	colors: {
		primary: '#1E3A8A',
		primaryLight: '#3B82F6',
		primaryDark: '#1E293B',

		secondary: '#06B6D4',
		secondaryLight: '#22D3EE',

		accent: '#FBBF24',
		accentAlt: '#F59E0B',

		background: '#F8FAFC',
		surface: '#FFFFFF',
		surfaceAlt: '#E2E8F0',

		text: '#0F172A',
		textSecondary: '#475569',
		textInverse: '#FFFFFF',

		border: '#000000',
		borderLight: '#1F2937',

		error: '#DC2626',
		success: '#16A34A',
		warning: '#EA580C',
		info: '#0891B2',
	},

	borders: NEOBRUTALISM_BORDERS,
	shadows: NEOBRUTALISM_SHADOWS,
	typography: NEOBRUTALISM_TYPOGRAPHY,
	spacing: SPACING,
};
