import { StyleSheet } from 'react-native';
import type { Theme } from '@/shared/theme/types';

export const SIMILAR_CARD_WIDTH = 140;

export const createSimilarProfilesStyles = (theme: Theme) =>
	StyleSheet.create({
		scrollContent: {
			paddingHorizontal: theme.spacing.md,
			paddingBottom: theme.spacing.sm,
		},
		card: {
			width: SIMILAR_CARD_WIDTH,
			marginRight: 12,
			alignItems: 'center',
			padding: theme.spacing.sm,
			borderRadius: 8,
			backgroundColor: theme.colors.surface,
		},
		name: {
			marginTop: theme.spacing.sm,
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
		genres: {
			marginTop: 2,
			marginBottom: theme.spacing.sm,
			fontSize: theme.typography.sizes.xs,
			color: theme.colors.textSecondary,
			textAlign: 'center',
		},
		message: {
			paddingHorizontal: theme.spacing.md,
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
	});
