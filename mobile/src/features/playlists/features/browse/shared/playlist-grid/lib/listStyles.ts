import { StyleSheet } from 'react-native';
import type { Theme } from '@/shared/theme/types/themeTypes';

export function createListStyles(theme: Theme) {
	const styles = StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		list: {
			flexGrow: 1,
			paddingTop: theme.spacing.md,
		},
		section: {
			marginBottom: theme.spacing.sm,
		},
		sectionSpacer: {
			height: theme.spacing.md,
		},
	});
	return styles;
}

export function createGridStyles(theme: Theme) {
	const styles = StyleSheet.create({
		grid: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			paddingHorizontal: theme.spacing.md,
			gap: theme.spacing.md,
		},
		friendsSkeleton: {
			flexDirection: 'row',
			overflow: 'hidden',
			paddingHorizontal: theme.spacing.md,
			gap: theme.spacing.smd,
		},
	});
	return styles;
}
