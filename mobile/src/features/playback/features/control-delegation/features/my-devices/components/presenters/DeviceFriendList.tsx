import React from 'react';
import { DeviceEmptyState } from '@/features/playback/features/control-delegation/features/my-devices/components/presenters/DeviceEmptyState';
import type { UserDeviceWithLicenses } from '@/features/playback/features/control-delegation/shared/delegation/types/delegationTypes';
import { DeviceFriendRow } from '@/features/playback/features/control-delegation/features/my-devices/components/presenters/DeviceFriendRow';
import { friendLicenses } from '@/features/playback/features/control-delegation/features/my-devices/lib/devicePermissions';
import type {
	DeviceAccess,
	DeviceActions,
} from '@/features/playback/features/control-delegation/features/my-devices/myDevicesTypes';

type DeviceFriendListProps = {
	device: UserDeviceWithLicenses;
	access: DeviceAccess;
	actions: DeviceActions;
};

export function DeviceFriendList({ device, access, actions }: DeviceFriendListProps) {
	if (access.friends.length === 0) {
		return (
			<DeviceEmptyState
				message="Aucun ami pour l'instant. Suivez des personnes qui vous suivent en retour : elles deviendront vos amis et vous pourrez leur confier cet appareil."
				action={{ label: 'Trouver des amis', onPress: actions.onNavigateFriends }}
			/>
		);
	}
	return (
		<>
			{friendLicenses(device, access).map((license) => (
				<DeviceFriendRow
					key={license.friend.id}
					license={license}
					deviceName={device.deviceName}
					onToggle={(next) => actions.onToggle(device, license.friend, next)}
				/>
			))}
		</>
	);
}
