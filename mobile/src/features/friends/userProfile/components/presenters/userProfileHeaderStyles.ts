import { StyleSheet } from 'react-native';
import type { Theme } from '@/shared/theme/types';

export const createUserProfileHeaderStyles = (theme: Theme) =>
	StyleSheet.create({
		topRow: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.lg,
		},
		statsContainer: {
			flex: 1,
			flexDirection: 'row',
			justifyContent: 'space-around',
		},
		statItem: {
			alignItems: 'center',
		},
		statNumber: {
			fontSize: 20,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
		},
		statLabel: {
			fontSize: 13,
			color: theme.colors.textSecondary,
			marginTop: 2,
		},
		nameSection: {
			marginTop: theme.spacing.md,
		},
		usernameRow: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.sm,
		},
		username: {
			fontSize: 16,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
		},
		followsYouBadge: {
			backgroundColor: theme.colors.surface,
			paddingHorizontal: theme.spacing.sm,
			paddingVertical: 2,
			borderWidth: 1,
			borderColor: theme.colors.border,
		},
		followsYouText: {
			fontSize: 11,
			color: theme.colors.textSecondary,
			fontFamily: theme.typography.families.medium,
		},
		statusBadge: {
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: theme.colors.surface,
			paddingHorizontal: theme.spacing.sm,
			paddingVertical: 3,
			gap: 4,
		},
		statusBadgeOnline: {
			backgroundColor: theme.colors.success + '20',
		},
		statusDot: {
			width: 6,
			height: 6,
			backgroundColor: theme.colors.textSecondary,
		},
		statusDotOnline: {
			backgroundColor: theme.colors.success,
		},
		statusText: {
			fontSize: 11,
			color: theme.colors.textSecondary,
			fontFamily: theme.typography.families.medium,
		},
		statusTextOnline: {
			color: theme.colors.success,
		},
		displayName: {
			fontSize: 14,
			color: theme.colors.textSecondary,
			marginTop: 2,
		},
		followBackHint: {
			fontSize: 13,
			color: theme.colors.textSecondary,
			marginTop: theme.spacing.xs,
		},
		bio: {
			fontSize: 14,
			color: theme.colors.text,
			marginTop: theme.spacing.sm,
			lineHeight: 20,
		},
		hiddenField: {
			flexDirection: 'row',
			alignItems: 'center',
			marginTop: theme.spacing.sm,
			gap: 6,
		},
		hiddenIcon: {
			marginRight: 4,
		},
		hiddenText: {
			fontSize: 14,
			color: theme.colors.textSecondary,
			fontStyle: 'italic',
		},
		genresInline: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			gap: theme.spacing.xs,
			marginTop: theme.spacing.md,
		},
		actionButtons: {
			flexDirection: 'row',
			gap: theme.spacing.sm,
			marginTop: theme.spacing.lg,
		},
		actionButton: {
			flex: 1,
		},
		fullWidthButton: {
			flex: 1,
		},
		friendBadge: {
			flex: 1,
			backgroundColor: theme.colors.primary,
			paddingVertical: theme.spacing.sm,
			alignItems: 'center',
			justifyContent: 'center',
		},
		friendBadgeText: {
			color: theme.colors.surface,
			fontFamily: theme.typography.families.semibold,
			fontSize: 14,
		},
	});
