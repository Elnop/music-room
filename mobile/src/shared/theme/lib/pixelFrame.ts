import type { ViewStyle } from 'react-native';
import type { Theme } from '@/shared/theme/types/themeTypes';

export function pixelFrame(theme: Theme): ViewStyle {
	return {
		borderWidth: theme.borders.thick,
		borderColor: theme.colors.border,
	};
}

export function keycap(theme: Theme): ViewStyle {
	return {
		...pixelFrame(theme),
		borderBottomWidth: theme.borders.thick * 3,
	};
}

export function pixelRow(theme: Theme): ViewStyle {
	return {
		...pixelFrame(theme),
		flexDirection: 'row',
		alignItems: 'center',
		gap: theme.spacing.md,
		padding: theme.spacing.sm,
		marginHorizontal: theme.spacing.md,
		marginBottom: theme.spacing.md,
		backgroundColor: theme.colors.surface,
	};
}

type DisplayRole = keyof Theme['typography']['displayScale'];

export function displayText(theme: Theme, size: number, role: DisplayRole = 'title') {
	return {
		fontFamily: theme.typography.families.display,
		fontSize: Math.round(size * theme.typography.displayScale[role]),
	};
}

export function headerTitle(theme: Theme) {
	return displayText(theme, 18);
}
