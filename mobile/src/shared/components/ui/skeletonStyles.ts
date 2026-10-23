import { StyleSheet } from 'react-native';
import type { Theme } from '@/shared/theme/types';

export const createRowSkeletonStyles = (theme: Theme) =>
	StyleSheet.create({
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingVertical: 8,
			paddingHorizontal: theme.spacing.md,
		},
		rowInfo: {
			flex: 1,
			marginLeft: theme.spacing.md,
		},
		secondLine: {
			marginTop: 6,
		},
	});
