import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { PixelIconSource } from '@/shared/theme/types/pixelIconTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';

type IconTileProps = {
	icon: PixelIconSource;
	size: 'row' | 'badge';
};

export function IconTile({ icon, size }: IconTileProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<View style={[styles.tile, size === 'badge' ? styles.badge : styles.row]}>
			<PixelIcon icon={icon} size={20} color={theme.colors.primary} />
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		tile: {
			backgroundColor: theme.colors.primary + '15',
			alignItems: 'center',
			justifyContent: 'center',
			marginRight: theme.spacing.md,
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
