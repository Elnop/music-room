import { StyleSheet } from 'react-native';
import { CONTENT_MAX_WIDTH } from '@/shared/constants/layout';
import type { Theme } from '@/shared/theme/types';

/** Layout of the playlist screen, shared by its list, skeleton and failure. */
export const createDetailStyles = (theme: Theme, topInset: number) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		list: {
			flexGrow: 1,
			paddingTop: topInset + 60, // Space for the floating header
			paddingBottom: theme.spacing.xxl,
		},
		// The screen spans the window on wide screens, for its gradient; its content keeps a column.
		column: {
			width: '100%',
			maxWidth: CONTENT_MAX_WIDTH.content,
			alignSelf: 'center',
		},
	});
