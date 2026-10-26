import { StyleSheet } from 'react-native';
import type { Theme } from '@/shared/theme/types';

export const DISABLED_OPACITY = 0.35;

/** Wide enough for "12:34" on each side of the progress slider. */
const TIME_WIDTH = 44;

export const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			height: 80,
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: theme.spacing.md,
			gap: theme.spacing.md,
			backgroundColor: theme.colors.background,
		},
		side: {
			flex: 1,
			flexBasis: 0,
			flexDirection: 'row',
			alignItems: 'center',
			minWidth: 0,
		},
		sideEnd: {
			justifyContent: 'flex-end',
			gap: theme.spacing.xs,
		},
		trackButton: {
			flexDirection: 'row',
			alignItems: 'center',
			flexShrink: 1,
			minWidth: 0,
			gap: theme.spacing.sm,
		},
		artwork: {
			borderRadius: 6,
		},
		info: {
			flexShrink: 1,
			minWidth: 0,
		},
		title: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
		artist: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
		device: {
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.primary,
		},
		center: {
			flex: 2,
			flexBasis: 0,
			maxWidth: 640,
			alignItems: 'stretch',
		},
		controls: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			gap: theme.spacing.md,
		},
		iconButton: {
			width: 36,
			height: 36,
			borderRadius: 18,
			alignItems: 'center',
			justifyContent: 'center',
		},
		playButton: {
			width: 40,
			height: 40,
			borderRadius: 20,
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: theme.colors.primary,
		},
		playButtonEmpty: {
			backgroundColor: theme.colors.surfaceAlt,
		},
		progressSlot: {
			height: 20,
			justifyContent: 'center',
		},
		progressContainer: {
			justifyContent: 'center',
		},
		slider: {
			height: 20,
			marginHorizontal: TIME_WIDTH,
		},
		timeContainer: {
			...StyleSheet.absoluteFillObject,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			pointerEvents: 'none',
		},
		timeText: {
			width: TIME_WIDTH,
			textAlign: 'center',
			fontSize: theme.typography.sizes.sm,
			fontVariant: ['tabular-nums'],
		},
		volumeSlider: {
			width: 96,
			height: 20,
		},
	});
