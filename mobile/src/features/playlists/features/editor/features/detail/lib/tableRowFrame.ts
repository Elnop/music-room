import type { Theme } from '@/shared/theme/types/themeTypes';

export function tableRowFrame(theme: Theme, separator: string) {
	return {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: theme.spacing.smd,
		borderBottomWidth: theme.borders.hairline,
		borderBottomColor: separator,
	} as const;
}
