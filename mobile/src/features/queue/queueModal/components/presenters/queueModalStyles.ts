import { StyleSheet } from 'react-native';
import { sheetHeaderStyles } from '@/features/queue/utils/sheetHeaderStyles';
import type { Theme } from '@/shared/theme/types';

export const formatDuration = (ms: number): string => {
	const minutes = Math.floor(ms / 60000);
	const seconds = Math.floor((ms % 60000) / 1000);
	return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const createModalStyles = (
	theme: Theme,
	insets: { top: number; bottom: number },
	separator: string
) =>
	StyleSheet.create({
		...sheetHeaderStyles(theme, insets, separator),
		listContent: {
			flexGrow: 1,
			paddingBottom: insets.bottom + 16,
		},
		sectionLabel: {
			paddingHorizontal: 16,
			paddingTop: 16,
			paddingBottom: 8,
			fontSize: 12,
			fontWeight: '600',
			letterSpacing: 1,
			textTransform: 'uppercase',
			color: theme.colors.textSecondary,
		},
		nothingNext: {
			padding: 16,
			textAlign: 'center',
			color: theme.colors.textSecondary,
		},
	});

export const createRowStyles = (theme: Theme, separator: string) =>
	StyleSheet.create({
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			padding: 12,
			backgroundColor: theme.colors.surface,
			borderBottomWidth: 1,
			borderBottomColor: separator,
		},
		rowMain: {
			flex: 1,
			flexDirection: 'row',
			alignItems: 'center',
		},
		rowCurrent: {
			backgroundColor: theme.colors.surfaceAlt,
			borderLeftWidth: 4,
			borderLeftColor: theme.colors.primary,
		},
		rowActive: {
			...theme.shadows.medium,
		},
		albumArt: {
			borderRadius: 4,
			marginRight: 12,
		},
		trackInfo: {
			flex: 1,
			marginRight: 8,
		},
		trackTitle: {
			fontSize: 15,
			fontWeight: '600',
			color: theme.colors.text,
			marginBottom: 4,
		},
		trackTitleCurrent: {
			color: theme.colors.primary,
		},
		trackArtist: {
			fontSize: 13,
			color: theme.colors.textSecondary,
		},
		playingIcon: {
			marginRight: 8,
		},
		duration: {
			fontSize: 13,
			color: theme.colors.textSecondary,
		},
		dragHandle: {
			marginLeft: theme.spacing.sm,
			padding: theme.spacing.xs,
		},
		deleteButton: {
			backgroundColor: theme.colors.error,
			justifyContent: 'center',
			alignItems: 'center',
			width: 100,
			height: '100%',
		},
		deleteText: {
			color: theme.colors.onColor,
			fontSize: 12,
			fontWeight: '600',
			marginTop: 4,
		},
	});
