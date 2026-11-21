import type { TextStyle, ViewStyle } from 'react-native';
import type { Theme } from '@/shared/theme/types/themeTypes';

export function dialogStyles(theme: Theme): { body: ViewStyle; title: TextStyle } {
	return {
		body: { padding: theme.spacing.lg },
		title: {
			fontSize: theme.typography.sizes.xl,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
		},
	};
}
