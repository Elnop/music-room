import { StyleSheet } from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';
import type { Theme } from '@/shared/theme/types';

export const createStyles = (theme: Theme, insets: EdgeInsets) =>
	StyleSheet.create({
		container: {
			position: 'absolute',
			bottom: 70 + insets.bottom,
			left: 0,
			right: 0,
			backgroundColor: theme.colors.background,
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
			borderRadius: 8,
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
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.text,
			marginBottom: 2,
		},
		artist: {
			fontSize: 12,
			color: theme.colors.textSecondary,
		},
		device: {
			fontSize: 11,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.primary,
		},
		playButton: {
			width: 40,
			height: 40,
			borderRadius: 20,
			backgroundColor: theme.colors.primary,
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
			height: 2,
			width: '100%',
			backgroundColor: 'transparent',
		},
		progressBar: {
			height: 2,
			backgroundColor: theme.colors.primary,
		},
	});
