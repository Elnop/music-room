import { StyleSheet } from 'react-native';
import { sheetHeaderStyles } from '@/features/playback/shared/sheet-header/sheetHeaderStyles';
import { pixelCaption } from '@/shared/theme/lib/pixelCaption';
import type { Theme } from '@/shared/theme/types/themeTypes';

export function createModalStyles(
	theme: Theme,
	insets: { top: number; bottom: number },
	separator: string,
) {
	const styles = StyleSheet.create({
		...sheetHeaderStyles(theme, insets, separator),
		listContent: {
			flexGrow: 1,
			paddingBottom: insets.bottom + theme.spacing.md,
		},
		sectionLabel: {
			paddingHorizontal: theme.spacing.md,
			paddingTop: theme.spacing.md,
			paddingBottom: theme.spacing.sm,
			...pixelCaption(theme),
		},
		nothingNext: {
			padding: theme.spacing.md,
			textAlign: 'center',
			color: theme.colors.textSecondary,
		},
	});
	return styles;
}
