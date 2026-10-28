import { StyleSheet } from 'react-native';
import { sheetHeaderStyles } from '@/features/queue/utils/sheetHeaderStyles';
import { keycap, pixelCaption, pixelRow } from '@/shared/theme/pixelFrame';
import type { Theme } from '@/shared/theme/types';
import { FONT_FAMILIES } from '@/shared/theme/fonts';

export const createPickerStyles = (
	theme: Theme,
	insets: { top: number; bottom: number },
	separator: string
) =>
	StyleSheet.create({
		...sheetHeaderStyles(theme, insets, separator),
		listContent: {
			paddingBottom: insets.bottom + 16,
		},
		centered: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			padding: 24,
			gap: 16,
		},
		errorText: {
			fontSize: 15,
			color: theme.colors.textSecondary,
			textAlign: 'center',
		},
		retryButton: {
			...keycap(theme),
			paddingHorizontal: 20,
			paddingVertical: 10,
			backgroundColor: theme.colors.primary,
		},
		retryText: {
			color: theme.colors.textInverse,
			fontFamily: FONT_FAMILIES.semibold,
		},
		sectionLabel: {
			paddingHorizontal: 16,
			paddingTop: 16,
			paddingBottom: 8,
			...pixelCaption(theme),
		},
		ownerName: {
			paddingHorizontal: 16,
			paddingTop: 8,
			paddingBottom: 4,
			fontSize: 14,
			fontFamily: FONT_FAMILIES.bold,
			color: theme.colors.text,
		},
		emptyText: {
			paddingHorizontal: 16,
			paddingVertical: 8,
			color: theme.colors.textSecondary,
		},
		row: pixelRow(theme),
		offlineRow: {
			opacity: 0.4,
		},
		iconContainer: {
			width: 36,
			height: 36,
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: theme.colors.surface,
		},
		rowText: {
			flex: 1,
		},
		deviceName: {
			fontSize: 16,
			fontFamily: FONT_FAMILIES.semibold,
			color: theme.colors.text,
		},
		activeText: {
			color: theme.colors.primary,
		},
		deviceModel: {
			fontSize: 13,
			color: theme.colors.textSecondary,
		},
		activeBadge: {
			fontSize: 12,
			fontFamily: FONT_FAMILIES.bold,
			color: theme.colors.primary,
		},
	});
