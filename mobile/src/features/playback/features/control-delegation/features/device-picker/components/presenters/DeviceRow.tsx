import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { pixelRow } from '@/shared/theme/lib/pixelFrame';
import type { PixelIconSource } from '@/shared/theme/types/pixelIconTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { PickerRow } from '@/features/playback/features/control-delegation/features/device-picker/devicePickerTypes';
import { DeviceRowLabel } from '@/features/playback/features/control-delegation/features/device-picker/components/presenters/DeviceRowLabel';
import { DeviceRowStatus } from '@/features/playback/features/control-delegation/features/device-picker/components/presenters/DeviceRowStatus';
import LaptopSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/laptop-solid.svg';
import PhoneRingingLowSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/phone-ringing-low-solid.svg';

type DeviceRowProps = {
	row: PickerRow;
	onPick: (row: PickerRow) => void;
};

function deviceIcon(platform: string): PixelIconSource {
	return platform === 'web' ? LaptopSolid : PhoneRingingLowSolid;
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		row: pixelRow(theme),
		offlineRow: { opacity: 0.4 },
		iconContainer: {
			width: theme.controls.iconButtonLarge,
			height: theme.controls.iconButtonLarge,
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: theme.colors.surface,
		},
	});
	return styles;
}

export function DeviceRow({ row, onPick }: DeviceRowProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const { device, active, disabled } = row;

	return (
		<Pressable
			testID={`picker-device-${device.deviceId}`}
			style={[styles.row, !device.online && styles.offlineRow]}
			onPress={() => onPick(row)}
			disabled={disabled}
			accessibilityRole="button"
			accessibilityLabel={device.deviceName}
			accessibilityState={{ disabled, selected: active }}
		>
			<View style={styles.iconContainer}>
				<PixelIcon
					icon={deviceIcon(device.platform)}
					size={20}
					color={active ? theme.colors.primary : theme.colors.text}
				/>
			</View>
			<DeviceRowLabel device={device} active={active} />
			<DeviceRowStatus pending={row.pending} active={active} />
		</Pressable>
	);
}
