import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionSheetHeader } from '@/features/playlists/features/editor/shared/action-sheet/components/ActionSheetHeader';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import { pixelFrame } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type {
	ActionSheetHeading,
	ActionSheetMode,
} from '@/features/playlists/features/editor/shared/action-sheet/actionSheetTypes';

type ActionSheetPanelProps = {
	heading: ActionSheetHeading;
	mode: ActionSheetMode;
	tall: boolean;
	children: React.ReactNode;
};

export function ActionSheetPanel({ heading, mode, tall, children }: ActionSheetPanelProps) {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const styles = React.useMemo(() => createStyles(theme, insets.bottom), [theme, insets.bottom]);

	return (
		<View style={[styles.sheet, tall && styles.tall, mode === 'menu' && styles.menuSheet]}>
			<ActionSheetHeader heading={heading} />
			{children}
		</View>
	);
}

function createStyles(theme: Theme, bottomInset: number) {
	const styles = StyleSheet.create({
		sheet: {
			...pixelFrame(theme),
			backgroundColor: theme.colors.background,
			paddingBottom: bottomInset + theme.spacing.md,
		},
		tall: {
			maxHeight: '70%',
		},
		menuSheet: {
			borderWidth: 0,
			paddingBottom: theme.spacing.xs,
			backgroundColor: 'transparent',
		},
	});
	return styles;
}
