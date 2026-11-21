import type { TextStyle } from 'react-native';
import type { Theme } from '@/shared/theme/types/themeTypes';

export function pixelCaption(theme: Theme): TextStyle {
	return {
		fontSize: theme.typography.sizes.xs,
		fontFamily: theme.typography.families.mono,
		color: theme.colors.textSecondary,
	};
}
