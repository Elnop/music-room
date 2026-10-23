import { StyleSheet } from 'react-native';
import type { Theme } from '@/shared/theme/types';

export const createSharingStyles = (theme: Theme) =>
	StyleSheet.create({
		sectionTitle: {
			fontSize: theme.typography.sizes.sm,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.textSecondary,
			marginBottom: theme.spacing.sm,
			textTransform: 'uppercase',
			letterSpacing: 1,
		},
		card: {
			backgroundColor: theme.colors.surface,
			borderRadius: theme.spacing.sm,
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
