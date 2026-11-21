import { StyleSheet } from 'react-native';
import type { Theme } from '@/shared/theme/types/themeTypes';

export function createRowSkeletonStyles(theme: Theme) {
	const styles = StyleSheet.create({
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingVertical: theme.spacing.sm,
			paddingHorizontal: theme.spacing.md,
		},
		rowInfo: {
			flex: 1,
			marginLeft: theme.spacing.md,
		},
		secondLine: {
			marginTop: theme.spacing.xsm,
		},
	});
	return styles;
}
