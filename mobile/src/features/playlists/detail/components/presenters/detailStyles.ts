import { StyleSheet } from 'react-native';
import { CONTENT_MAX_WIDTH } from '@/shared/constants/layout';
import type { Theme } from '@/shared/theme/types';

export const createDetailStyles = (theme: Theme, topInset: number) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		list: {
			flexGrow: 1,
			paddingTop: topInset + 60,
			paddingBottom: theme.spacing.xxl,
		},
		column: {
			width: '100%',
			maxWidth: CONTENT_MAX_WIDTH.content,
			alignSelf: 'center',
		},
	});
