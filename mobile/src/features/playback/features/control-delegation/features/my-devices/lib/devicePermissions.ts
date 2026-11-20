import type { UserDeviceWithLicenses } from '@/features/playback/features/control-delegation/shared/delegation/lib/types';
import type { FriendUserSummary } from '@/features/playback/features/control-delegation/shared/delegation/lib/types';

export const pairKey = (deviceId: string, userId: string): string => `${deviceId}|${userId}`;

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
