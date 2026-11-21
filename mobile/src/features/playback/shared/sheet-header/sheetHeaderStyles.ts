import type { Theme } from '@/shared/theme/types/themeTypes';
import { FONT_FAMILIES } from '@/shared/theme/configs/fontsConfig';

function headerBarStyles(theme: Theme, separator: string) {
	return {
		header: {
			flexDirection: 'row' as const,
			alignItems: 'center' as const,
			paddingHorizontal: theme.spacing.md,
			paddingVertical: theme.spacing.smd,
			borderBottomWidth: theme.borders.hairline,
			borderBottomColor: separator,
		},
		closeButton: {
			width: 40,
			height: 40,
			justifyContent: 'center' as const,
			alignItems: 'center' as const,
			backgroundColor: theme.colors.surface,
		},
	};
}

export function sheetHeaderStyles(theme: Theme, insets: { top: number }, separator: string) {
	return {
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
			paddingTop: insets.top,
		},
		...headerBarStyles(theme, separator),
		title: {
			flex: 1,
			marginRight: 40,
			textAlign: 'center' as const,
			fontSize: theme.typography.sizes.lgx,
			fontFamily: FONT_FAMILIES.bold,
			color: theme.colors.text,
		},
	};
}
