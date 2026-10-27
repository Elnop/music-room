import { StyleSheet } from 'react-native';
import type { Theme } from '@/shared/theme/types';

/** The xl avatar's size, so the cards line up with the playlist carousels. */
export const SIMILAR_CARD_WIDTH = 128;

export const createSimilarProfilesStyles = (theme: Theme) =>
	StyleSheet.create({
		scrollContent: {
			paddingHorizontal: theme.spacing.md,
			paddingBottom: theme.spacing.sm,
		},
		card: {
			width: SIMILAR_CARD_WIDTH,
			marginRight: 16,
			alignItems: 'center',
		},
		name: {
			marginTop: theme.spacing.sm,
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
		genres: {
			marginTop: 2,
			fontSize: theme.typography.sizes.xs,
			color: theme.colors.textSecondary,
		},
		message: {
			paddingHorizontal: theme.spacing.md,
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
	});
