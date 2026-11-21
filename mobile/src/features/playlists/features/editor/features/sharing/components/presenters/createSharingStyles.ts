import { StyleSheet } from 'react-native';
import type { Theme } from '@/shared/theme/types/themeTypes';

export function createSharingStyles(theme: Theme) {
	const styles = StyleSheet.create({
		sectionTitle: {
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.textSecondary,
			marginBottom: theme.spacing.sm,
			textTransform: 'uppercase',
			letterSpacing: theme.typography.letterSpacings.wide,
		},
		card: {
			backgroundColor: theme.colors.surface,
			borderWidth: theme.borders.medium,
			borderColor: theme.colors.border,
		},
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			padding: theme.spacing.md,
			marginBottom: theme.spacing.sm,
		},
	});
	return styles;
}
