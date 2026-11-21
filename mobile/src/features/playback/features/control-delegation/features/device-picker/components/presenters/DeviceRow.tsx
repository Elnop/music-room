import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import type { PixelIconSource } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import type { DevicePickerOwner } from '@/features/playback/features/control-delegation/shared/delegation/lib/device.types';
import type { Theme } from '@/shared/theme/lib/types';
import type { createPickerStyles } from '@/features/playback/features/control-delegation/features/device-picker/components/presenters/devicePickerStyles';
import { Text } from '@/shared/theme/components/Text';
import LaptopSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/laptop-solid.svg';
import PhoneRingingLowSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/phone-ringing-low-solid.svg';

export type PickerDevice = DevicePickerOwner['devices'][number];

function deviceIcon(platform: string): PixelIconSource {
	return platform === 'web' ? LaptopSolid : PhoneRingingLowSolid;
}

interface DeviceRowProps {
	owner: DevicePickerOwner;
	device: PickerDevice;
	active: boolean;
	isPending: boolean;
	disabled: boolean;
	theme: Theme;
	styles: ReturnType<typeof createPickerStyles>;
	onPick: (owner: DevicePickerOwner, device: PickerDevice) => void;
}

export function DeviceRow({
	owner,
	device,
	active,
	isPending,
	disabled,
	theme,
	styles,
	onPick,
}: DeviceRowProps) {
	const name = device.deviceName;

	return (
		<Pressable
			testID={`picker-device-${device.deviceId}`}
			style={[styles.row, !device.online && styles.offlineRow]}
			onPress={() => onPick(owner, device)}
			disabled={disabled}
			accessibilityRole="button"
			accessibilityLabel={name}
			accessibilityState={{ disabled, selected: active }}
		>
			<View style={styles.iconContainer}>
				<PixelIcon
					icon={deviceIcon(device.platform)}
					size={20}
					color={active ? theme.colors.primary : theme.colors.text}
				/>
			</View>
			<View style={styles.rowText}>
				<Text style={[styles.deviceName, active && styles.activeText]} numberOfLines={1}>
					{name}
				</Text>
				<Text style={styles.deviceModel} numberOfLines={1}>
					{device.online ? device.model : 'Hors ligne'}
				</Text>
			</View>
			{isPending ? (
				<ActivityIndicator size="small" color={theme.colors.primary} />
			) : (
				active && <Text style={styles.activeBadge}>En cours</Text>
			)}
		</Pressable>
	);
}
