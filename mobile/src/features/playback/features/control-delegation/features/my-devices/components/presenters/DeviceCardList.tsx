import React from 'react';
import { DeviceEmptyState } from '@/features/playback/features/control-delegation/features/my-devices/components/presenters/DeviceEmptyState';
import type { UserDeviceWithLicenses } from '@/features/playback/features/control-delegation/shared/delegation/types/delegationTypes';
import { DeviceCard } from '@/features/playback/features/control-delegation/features/my-devices/components/presenters/DeviceCard';
import type {
	DeviceAccess,
	DeviceActions,
} from '@/features/playback/features/control-delegation/features/my-devices/myDevicesTypes';
import PhoneRingingLowSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/phone-ringing-low-solid.svg';

type DeviceCardListProps = {
	devices: UserDeviceWithLicenses[];
	currentDeviceId: string | null;
	access: DeviceAccess;
	actions: DeviceActions;
};

export function DeviceCardList({ devices, currentDeviceId, access, actions }: DeviceCardListProps) {
	if (devices.length === 0) {
		return (
			<DeviceEmptyState
				icon={PhoneRingingLowSolid}
				message="Aucun appareil. Ouvrez Zumik sur un appareil pour le voir ici."
			/>
		);
	}
	return (
		<>
			{devices.map(device => (
				<DeviceCard
					key={device.deviceId}
					device={device}
					isCurrent={device.deviceId === currentDeviceId}
					access={access}
					actions={actions}
				/>
			))}
		</>
	);
}
