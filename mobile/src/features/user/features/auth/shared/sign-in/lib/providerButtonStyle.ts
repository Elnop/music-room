import type { TextStyle, ViewStyle } from 'react-native';
import type { Theme } from '@/shared/theme/types/themeTypes';

export function providerButtonFrame(theme: Theme, background: string, border: string): ViewStyle {
	return {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: background,
		paddingVertical: theme.spacing.smd,
		borderWidth: theme.borders.hairline,
		borderColor: border,
	};
}

export function providerMark(theme: Theme, color: string): TextStyle {
	return {
		fontSize: theme.typography.sizes.xl,
		fontFamily: theme.typography.families.bold,
		color,
		marginRight: theme.spacing.smd,
	};
}

export function providerLabel(theme: Theme, color: string): TextStyle {
	return {
		fontSize: theme.typography.sizes.lg,
		fontFamily: theme.typography.families.medium,
		color,
	};
}
