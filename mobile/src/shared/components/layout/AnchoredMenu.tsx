import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Pressable } from '@/shared/components/ui/Pressable';
import { useContextMenuDismiss } from '@/shared/hooks/useContextMenu';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { pixelFrame } from '@/shared/theme/pixelFrame';
import type { Theme } from '@/shared/theme/types';
import { menuPlacement, type MenuAnchor } from '@/shared/utils/menuPlacement';

const MENU_WIDTH = 320;

interface AnchoredMenuProps {
	anchor: MenuAnchor;
	onClose: () => void;
	children: React.ReactNode;
}

/** A sheet of the phone, shown on wide screens as a drop-down under the button that opened it. */
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

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		menu: {
			position: 'absolute',
			width: MENU_WIDTH,
			...pixelFrame(theme),
			overflow: 'hidden',
			backgroundColor: theme.colors.surface,
			...theme.shadows.large,
		},
	});
