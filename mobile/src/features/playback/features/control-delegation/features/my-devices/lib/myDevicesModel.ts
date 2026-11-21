import type { MyDevicesState } from '@/features/playback/features/control-delegation/features/my-devices/myDevicesTypes';

export function myDevicesModel({ data, ...status }: MyDevicesState, pending: Set<string>) {
	return {
		status,
		devices: data.devices,
		currentDeviceId: data.currentDeviceId,
		access: {
			friends: data.friends,
			allDevicesFriendIds: data.allDevicesFriendIds,
			licensed: data.licensed,
			pending,
		},
	};
}
