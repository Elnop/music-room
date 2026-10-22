import { SPACING } from '@/shared/constants/app';
import {
	FIXED_COLORS,
	NEOBRUTALISM_BORDERS,
	NEOBRUTALISM_SHADOWS,
	NEOBRUTALISM_TYPOGRAPHY,
} from './tokens';
import type { Theme } from './types';

export const pastelLimeTheme: Theme = {
	name: 'pastelLime',
	displayName: 'Lime Pastel',

	colors: {
		primary: '#84CC16',
		primaryLight: '#BEF264',
		primaryDark: '#65A30D',

		secondary: '#EC4899',
		secondaryLight: '#F9A8D4',

		accent: '#8B5CF6',
		accentAlt: '#A78BFA',

		background: '#FEFCE8',
		surface: '#FFFFFF',
		surfaceAlt: '#FEF08A',

		text: '#1F2937',
		textSecondary: '#4B5563',
		textInverse: '#FFFFFF',

		border: '#000000',
		borderLight: '#374151',

		error: '#DC2626',
		success: '#10B981',
		warning: '#F59E0B',
		info: '#3B82F6',

		...FIXED_COLORS,
	},

	borders: NEOBRUTALISM_BORDERS,
	shadows: NEOBRUTALISM_SHADOWS,
	typography: NEOBRUTALISM_TYPOGRAPHY,
	spacing: SPACING,
};
