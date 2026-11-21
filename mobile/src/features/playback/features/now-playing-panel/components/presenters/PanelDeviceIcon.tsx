import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import LaptopSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/laptop-solid.svg';
import PhoneRingingLowSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/phone-ringing-low-solid.svg';

type PanelDeviceIconProps = {
	isRemote: boolean;
};

export function PanelDeviceIcon({ isRemote }: PanelDeviceIconProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<View style={styles.deviceIcon}>
			<PixelIcon
				icon={isRemote ? PhoneRingingLowSolid : LaptopSolid}
				size={20}
				color={isRemote ? theme.colors.primary : theme.colors.text}
			/>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		deviceIcon: {
			width: theme.controls.iconButtonXl,
			height: theme.controls.iconButtonXl,
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: theme.colors.surfaceAlt,
		},
	});
	return styles;
}
