import type { Theme } from '@/shared/theme/types';

export const sheetHeaderStyles = (theme: Theme, insets: { top: number }) => ({
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
		borderBottomColor: theme.colors.border,
	},
	closeButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: 'center' as const,
		alignItems: 'center' as const,
		backgroundColor: theme.colors.surface,
	},
	title: {
		flex: 1,
		marginRight: 40,
		textAlign: 'center' as const,
		fontSize: 18,
		fontWeight: '700' as const,
		color: theme.colors.text,
	},
});
