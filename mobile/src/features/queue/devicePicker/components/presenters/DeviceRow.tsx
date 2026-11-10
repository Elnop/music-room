import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import type { PixelSpriteName } from '@/shared/constants/pixelSprites';
import { Pressable } from '@/shared/components/ui/Pressable';
import type { DevicePickerOwner } from '@/types/device.types';
import type { Theme } from '@/shared/theme/types';
import type { createPickerStyles } from './devicePickerStyles';
import { Text } from '@/shared/components/ui/Text';

export type PickerDevice = DevicePickerOwner['devices'][number];

const deviceIcon = (platform: string): PixelSpriteName =>
	platform === 'web' ? 'laptop' : 'phone';

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
					name={deviceIcon(device.platform)}
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
