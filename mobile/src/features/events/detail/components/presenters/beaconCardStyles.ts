import { StyleSheet } from 'react-native';
import type { Theme } from '@/shared/theme/types';

export const createBeaconCardStyles = (theme: Theme) =>
	StyleSheet.create({
		card: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.md,
			padding: theme.spacing.md,
			backgroundColor: theme.colors.surface,
			borderWidth: 1,
			borderColor: theme.colors.border,
		},
		info: { flex: 1 },
		label: {
			fontSize: theme.typography.sizes.lg,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
		description: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			marginTop: 2,
		},
	});
