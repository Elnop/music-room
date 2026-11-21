import React from 'react';
import { View, StyleSheet } from 'react-native';
import LaptopSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/laptop-solid.svg';
import PhoneRingingLowSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/phone-ringing-low-solid.svg';
import PencilSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/pencil-solid.svg';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { UserDeviceWithLicenses } from '@/features/playback/features/control-delegation/shared/delegation/types/delegationTypes';
import { DeviceHeaderText } from '@/features/playback/features/control-delegation/features/my-devices/components/presenters/DeviceHeaderText';

type DeviceHeaderProps = {
	device: UserDeviceWithLicenses;
	isCurrent: boolean;
	onOpenRename: (device: UserDeviceWithLicenses) => void;
};

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		deviceHeader: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingVertical: theme.spacing.sm,
		},
		iconWrapper: {
			width: theme.controls.iconButtonLarge,
			height: theme.controls.iconButtonLarge,
			alignItems: 'center',
			justifyContent: 'center',
			marginRight: theme.spacing.md,
			backgroundColor: theme.colors.primaryTint,
		},
		renameButton: { padding: theme.spacing.xs },
	});
	return styles;
}

export function DeviceHeader({ device, isCurrent, onOpenRename }: DeviceHeaderProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const icon = device.platform === 'web' ? LaptopSolid : PhoneRingingLowSolid;

	return (
		<View style={styles.deviceHeader}>
			<View style={styles.iconWrapper}>
				<PixelIcon icon={icon} size={20} color={theme.colors.primary} />
			</View>
			<DeviceHeaderText device={device} isCurrent={isCurrent} />
			<Pressable
				onPress={() => onOpenRename(device)}
				accessibilityRole="button"
				accessibilityLabel={`Renommer l'appareil ${device.deviceName}`}
				hitSlop={8}
				style={styles.renameButton}
			>
				<PixelIcon icon={PencilSolid} size={20} color={theme.colors.textSecondary} />
			</Pressable>
		</View>
	);
}
