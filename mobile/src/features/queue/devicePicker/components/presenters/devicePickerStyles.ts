import { StyleSheet } from 'react-native';
import { sheetHeaderStyles } from '@/features/queue/utils/sheetHeaderStyles';
import type { Theme } from '@/shared/theme/types';

export const createPickerStyles = (theme: Theme, insets: { top: number; bottom: number }) =>
	StyleSheet.create({
		...sheetHeaderStyles(theme, insets),
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
			paddingHorizontal: 20,
			paddingVertical: 10,
			borderRadius: 20,
			backgroundColor: theme.colors.primary,
		},
		retryText: {
			color: theme.colors.textInverse,
			fontWeight: '600',
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
		ownerName: {
			paddingHorizontal: 16,
			paddingTop: 8,
			paddingBottom: 4,
			fontSize: 14,
			fontWeight: '700',
			color: theme.colors.text,
		},
		emptyText: {
			paddingHorizontal: 16,
			paddingVertical: 8,
			color: theme.colors.textSecondary,
		},
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: 16,
			paddingVertical: 12,
			gap: 12,
		},
		offlineRow: {
			opacity: 0.4,
		},
		iconContainer: {
			width: 36,
			height: 36,
			borderRadius: 18,
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: theme.colors.surface,
		},
		rowText: {
			flex: 1,
		},
		deviceName: {
			fontSize: 16,
			fontWeight: '600',
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
			fontWeight: '700',
			color: theme.colors.primary,
		},
	});
