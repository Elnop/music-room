import type { Theme } from '@/shared/theme/types';
import { FONT_FAMILIES } from '@/shared/theme/fonts';

export const sheetHeaderStyles = (theme: Theme, insets: { top: number }, separator: string) => ({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
		paddingTop: insets.top,
	},
	header: {
		flexDirection: 'row' as const,
		alignItems: 'center' as const,
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: separator,
	},
	closeButton: {
		width: 40,
		height: 40,
		justifyContent: 'center' as const,
		alignItems: 'center' as const,
		backgroundColor: theme.colors.surface,
	},
	title: {
		flex: 1,
		marginRight: 40,
		textAlign: 'center' as const,
		fontSize: 18,
		fontFamily: FONT_FAMILIES.bold,
		color: theme.colors.text,
	},
});
