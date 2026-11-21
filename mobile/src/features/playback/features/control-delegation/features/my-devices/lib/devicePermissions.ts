import type {
	UserDevice,
	UserDeviceWithLicenses,
	FriendUserSummary,
} from '@/features/playback/features/control-delegation/shared/delegation/types/delegationTypes';
import type {
	DeviceAccess,
	FriendLicense,
} from '@/features/playback/features/control-delegation/features/my-devices/myDevicesTypes';

export function pairKey(deviceId: string, userId: string): string {
	return `${deviceId}|${userId}`;
}

export function setPair(set: Set<string>, key: string, on: boolean): Set<string> {
	const next = new Set(set);
	if (on) next.add(key);
	else next.delete(key);
	return next;
}

export function friendName(friend: FriendUserSummary): string {
	return friend.displayName || friend.username;
}

export function licensedPairs(devices: UserDeviceWithLicenses[]): Set<string> {
	const pairs = new Set<string>();
	for (const device of devices) {
		for (const license of device.licenses) {
			pairs.add(pairKey(device.deviceId, license.user.id));
		}
	}
	return pairs;
}

export function friendLicenses(device: UserDevice, access: DeviceAccess): FriendLicense[] {
	return access.friends.map(friend => {
		const key = pairKey(device.deviceId, friend.id);
		const allDevices = access.allDevicesFriendIds.has(friend.id);
		const isPending = access.pending.has(key);
		return {
			friend,
			key,
			value: allDevices || access.licensed.has(key),
			disabled: allDevices || isPending,
			isPending,
			allDevices,
		};
	});
}
