import { StyleSheet } from 'react-native';
import type { Theme } from '@/shared/theme/types';

export const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			backgroundColor: theme.colors.surfaceAlt,
			borderTopWidth: theme.borders.thick,
			borderColor: theme.colors.border,
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
		device: {
			fontSize: 11,
			fontFamily: theme.typography.families.mono,
			color: theme.colors.info,
		},
		playButton: {
			width: 40,
			height: 40,
			backgroundColor: theme.colors.primary,
			borderWidth: theme.borders.thick,
			borderBottomWidth: theme.borders.thick * 3,
			borderColor: theme.colors.border,
			alignItems: 'center',
			justifyContent: 'center',
		},
		playButtonEmpty: {
			backgroundColor: theme.colors.surfaceAlt,
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
