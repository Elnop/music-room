import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { pixelFrame } from '@/shared/theme/lib/pixelFrame';
import type { PixelIconSource } from '@/shared/theme/types/pixelIconTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';

type IconTileProps = {
	icon: PixelIconSource;
	size: 'row' | 'badge';
	framed?: boolean;
};

export function IconTile({ icon, size, framed = false }: IconTileProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const toneStyle = framed ? styles.framed : styles.tinted;
	const sizeStyle = size === 'badge' ? styles.badge : styles.row;

	return (
		<View style={[styles.tile, toneStyle, sizeStyle]}>
			<PixelIcon icon={icon} size={20} color={theme.colors.primary} />
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		tile: {
			alignItems: 'center',
			justifyContent: 'center',
			marginRight: theme.spacing.md,
		},
		tinted: {
			backgroundColor: theme.colors.primary + '15',
		},
		framed: {
			...pixelFrame(theme),
			backgroundColor: theme.colors.background,
		},
		row: {
			width: theme.controls.rowIcon,
			height: theme.controls.rowIcon,
		},
		badge: {
			width: theme.controls.badge,
			height: theme.controls.badge,
		},
	});
	return styles;
}
