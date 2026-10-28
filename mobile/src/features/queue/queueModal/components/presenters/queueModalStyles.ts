import { StyleSheet } from 'react-native';
import { sheetHeaderStyles } from '@/features/queue/utils/sheetHeaderStyles';
import { pixelCaption, pixelRow } from '@/shared/theme/pixelFrame';
import type { Theme } from '@/shared/theme/types';
import { FONT_FAMILIES } from '@/shared/theme/fonts';

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
			...pixelCaption(theme),
		},
		nothingNext: {
			padding: 16,
			textAlign: 'center',
			color: theme.colors.textSecondary,
		},
	});

export const createRowStyles = (theme: Theme, separator: string) =>
	StyleSheet.create({
		row: pixelRow(theme),
		rowMain: {
			flex: 1,
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.md,
		},
		rowCurrent: {
			backgroundColor: theme.colors.surfaceAlt,
		},
		rowActive: {
			...theme.shadows.large,
		},
		trackInfo: {
			flex: 1,
		},
		trackTitle: {
			fontSize: 15,
			fontFamily: FONT_FAMILIES.semibold,
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
			fontFamily: FONT_FAMILIES.semibold,
			marginTop: 4,
		},
	});
