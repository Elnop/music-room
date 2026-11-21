import type { ViewStyle } from 'react-native';
import type { Theme } from '@/shared/theme/types/themeTypes';

export function friendRowLayout(theme: Theme): { friendRow: ViewStyle; textContainer: ViewStyle } {
	return {
		friendRow: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingVertical: theme.spacing.sm,
			gap: theme.spacing.md,
		},
		textContainer: { flex: 1, marginRight: theme.spacing.sm },
	};
}
