import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { UserDeviceWithLicenses } from '@/features/playback/features/control-delegation/shared/delegation/types/delegationTypes';
import { DeviceFriendList } from '@/features/playback/features/control-delegation/features/my-devices/components/presenters/DeviceFriendList';
import { DeviceHeader } from '@/features/playback/features/control-delegation/features/my-devices/components/presenters/DeviceHeader';
import type {
	DeviceAccess,
	DeviceActions,
} from '@/features/playback/features/control-delegation/features/my-devices/myDevicesTypes';

type DeviceCardProps = {
	device: UserDeviceWithLicenses;
	isCurrent: boolean;
	access: DeviceAccess;
	actions: DeviceActions;
};

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		card: {
			backgroundColor: theme.colors.surface,
			paddingHorizontal: theme.spacing.lg,
			paddingVertical: theme.spacing.sm,
			marginBottom: theme.spacing.lg,
		},
		divider: {
			height: theme.borders.hairline,
			backgroundColor: theme.colors.border,
			marginVertical: theme.spacing.xs,
		},
	});
	return styles;
}

export function DeviceCard({ device, isCurrent, access, actions }: DeviceCardProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.card} testID={`device-${device.deviceId}`}>
			<DeviceHeader device={device} isCurrent={isCurrent} onOpenRename={actions.onOpenRename} />
			<View style={styles.divider} />
			<DeviceFriendList device={device} access={access} actions={actions} />
		</View>
	);
}
