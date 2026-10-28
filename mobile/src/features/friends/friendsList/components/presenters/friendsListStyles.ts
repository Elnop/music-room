import { StyleSheet } from 'react-native';
import { pixelFrame, pixelRow } from '@/shared/theme/pixelFrame';
import type { Theme } from '@/shared/theme/types';

export const createFriendsListStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		header: {
			paddingHorizontal: theme.spacing.lg,
			paddingTop: theme.spacing.xs,
			paddingBottom: theme.spacing.sm,
		},
		tabsContainer: {
			...pixelFrame(theme),
			flexDirection: 'row',
			backgroundColor: theme.colors.surface,
			padding: theme.borders.thick,
			marginBottom: theme.spacing.md,
		},
		tab: {
			flex: 1,
			paddingVertical: theme.spacing.sm,
			alignItems: 'center',
		},
		tabActive: {
			backgroundColor: theme.colors.primary,
		},
		tabText: {
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.medium,
			color: theme.colors.textSecondary,
		},
		tabTextActive: {
			color: theme.colors.surface,
			fontFamily: theme.typography.families.semibold,
		},
		searchBar: {
			marginBottom: theme.spacing.sm,
		},
		listContent: {
			paddingBottom: theme.spacing.xl,
		},
		userItem: pixelRow(theme),
		userItemProcessing: {
			opacity: 0.7,
		},
		userInfo: {
			flex: 1,
		},
		username: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
		displayName: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			marginTop: 2,
		},
		controlRow: {
			flexDirection: 'row',
			alignItems: 'center',
			marginTop: 4,
		},
		controlIcon: {
			marginRight: 4,
		},
		controlText: {
			fontSize: theme.typography.sizes.xs,
			color: theme.colors.textSecondary,
		},
		controlTextActive: {
			color: theme.colors.primary,
			fontFamily: theme.typography.families.medium,
		},
		cardHeader: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingTop: theme.spacing.sm,
			paddingHorizontal: theme.spacing.md,
		},
		cardFooter: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			gap: theme.spacing.sm,
			paddingTop: theme.spacing.xs,
			paddingBottom: theme.spacing.sm,
			paddingHorizontal: theme.spacing.md,
		},
		cardFooterText: {
			flex: 1,
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
		controlToggle: {
			alignItems: 'center',
			justifyContent: 'center',
			marginRight: theme.spacing.sm,
		},
		switchPlaceholder: {
			width: 51,
			height: 31,
			justifyContent: 'center',
			alignItems: 'center',
		},
		gridRow: {
			gap: theme.spacing.sm,
			paddingHorizontal: theme.spacing.sm,
		},
		// Each cell grows by 1/columns, so a last row that is not full keeps the cell width.
		gridCell: {
			...pixelFrame(theme),
			backgroundColor: theme.colors.surface,
			marginBottom: theme.spacing.sm,
		},
		emptyState: {
			paddingTop: theme.spacing.xxl,
		},
	});
