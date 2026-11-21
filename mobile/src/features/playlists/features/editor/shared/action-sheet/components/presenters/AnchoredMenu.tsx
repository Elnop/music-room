import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Pressable } from '@/shared/theme/components/Pressable';
import { useContextMenuDismiss } from '@/shared/theme/hooks/useContextMenu';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { pixelFrame } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/lib/types';
import { menuPlacement } from '@/shared/theme/lib/menuPlacement';
import type { MenuAnchor } from '@/shared/theme/lib/menuPlacement';

const MENU_WIDTH = 320;

interface AnchoredMenuProps {
	anchor: MenuAnchor;
	onClose: () => void;
	children: React.ReactNode;
}

export function AnchoredMenu({ anchor, onClose, children }: AnchoredMenuProps) {
	const { styles } = useThemedStyles(createStyles);
	const placement = menuPlacement(anchor, useWindowDimensions(), MENU_WIDTH);
	const contextMenu = useContextMenuDismiss(onClose);

	return (
		<View style={StyleSheet.absoluteFill} {...contextMenu}>
			<Pressable
				style={StyleSheet.absoluteFill}
				onPress={onClose}
				accessibilityRole="none"
				accessibilityLabel="Fermer"
			/>
			<View style={[styles.menu, placement]} accessibilityRole="menu">
				{children}
			</View>
		</View>
	);
}

function createStyles(theme: Theme) {
	return StyleSheet.create({
		menu: {
			position: 'absolute',
			width: MENU_WIDTH,
			...pixelFrame(theme),
			overflow: 'hidden',
			backgroundColor: theme.colors.surface,
			...theme.shadows.large,
		},
	});
}
