import { StyleSheet } from 'react-native';
import { keycap, pixelFrame } from '@/shared/theme/pixelFrame';
import type { Theme } from '@/shared/theme/types';

export const createStyles = (theme: Theme) =>
	StyleSheet.create({
		// A key floating above the tabs.
		container: {
			...keycap(theme),
			backgroundColor: theme.colors.surfaceAlt,
			marginHorizontal: theme.spacing.md,
			marginBottom: theme.spacing.sm,
		},
		content: {
			flexDirection: 'row',
			alignItems: 'center',
			padding: theme.spacing.sm,
			paddingRight: theme.spacing.md,
		},
		swipeArea: {
			flex: 1,
		},
		infoButton: {
			flexDirection: 'row',
			alignItems: 'center',
		},
		artwork: {
			...pixelFrame(theme),
			width: 40,
			height: 40,
			marginRight: theme.spacing.sm,
			backgroundColor: theme.colors.surfaceAlt,
		},
		emptyArtwork: {
			backgroundColor: theme.colors.surface,
			alignItems: 'center',
			justifyContent: 'center',
		},
		info: {
			flex: 1,
			marginRight: theme.spacing.sm,
		},
		title: {
			fontSize: 14,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
			marginBottom: 2,
		},
		artist: {
			fontSize: 12,
			color: theme.colors.textSecondary,
		},
		deviceRow: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.xs,
			marginTop: 2,
		},
		device: {
			fontSize: 11,
			fontFamily: theme.typography.families.mono,
			color: theme.colors.info,
		},
		nextButton: {
			width: 36,
			height: 40,
			marginLeft: theme.spacing.xs,
			alignItems: 'center',
			justifyContent: 'center',
		},
		disabledIcon: {
			opacity: 0.35,
		},
		progressBarContainer: {
			height: theme.borders.thick,
			width: '100%',
			backgroundColor: 'transparent',
		},
		progressBar: {
			height: theme.borders.thick,
			backgroundColor: theme.colors.primary,
		},
	});
