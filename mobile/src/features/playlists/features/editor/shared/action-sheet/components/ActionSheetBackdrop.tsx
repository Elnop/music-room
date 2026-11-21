import React from 'react';
import { StyleSheet } from 'react-native';
import { Pressable } from '@/shared/theme/components/Pressable';
import { CenteredDialog } from '@/shared/theme/components/CenteredDialog';
import { AnchoredMenu } from '@/features/playlists/features/editor/shared/action-sheet/components/AnchoredMenu';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { MenuAnchor } from '@/shared/theme/types/menuTypes';
import type { ActionSheetMode } from '@/features/playlists/features/editor/shared/action-sheet/actionSheetTypes';

type ActionSheetBackdropProps = {
	mode: ActionSheetMode;
	anchor: MenuAnchor | null;
	onClose: () => void;
	children: React.ReactNode;
};

export function ActionSheetBackdrop({ mode, anchor, onClose, children }: ActionSheetBackdropProps) {
	const { styles } = useThemedStyles(createStyles);

	if (anchor) {
		return (
			<AnchoredMenu anchor={anchor} onClose={onClose}>
				{children}
			</AnchoredMenu>
		);
	}
	if (mode === 'dialog') return <CenteredDialog onClose={onClose}>{children}</CenteredDialog>;
	return (
		<>
			<Pressable
				style={styles.backdrop}
				onPress={onClose}
				accessibilityRole="none"
				accessibilityLabel="Fermer"
			/>
			{children}
		</>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		backdrop: {
			flex: 1,
			backgroundColor: theme.colors.backdrop,
		},
	});
	return styles;
}
