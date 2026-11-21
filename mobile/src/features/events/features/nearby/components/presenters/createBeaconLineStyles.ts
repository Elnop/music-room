import { StyleSheet } from 'react-native';
import type { Theme } from '@/shared/theme/types/themeTypes';

export function createBeaconLineStyles(theme: Theme) {
	const styles = StyleSheet.create({
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.xs,
			paddingHorizontal: theme.spacing.md,
			paddingVertical: theme.spacing.xs,
		},
		text: { fontSize: theme.typography.sizes.sm, color: theme.colors.textSecondary },
		link: {
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.primary,
		},
	});
	return styles;
}
