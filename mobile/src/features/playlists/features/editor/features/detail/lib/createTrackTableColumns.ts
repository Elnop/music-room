import { StyleSheet } from 'react-native';
import type { Theme } from '@/shared/theme/types/themeTypes';

export function createTrackTableColumns(theme: Theme) {
	const styles = StyleSheet.create({
		position: {
			width: theme.controls.tableIndexColumn,
			alignItems: 'center',
			justifyContent: 'center',
		},
		title: { flex: 3, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
		artist: { flex: 2, minWidth: 0, paddingHorizontal: theme.spacing.smd },
		duration: { width: theme.controls.tableDurationColumn, alignItems: 'flex-end' },
		trailing: { width: theme.controls.tableTrailingColumn },
	});
	return styles;
}
