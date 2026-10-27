import { StyleSheet } from 'react-native';
import type { Theme } from '@/shared/theme/types';

const AVATAR_SIZE = 128;
const CARD_PADDING = 12;
const CARD_BORDER = 1;

/** The xl avatar plus the card's padding and outline. */
export const SIMILAR_CARD_WIDTH = AVATAR_SIZE + 2 * (CARD_PADDING + CARD_BORDER);

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
			padding: CARD_PADDING,
			borderWidth: CARD_BORDER,
			borderRadius: 12,
			// Between the page and the default avatar, so the card reads on both.
			borderColor: theme.colors.borderLight,
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
			fontSize: theme.typography.sizes.xs,
			color: theme.colors.textSecondary,
		},
		message: {
			paddingHorizontal: theme.spacing.md,
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
	});
